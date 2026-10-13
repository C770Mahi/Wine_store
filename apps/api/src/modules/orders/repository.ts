import { QueryResultRow } from 'pg';
import { v4 as uuid } from 'uuid';
import { dbQuery, dbTransaction } from '../../db/client';
import { DEFAULT_STORE_ID, DEMO_USER_ID } from '../../lib/app-defaults';
import { getCart } from '../cart/repository';

type DbExecutor = {
  query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<{
    rows: T[];
    rowCount: number | null;
  }>;
};

type CheckoutSummary = {
  subtotal: number;
  discount: number;
  tax: number;
  delivery: number;
  payable: number;
};

type CheckoutSessionItem = {
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  lineTotal: number;
};

type CheckoutSnapshot = {
  summary: CheckoutSummary;
  coupon?: {
    code: string;
    discountAmount: number;
  };
  items: CheckoutSessionItem[];
  address?: {
    recipientName: string;
    mobile: string;
    houseNo?: string;
    apartmentName?: string | null;
    streetArea?: string | null;
    addressLine1: string;
    addressLine2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    country?: string;
    pincode: string;
    latitude?: number | null;
    longitude?: number | null;
    formattedAddress?: string | null;
    googleMapsLink?: string | null;
  };
};

type CheckoutSessionRow = {
  id: string;
  user_id: string;
  address_id: string;
  cart_id: string;
  slot: string | null;
  payment_method: string;
  age_confirmed: boolean;
  currency: string;
  snapshot: CheckoutSnapshot | string;
  razorpay_order_id: string;
  created_order_id: string | null;
};

function formatVariantLabel(quantity: number, unit: string) {
  if (unit === 'g' && quantity >= 1000) {
    return `${quantity / 1000} kg`;
  }

  if (unit === 'ml' && quantity >= 1000) {
    return `${quantity / 1000} L`;
  }

  return `${quantity} ${unit}`;
}

function buildOrderNumber() {
  return `NK${Date.now()}`;
}

function buildSpecialInstructions(slot?: string | null, paymentMethod?: string | null) {
  if (slot && paymentMethod) {
    return `Requested slot: ${slot} | Payment: ${paymentMethod}`;
  }

  if (slot) {
    return `Requested slot: ${slot}`;
  }

  if (paymentMethod) {
    return `Payment: ${paymentMethod}`;
  }

  return null;
}

function buildGoogleMapsLink(latitude?: number | null, longitude?: number | null) {
  return latitude != null && longitude != null ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;
}

function buildFormattedAddress(address: {
  houseNo?: string;
  apartmentName?: string | null;
  streetArea?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  addressLine1?: string;
  addressLine2?: string | null;
}) {
  return [
    address.houseNo ?? address.addressLine1,
    address.apartmentName ?? address.addressLine2,
    address.streetArea,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    address.country ?? 'India'
  ].filter(Boolean).join(', ');
}

function parseCheckoutSnapshot(value: CheckoutSnapshot | string) {
  return typeof value === 'string' ? JSON.parse(value) as CheckoutSnapshot : value;
}

function mapOrderSummary(row: {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  grand_total: number;
  created_at?: Date | string;
  payment_method?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  delivery_address?: string | null;
  google_map_link?: string | null;
}, userId: string) {
  return {
    id: row.id,
    userId,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    grandTotal: Number(row.grand_total),
    deliveryEta: '18 mins',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    paymentMethod: row.payment_method ?? 'Razorpay',
    razorpayOrderId: row.razorpay_order_id ?? null,
    razorpayPaymentId: row.razorpay_payment_id ?? null,
    deliveryAddress: row.delivery_address ?? '',
    googleMapsLink: row.google_map_link ?? ''
  };
}

