import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { Request, Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { dbQuery } from '../../db/client';
import { asyncHandler } from '../../lib/async-handler';
import { getRequestUserId, requireApprovedCustomer } from '../../middleware/auth';
import { createOrderFromCheckoutSession, prepareCheckoutSession } from '../orders/repository';

const router = Router();

const checkoutSessionPayloadSchema = z.object({
  addressId: z.string().min(1),
  slot: z.string().trim().optional(),
  ageConfirmed: z.boolean().default(false)
});

const verifyPaymentPayloadSchema = z.object({
  checkoutSessionId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1)
});

const recordFailurePayloadSchema = z.object({
  checkoutSessionId: z.string().min(1),
  razorpayOrderId: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  step: z.string().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

type RazorpayOrderResponse = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
};

type RazorpayPaymentDetails = {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  amount_refunded?: number;
  refund_status?: string | null;
  captured?: boolean;
  description?: string | null;
  email?: string | null;
  contact?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  fee?: number | null;
  tax?: number | null;
  rrn?: string | null;
  notes?: Record<string, unknown> | null;
  error_code?: string | null;
  error_description?: string | null;
  acquirer_data?: Record<string, unknown> | null;
};

function ensureRazorpayConfigured() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
}

async function razorpayRequest<T>(path: string, init?: RequestInit) {
  ensureRazorpayConfigured();

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Razorpay request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function buildPaymentVerificationSignature(orderId: string, paymentId: string) {
  return createHmac('sha256', env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function normalizePaymentMethod(payment: Pick<RazorpayPaymentDetails, 'method' | 'wallet' | 'vpa'>) {
  const method = (payment.method ?? '').toLowerCase();

  if (method === 'upi') {
    return payment.vpa ? `UPI (${payment.vpa})` : 'UPI';
  }

  if (method === 'card') {
    return 'Card';
  }

  if (method === 'netbanking') {
    return 'Net Banking';
  }

  if (method === 'wallet') {
    return payment.wallet ? `Wallet (${payment.wallet})` : 'Wallet';
  }

  if (method === 'emi') {
    return 'EMI';
  }

  if (method === 'paylater') {
    return 'Pay Later';
  }

  return 'Razorpay';
}

function buildPaymentMetadata(payment: RazorpayPaymentDetails | null, fallback?: Record<string, unknown>) {
  if (!payment) {
    return fallback ?? null;
  }

  return {
    entity: payment.entity,
    description: payment.description ?? null,
    email: payment.email ?? null,
    contact: payment.contact ?? null,
    bank: payment.bank ?? null,
    wallet: payment.wallet ?? null,
    vpa: payment.vpa ?? null,
    fee: payment.fee ?? null,
    tax: payment.tax ?? null,
    rrn: payment.rrn ?? null,
    amountRefunded: payment.amount_refunded ?? 0,
    refundStatus: payment.refund_status ?? null,
    errorCode: payment.error_code ?? null,
    errorDescription: payment.error_description ?? null,
    acquirerData: payment.acquirer_data ?? null,
    notes: payment.notes ?? null,
    ...(fallback ?? {})
  };
}

async function fetchPaymentDetails(paymentId: string) {
  return razorpayRequest<RazorpayPaymentDetails>(`/payments/${paymentId}`);
}

async function markCheckoutSessionFailed(input: {
  checkoutSessionId?: string;
  razorpayOrderId?: string;
  failureReason: string;
  metadata?: Record<string, unknown>;
}) {
  const params: unknown[] = [input.failureReason, input.metadata ? JSON.stringify(input.metadata) : null];
  const conditions: string[] = [];

  if (input.checkoutSessionId) {
    params.push(input.checkoutSessionId);
    conditions.push(`id = $${params.length}`);
  }

  if (input.razorpayOrderId) {
    params.push(input.razorpayOrderId);
    conditions.push(`razorpay_order_id = $${params.length}`);
  }

  if (!conditions.length) {
    return;
  }

  await dbQuery(
    `UPDATE checkout_sessions
     SET status = 'failed',
         failure_reason = $1,
         metadata = CASE
           WHEN $2::jsonb IS NULL THEN metadata
           ELSE COALESCE(metadata, '{}'::jsonb) || $2::jsonb
         END,
         updated_at = NOW()
     WHERE ${conditions.join(' OR ')}`,
    params
  );
}

async function syncOrderAndPaymentFailure(input: {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  failureReason: string;
  metadata?: Record<string, unknown>;
}) {
  if (input.razorpayPaymentId) {
    await dbQuery(
      `UPDATE payments
       SET status = 'failed',
           failure_reason = $1,
           metadata = CASE
             WHEN $2::jsonb IS NULL THEN metadata
             ELSE COALESCE(metadata, '{}'::jsonb) || $2::jsonb
           END,
           updated_at = NOW()
       WHERE provider_payment_id = $3`,
      [input.failureReason, input.metadata ? JSON.stringify(input.metadata) : null, input.razorpayPaymentId]
    );

    await dbQuery(
      `UPDATE orders
       SET payment_status = 'failed',
           razorpay_payment_id = COALESCE($1, razorpay_payment_id),
           razorpay_order_id = COALESCE($2, razorpay_order_id),
           updated_at = NOW()
       WHERE id IN (
         SELECT order_id FROM payments WHERE provider_payment_id = $1
       )`,
      [input.razorpayPaymentId, input.razorpayOrderId ?? null]
    );
  }
}

async function finalizeSuccessfulPayment(input: {
  checkoutSessionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  paymentDetails: RazorpayPaymentDetails | null;
}) {
  const method = normalizePaymentMethod(input.paymentDetails ?? { method: 'razorpay', wallet: null, vpa: null });
  const paymentStatus = input.paymentDetails?.status ?? 'captured';

  return createOrderFromCheckoutSession({
    checkoutSessionId: input.checkoutSessionId,
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpaySignature: input.razorpaySignature,
    paymentStatus,
    paymentMethod: method,
    metadata: buildPaymentMetadata(input.paymentDetails)
  });
}

function verifyWebhookSignature(request: Request) {
  if (!env.razorpayWebhookSecret) {
    throw new Error('Razorpay webhook secret is not configured. Set RAZORPAY_WEBHOOK_SECRET.');
  }

  const signature = request.header('x-razorpay-signature');
  if (!signature) {
    throw new Error('Missing Razorpay webhook signature');
  }

  const rawBody = Buffer.isBuffer(request.body)
    ? request.body
    : Buffer.from(JSON.stringify(request.body ?? {}));

  const expectedSignature = createHmac('sha256', env.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex');

  if (!signaturesMatch(expectedSignature, signature)) {
    throw new Error('Invalid Razorpay webhook signature');
  }

  return JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
}

router.post('/razorpay/checkout-session', requireApprovedCustomer, asyncHandler(async (request, response) => {
  ensureRazorpayConfigured();

  const payload = checkoutSessionPayloadSchema.parse(request.body);
  const prepared = await prepareCheckoutSession({
    userId: getRequestUserId(request)!,
    addressId: payload.addressId,
    slot: payload.slot,
    paymentMethod: 'Razorpay',
    ageConfirmed: payload.ageConfirmed
  });

  const amountInPaise = Math.round(Number(prepared.snapshot.summary.payable) * 100);
  const razorpayOrder = await razorpayRequest<RazorpayOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `nk_${Date.now()}`,
      notes: {
        userId: prepared.userId,
        cartId: prepared.cartId,
        addressId: prepared.addressId
      }
    })
  });

  const { rows } = await dbQuery<{ id: string; created_order_id: string | null }>(
    `INSERT INTO checkout_sessions (
       id, user_id, cart_id, address_id, slot, payment_method, age_confirmed, amount, currency, snapshot,
       razorpay_order_id, status, metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13::jsonb)
     RETURNING id, created_order_id`,
    [
      cryptoRandomId(),
      prepared.userId,
      prepared.cartId,
      prepared.addressId,
      prepared.slot,
      prepared.paymentMethod,
      prepared.ageConfirmed,
      prepared.snapshot.summary.payable,
      'INR',
      JSON.stringify(prepared.snapshot),
      razorpayOrder.id,
      'created',
      JSON.stringify({
        customer: prepared.customer,
        address: prepared.address,
        supportedMethods: ['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet']
      })
    ]
  );

  response.status(201).json({
    checkoutSessionId: rows[0].id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: env.razorpayKeyId,
    customer: prepared.customer,
    description: 'Near Kart order payment',
    supportedMethods: ['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Credit Cards', 'Debit Cards', 'Net Banking', 'Wallets']
  });
}));

