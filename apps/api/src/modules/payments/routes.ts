import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { dbQuery } from '../../db/client';
import { asyncHandler } from '../../lib/async-handler';

const router = Router();

router.post('/create-intent', asyncHandler(async (request, response) => {
  const payload = z.object({ amount: z.number().positive().optional() }).parse(request.body ?? {});
  response.json({ clientSecret: `pi_${uuid().replace(/-/g, '')}_secret`, amount: payload.amount ?? 0 });
}));

router.post('/razorpay/create-order', asyncHandler(async (request, response) => {
  const payload = z.object({ amount: z.number().positive(), currency: z.string().default('INR') }).parse(request.body);
  response.json({ id: `order_${uuid().replace(/-/g, '')}`, amount: payload.amount * 100, currency: payload.currency });
}));

router.post('/verify', asyncHandler(async (request, response) => {
  const payload = z.object({
    orderId: z.string(),
    provider: z.string().default('manual'),
    method: z.string().default('UPI'),
    amount: z.number().positive(),
    providerPaymentId: z.string().optional(),
    providerOrderId: z.string().optional()
  }).parse(request.body);

  await dbQuery(
    `INSERT INTO payments (id, order_id, provider, provider_payment_id, provider_order_id, method, status, amount, currency, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INR', NOW())`,
    [uuid(), payload.orderId, payload.provider, payload.providerPaymentId ?? null, payload.providerOrderId ?? null, payload.method, 'paid', payload.amount]
  );
  await dbQuery('UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2', ['paid', payload.orderId]);

  response.json({ message: 'Payment verified', status: 'paid' });
}));

router.post('/webhook/stripe', asyncHandler(async (_request, response) => {
  response.status(200).send('ok');
}));

router.post('/webhook/razorpay', asyncHandler(async (_request, response) => {
  response.status(200).send('ok');
}));

router.get('/:orderId/status', asyncHandler(async (request, response) => {
  const { rows } = await dbQuery<{ status: string }>('SELECT status FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [request.params.orderId]);
  response.json({ orderId: request.params.orderId, paymentStatus: rows[0]?.status ?? 'pending' });
}));

export default router;