async function queryOrderSummaryById(executor: DbExecutor, id: string, userId: string) {
  const { rows } = await executor.query<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    grand_total: number;
    created_at: Date | string;
    payment_method: string | null;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    delivery_address: string | null;
    google_map_link: string | null;
  }>(
    `SELECT id, order_number, status, payment_status, grand_total, created_at, payment_method, razorpay_order_id, razorpay_payment_id, delivery_address, google_map_link
     FROM orders
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, userId]
  );

  const row = rows[0];
  return row ? mapOrderSummary(row, userId) : null;
}

async function insertOrderItems(executor: DbExecutor, orderId: string, items: CheckoutSessionItem[]) {
  for (const item of items) {
    await executor.query(
      `INSERT INTO order_items (id, order_id, variant_id, product_name, variant_name, quantity, unit_price, tax_amount, line_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuid(),
        orderId,
        item.variantId,
        item.productName,
        item.variantName,
        item.quantity,
        item.unitPrice,
        item.taxAmount,
        item.lineTotal
      ]
    );
  }
}

export async function listOrders(userId = DEMO_USER_ID) {
  const { rows } = await dbQuery<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    grand_total: number;
    created_at: Date | string;
    payment_method: string | null;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    delivery_address: string | null;
    google_map_link: string | null;
  }>(
    `SELECT id, order_number, status, payment_status, grand_total, created_at, payment_method, razorpay_order_id, razorpay_payment_id, delivery_address, google_map_link
     FROM orders
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map((row) => mapOrderSummary(row, userId));
}

export async function getOrderById(id: string, userId = DEMO_USER_ID) {
  const { rows } = await dbQuery<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    grand_total: number;
    created_at: Date | string;
    payment_method: string | null;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    delivery_contact_name: string | null;
    delivery_mobile: string | null;
    delivery_address: string | null;
    google_map_link: string | null;
    recipient_name: string;
    mobile: string;
    house_no: string | null;
    apartment_name: string | null;
    street_area: string | null;
    address_line_1: string;
    address_line_2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    country: string;
    pincode: string;
  }>(
    `SELECT o.id, o.order_number, o.status, o.payment_status, o.grand_total, o.created_at, o.payment_method,
            o.razorpay_order_id, o.razorpay_payment_id, o.delivery_contact_name, o.delivery_mobile, o.delivery_address, o.google_map_link,
            a.recipient_name, a.mobile, a.house_no, a.apartment_name, a.street_area, a.address_line_1,
            a.address_line_2, a.landmark, a.city, a.state, a.country, a.pincode
     FROM orders o
     INNER JOIN addresses a ON a.id = o.address_id
     WHERE o.id = $1 AND o.user_id = $2
     LIMIT 1`,
    [id, userId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    ...mapOrderSummary({
      ...row,
      delivery_address: row.delivery_address ?? buildFormattedAddress({
        houseNo: row.house_no ?? row.address_line_1,
        apartmentName: row.apartment_name ?? row.address_line_2,
        streetArea: row.street_area,
        landmark: row.landmark,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        country: row.country
      }),
      google_map_link: row.google_map_link ?? null
    }, userId),
    deliveryAddress: {
      recipientName: row.delivery_contact_name ?? row.recipient_name,
      mobile: row.delivery_mobile ?? row.mobile,
      addressLine1: row.address_line_1,
      addressLine2: row.apartment_name ?? row.address_line_2,
      landmark: row.landmark,
      city: row.city,
      state: row.state,
      pincode: row.pincode
    }
  };
}

export async function prepareCheckoutSession(input: { userId?: string; addressId: string; slot?: string; paymentMethod?: string; ageConfirmed: boolean }) {
  const userId = input.userId ?? DEMO_USER_ID;
  const cart = await getCart(userId);

  if (!cart.items.length) {
    throw new Error('Cart is empty');
  }

  const [addressResult, customerResult, cartItems] = await Promise.all([
    dbQuery<{
      id: string;
      recipient_name: string;
      mobile: string;
      house_no: string | null;
      apartment_name: string | null;
      street_area: string | null;
      address_line_1: string;
      address_line_2: string | null;
      landmark: string | null;
      formatted_address: string | null;
      city: string;
      state: string;
      country: string;
      pincode: string;
      latitude: number | string | null;
      longitude: number | string | null;
      google_map_link: string | null;
    }>(
      `SELECT id, recipient_name, mobile, house_no, apartment_name, street_area, address_line_1, address_line_2, landmark, formatted_address, city, state, country, pincode, latitude, longitude, google_map_link
       FROM addresses
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [input.addressId, userId]
    ),
    dbQuery<{
      name: string;
      email: string | null;
      mobile: string | null;
    }>('SELECT name, email, mobile FROM users WHERE id = $1 LIMIT 1', [userId]),
    dbQuery<{
      variant_id: string;
      quantity: number;
      unit_price: number;
      product_name: string;
      volume_ml: number;
      pack_type: string;
    }>(
      `SELECT ci.variant_id, ci.quantity, ci.unit_price, p.name AS product_name, pv.volume_ml, pv.pack_type
       FROM carts c
       INNER JOIN cart_items ci ON ci.cart_id = c.id
       INNER JOIN product_variants pv ON pv.id = ci.variant_id
       INNER JOIN products p ON p.id = pv.product_id
       WHERE c.id = $1
       ORDER BY ci.created_at ASC`,
      [cart.id]
    )
  ]);

  const address = addressResult.rows[0];
  if (!address) {
    throw new Error('Address not found');
  }

  const customer = customerResult.rows[0];
  const items = cartItems.rows.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);
    const taxAmount = Math.round(unitPrice * quantity * 0.14);
    return {
      variantId: item.variant_id,
      productName: item.product_name,
      variantName: formatVariantLabel(Number(item.volume_ml), String(item.pack_type ?? 'ml')),
      quantity,
      unitPrice,
      taxAmount,
      lineTotal: unitPrice * quantity + taxAmount
    };
  });

  return {
    userId,
    cartId: cart.id,
    addressId: address.id,
    slot: input.slot ?? null,
    paymentMethod: input.paymentMethod ?? 'Razorpay',
    ageConfirmed: input.ageConfirmed,
    customer: {
      name: customer?.name ?? address.recipient_name,
      email: customer?.email ?? '',
      contact: address.mobile || customer?.mobile || ''
    },
    address: {
      recipientName: address.recipient_name,
      mobile: address.mobile,
      addressLine1: address.address_line_1,
      addressLine2: address.address_line_2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    },
    snapshot: {
      address: {
        recipientName: address.recipient_name,
        mobile: address.mobile,
        houseNo: address.house_no ?? undefined,
        apartmentName: address.apartment_name,
        streetArea: address.street_area,
        addressLine1: address.address_line_1,
        addressLine2: address.address_line_2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        country: address.country,
        pincode: address.pincode,
        latitude: address.latitude == null ? null : Number(address.latitude),
        longitude: address.longitude == null ? null : Number(address.longitude),
        formattedAddress: address.formatted_address ?? buildFormattedAddress({
          houseNo: address.house_no ?? address.address_line_1,
          apartmentName: address.apartment_name ?? address.address_line_2,
          streetArea: address.street_area,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country
        }),
        googleMapsLink: address.google_map_link ?? buildGoogleMapsLink(address.latitude == null ? null : Number(address.latitude), address.longitude == null ? null : Number(address.longitude))
      },
      summary: {
        subtotal: Number(cart.summary.subtotal),
        discount: Number(cart.summary.discount),
        tax: Number(cart.summary.tax),
        delivery: Number(cart.summary.delivery),
        payable: Number(cart.summary.payable)
      },
      coupon: cart.coupon,
      items
    }
  };
}