router.post('/razorpay/verify', requireApprovedCustomer, asyncHandler(async (request, response) => {
  ensureRazorpayConfigured();

  const payload = verifyPaymentPayloadSchema.parse(request.body);
  const expectedSignature = buildPaymentVerificationSignature(payload.razorpayOrderId, payload.razorpayPaymentId);

  if (!signaturesMatch(expectedSignature, payload.razorpaySignature)) {
    await markCheckoutSessionFailed({
      checkoutSessionId: payload.checkoutSessionId,
      razorpayOrderId: payload.razorpayOrderId,
      failureReason: 'Signature verification failed',
      metadata: { type: 'signature_verification_failed' }
    });
    response.status(400).json({ message: 'Payment verification failed' });
    return;
  }

  const session = await dbQuery<{ id: string; user_id: string; created_order_id: string | null }>(
    'SELECT id, user_id, created_order_id FROM checkout_sessions WHERE id = $1 AND user_id = $2 LIMIT 1',
    [payload.checkoutSessionId, getRequestUserId(request)!]
  );

  if (!session.rows[0]) {
    response.status(404).json({ message: 'Checkout session not found' });
    return;
  }

  const paymentDetails = await fetchPaymentDetails(payload.razorpayPaymentId);
  if (paymentDetails.order_id !== payload.razorpayOrderId) {
    response.status(400).json({ message: 'Payment order mismatch' });
    return;
  }

  const order = await finalizeSuccessfulPayment({
    checkoutSessionId: payload.checkoutSessionId,
    razorpayOrderId: payload.razorpayOrderId,
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpaySignature: payload.razorpaySignature,
    paymentDetails
  });

  response.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    razorpayOrderId: payload.razorpayOrderId,
    razorpayPaymentId: payload.razorpayPaymentId
  });
}));