export async function createOrderFromCheckoutSession(input: {
  checkoutSessionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
  paymentStatus: string;
  paymentMethod: string;
  metadata?: Record<string, unknown> | null;
}) {
  return dbTransaction(async (client) => {
    const { rows } = await client.query<CheckoutSessionRow>(
      `SELECT id, user_id, address_id, cart_id, slot, payment_method, age_confirmed, currency, snapshot,
              razorpay_order_id, created_order_id
       FROM checkout_sessions
       WHERE id = $1
       FOR UPDATE`,
      [input.checkoutSessionId]
    );

    const session = rows[0];
    if (!session) {
      throw new Error('Checkout session not found');
    }

    if (session.razorpay_order_id !== input.razorpayOrderId) {
      throw new Error('Razorpay order mismatch');
    }

    if (session.created_order_id) {
      const normalizedPaymentStatus = input.paymentStatus === 'failed'
        ? 'failed'
        : input.paymentStatus === 'refunded'
          ? 'refunded'
          : 'paid';

      await client.query(
        `UPDATE orders
         SET payment_status = $1,
             payment_method = COALESCE($2, payment_method),
             razorpay_order_id = COALESCE($3, razorpay_order_id),
             razorpay_payment_id = COALESCE($4, razorpay_payment_id),
             updated_at = NOW()
         WHERE id = $5`,
        [
          normalizedPaymentStatus,
          input.paymentMethod || session.payment_method,
          input.razorpayOrderId,
          input.razorpayPaymentId,
          session.created_order_id
        ]
      );

      await client.query(
        `UPDATE payments
         SET provider_order_id = $1,
             provider_payment_id = $2,
             provider_signature = COALESCE($3, provider_signature),
             method = $4,
             status = $5,
             metadata = COALESCE($6::jsonb, metadata),
             failure_reason = NULL,
             paid_at = COALESCE(paid_at, NOW()),
             updated_at = NOW()
         WHERE order_id = $7`,
        [
          input.razorpayOrderId,
          input.razorpayPaymentId,
          input.razorpaySignature ?? null,
          input.paymentMethod || session.payment_method,
          input.paymentStatus,
          input.metadata ? JSON.stringify(input.metadata) : null,
          session.created_order_id
        ]
      );

      const existingOrder = await queryOrderSummaryById(client, session.created_order_id, session.user_id);
      if (!existingOrder) {
        throw new Error('Order already exists but could not be loaded');
      }
      return existingOrder;
    }

    const snapshot = parseCheckoutSnapshot(session.snapshot);
    if (!snapshot.items.length) {
      throw new Error('Checkout session has no items');
    }

    const snapshotAddress = snapshot.address;
    const deliveryAddress = snapshotAddress
      ? snapshotAddress.formattedAddress || buildFormattedAddress(snapshotAddress)
      : null;
    const deliveryLatitude = snapshotAddress?.latitude ?? null;
    const deliveryLongitude = snapshotAddress?.longitude ?? null;
    const googleMapLink = snapshotAddress?.googleMapsLink ?? buildGoogleMapsLink(deliveryLatitude, deliveryLongitude);

    const orderId = uuid();
    const orderNumber = buildOrderNumber();
    const normalizedPaymentStatus = input.paymentStatus === 'failed'
      ? 'failed'
      : input.paymentStatus === 'refunded'
        ? 'refunded'
        : 'paid';

    await client.query(
      `INSERT INTO orders (
         id, user_id, store_id, address_id, order_number, status, payment_status, payment_method,
         razorpay_order_id, razorpay_payment_id, subtotal, discount_total, tax_total, delivery_fee,
         grand_total, special_instructions, delivery_contact_name, delivery_mobile, delivery_address,
         delivery_latitude, delivery_longitude, google_map_link, age_confirmed, placed_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())`,
      [
        orderId,
        session.user_id,
        DEFAULT_STORE_ID,
        session.address_id,
        orderNumber,
        'confirmed',
        normalizedPaymentStatus,
        input.paymentMethod || session.payment_method,
        input.razorpayOrderId,
        input.razorpayPaymentId,
        snapshot.summary.subtotal,
        snapshot.summary.discount,
        snapshot.summary.tax,
        snapshot.summary.delivery,
        snapshot.summary.payable,
        buildSpecialInstructions(session.slot, input.paymentMethod || session.payment_method),
        snapshotAddress?.recipientName ?? null,
        snapshotAddress?.mobile ?? null,
        deliveryAddress,
        deliveryLatitude,
        deliveryLongitude,
        googleMapLink,
        session.age_confirmed
      ]
    );

    await insertOrderItems(client, orderId, snapshot.items);

    const existingPayment = await client.query<{ id: string }>(
      'SELECT id FROM payments WHERE provider_payment_id = $1 LIMIT 1',
      [input.razorpayPaymentId]
    );

    if (existingPayment.rows[0]) {
      await client.query(
        `UPDATE payments
         SET order_id = $1,
             provider = $2,
             provider_order_id = $3,
             method = $4,
             status = $5,
             amount = $6,
             currency = $7,
             provider_signature = COALESCE($8, provider_signature),
             metadata = COALESCE($9::jsonb, metadata),
             paid_at = COALESCE(paid_at, NOW()),
             failure_reason = NULL,
             updated_at = NOW()
         WHERE id = $10`,
        [
          orderId,
          'razorpay',
          input.razorpayOrderId,
          input.paymentMethod || session.payment_method,
          input.paymentStatus,
          snapshot.summary.payable,
          session.currency,
          input.razorpaySignature ?? null,
          input.metadata ? JSON.stringify(input.metadata) : null,
          existingPayment.rows[0].id
        ]
      );
    } else {
      await client.query(
        `INSERT INTO payments (
           id, order_id, provider, provider_payment_id, provider_order_id, provider_signature, method,
           status, amount, currency, metadata, paid_at, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW(), NOW(), NOW())`,
        [
          uuid(),
          orderId,
          'razorpay',
          input.razorpayPaymentId,
          input.razorpayOrderId,
          input.razorpaySignature ?? null,
          input.paymentMethod || session.payment_method,
          input.paymentStatus,
          snapshot.summary.payable,
          session.currency,
          input.metadata ? JSON.stringify(input.metadata) : null
        ]
      );
    }

    await client.query(
      `UPDATE checkout_sessions
       SET status = $1,
           razorpay_payment_id = $2,
           razorpay_signature = COALESCE($3, razorpay_signature),
           failure_reason = NULL,
           created_order_id = $4,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $5`,
      ['paid', input.razorpayPaymentId, input.razorpaySignature ?? null, orderId, session.id]
    );

    await client.query(
      `UPDATE carts
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2 AND status = $3`,
      ['converted', session.cart_id, 'active']
    );

    return {
      id: orderId,
      userId: session.user_id,
      orderNumber,
      status: 'confirmed',
      paymentStatus: normalizedPaymentStatus,
      grandTotal: snapshot.summary.payable,
      deliveryEta: '18 mins',
      createdAt: new Date().toISOString(),
      paymentMethod: input.paymentMethod || session.payment_method,
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId
    };
  });
}

export async function getTracking(orderId: string) {
  const { rows } = await dbQuery<{
    assignment_id: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
  }>(
    `SELECT da.id AS assignment_id, da.status, dl.latitude, dl.longitude
     FROM delivery_assignments da
     LEFT JOIN LATERAL (
       SELECT latitude, longitude
       FROM delivery_locations
       WHERE assignment_id = da.id
       ORDER BY recorded_at DESC
       LIMIT 1
     ) dl ON TRUE
     WHERE da.order_id = $1
     ORDER BY da.assigned_at DESC NULLS LAST
     LIMIT 1`,
    [orderId]
  );

  const assignment = rows[0];
  return {
    status: assignment?.status ?? 'confirmed',
    timeline: ['confirmed', 'packed', 'out_for_delivery', 'delivered'],
    driverLocation: assignment?.latitude && assignment?.longitude ? { latitude: Number(assignment.latitude), longitude: Number(assignment.longitude) } : null,
    etaMinutes: 12
  };
}