router.post('/razorpay/failure', requireApprovedCustomer, asyncHandler(async (request, response) => {
  const payload = recordFailurePayloadSchema.parse(request.body);
  const failureReason = [payload.code, payload.description, payload.reason].filter(Boolean).join(' | ') || 'Payment failed';

  await markCheckoutSessionFailed({
    checkoutSessionId: payload.checkoutSessionId,
    razorpayOrderId: payload.razorpayOrderId,
    failureReason,
    metadata: {
      code: payload.code,
      source: payload.source,
      step: payload.step,
      reason: payload.reason,
      ...(payload.metadata ?? {})
    }
  });

  await syncOrderAndPaymentFailure({
    razorpayOrderId: payload.razorpayOrderId,
    failureReason,
    metadata: {
      code: payload.code,
      source: payload.source,
      step: payload.step,
      reason: payload.reason,
      ...(payload.metadata ?? {})
    }
  });

  response.json({ message: 'Payment failure recorded' });
}));

router.post('/webhook/razorpay', asyncHandler(async (request, response) => {
  const event = verifyWebhookSignature(request);
  const eventName = String(event.event ?? '');
  const payload = event.payload as Record<string, unknown> | undefined;
  const paymentEntity = payload?.payment as { entity?: RazorpayPaymentDetails } | undefined;
  const orderEntity = payload?.order as { entity?: { id?: string } } | undefined;
  const refundEntity = payload?.refund as { entity?: { id?: string; payment_id?: string; amount?: number; notes?: Record<string, unknown> | null } } | undefined;

  const payment = paymentEntity?.entity;
  const razorpayOrderId = payment?.order_id ?? orderEntity?.entity?.id;

  if (eventName === 'payment.failed') {
    const failureReason = payment?.error_description ?? 'Payment failed';
    await markCheckoutSessionFailed({
      razorpayOrderId,
      failureReason,
      metadata: buildPaymentMetadata(payment ?? null, { event: eventName }) ?? undefined
    });
    await syncOrderAndPaymentFailure({
      razorpayOrderId,
      razorpayPaymentId: payment?.id,
      failureReason,
      metadata: buildPaymentMetadata(payment ?? null, { event: eventName }) ?? undefined
    });
    response.status(200).send('ok');
    return;
  }

  if (['payment.authorized', 'payment.captured', 'order.paid'].includes(eventName) && payment?.id && razorpayOrderId) {
    const session = await dbQuery<{ id: string; created_order_id: string | null }>(
      'SELECT id, created_order_id FROM checkout_sessions WHERE razorpay_order_id = $1 LIMIT 1',
      [razorpayOrderId]
    );

    if (session.rows[0]) {
      await finalizeSuccessfulPayment({
        checkoutSessionId: session.rows[0].id,
        razorpayOrderId,
        razorpayPaymentId: payment.id,
        paymentDetails: payment
      });
    }

    response.status(200).send('ok');
    return;
  }

  if (['refund.created', 'refund.processed'].includes(eventName) && refundEntity?.entity?.payment_id) {
    await dbQuery(
      `UPDATE payments
       SET status = 'refunded',
           metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
           updated_at = NOW()
       WHERE provider_payment_id = $2`,
      [
        JSON.stringify({
          event: eventName,
          refundId: refundEntity.entity.id ?? null,
          refundAmount: refundEntity.entity.amount ?? null,
          notes: refundEntity.entity.notes ?? null
        }),
        refundEntity.entity.payment_id
      ]
    );

    await dbQuery(
      `UPDATE orders
       SET payment_status = 'refunded',
           updated_at = NOW()
       WHERE id IN (
         SELECT order_id FROM payments WHERE provider_payment_id = $1
       )`,
      [refundEntity.entity.payment_id]
    );

    response.status(200).send('ok');
    return;
  }

  response.status(200).send('ok');
}));

router.get('/:orderId/status', asyncHandler(async (request, response) => {
  const { rows } = await dbQuery<{ status: string }>(
    'SELECT status FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
    [request.params.orderId]
  );

  response.json({ orderId: request.params.orderId, paymentStatus: rows[0]?.status ?? 'pending' });
}));

function cryptoRandomId() {
  return randomUUID();
}

export default router;
