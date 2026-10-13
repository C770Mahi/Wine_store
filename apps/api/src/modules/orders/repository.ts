import { v4 as uuid } from 'uuid';
import { dbQuery } from '../../db/client';
import { DEFAULT_STORE_ID, DEMO_USER_ID } from '../../lib/app-defaults';
import { getCart } from '../cart/repository';

function formatVariantLabel(quantity: number, unit: string) {
  if (unit === 'g' && quantity >= 1000) {
    return `${quantity / 1000} kg`;
  }

  if (unit === 'ml' && quantity >= 1000) {
    return `${quantity / 1000} L`;
  }

  return `${quantity} ${unit}`;
}

export async function listOrders(userId = DEMO_USER_ID) {
  const { rows } = await dbQuery<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    grand_total: number;
  }>('SELECT id, order_number, status, payment_status, grand_total FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

  return rows.map((row) => ({
    id: row.id,
    userId,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    grandTotal: Number(row.grand_total),
    deliveryEta: '18 mins'
  }));
}

export async function getOrderById(id: string, userId = DEMO_USER_ID) {
  const { rows } = await dbQuery<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    grand_total: number;
  }>('SELECT id, order_number, status, payment_status, grand_total FROM orders WHERE id = $1 AND user_id = $2 LIMIT 1', [id, userId]);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    grandTotal: Number(row.grand_total),
    deliveryEta: '18 mins'
  };
}

export async function createOrder(input: { userId?: string; addressId: string; slot?: string; paymentMethod?: string; ageConfirmed: boolean }) {
  const userId = input.userId ?? DEMO_USER_ID;

  const cart = await getCart(userId);

  if (!cart.items.length) {
    throw new Error('Cart is empty');
  }

  const address = await dbQuery<{ id: string }>('SELECT id FROM addresses WHERE id = $1 AND user_id = $2 LIMIT 1', [input.addressId, userId]);
  if (!address.rows[0]) {
    throw new Error('Address not found');
  }

  const cartItems = await dbQuery<{
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
     WHERE c.id = $1`,
    [cart.id]
  );

  const id = uuid();
  const orderNumber = `NK${Date.now()}`;
  await dbQuery(
    `INSERT INTO orders (id, user_id, store_id, address_id, order_number, status, payment_status, subtotal, discount_total, tax_total, delivery_fee, grand_total, special_instructions, age_confirmed, placed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
    [
      id,
      userId,
      DEFAULT_STORE_ID,
      input.addressId,
      orderNumber,
      'created',
      'pending',
      cart.summary.subtotal,
      cart.summary.discount,
      cart.summary.tax,
      cart.summary.delivery,
      cart.summary.payable,
      input.slot ? `Requested slot: ${input.slot}${input.paymentMethod ? ` | Payment: ${input.paymentMethod}` : ''}` : input.paymentMethod ? `Payment: ${input.paymentMethod}` : null,
      input.ageConfirmed
    ]
  );

  for (const item of cartItems.rows) {
    const taxAmount = Math.round(Number(item.unit_price) * Number(item.quantity) * 0.14);
    await dbQuery(
      `INSERT INTO order_items (id, order_id, variant_id, product_name, variant_name, quantity, unit_price, tax_amount, line_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuid(),
        id,
        item.variant_id,
        item.product_name,
        formatVariantLabel(Number(item.volume_ml), String(item.pack_type ?? 'ml')),
        Number(item.quantity),
        Number(item.unit_price),
        taxAmount,
        Number(item.unit_price) * Number(item.quantity) + taxAmount
      ]
    );
  }

  await dbQuery('UPDATE carts SET status = $1, updated_at = NOW() WHERE id = $2', ['converted', cart.id]);

  return {
    id,
    userId,
    orderNumber,
    status: 'created',
    paymentStatus: 'pending',
    grandTotal: cart.summary.payable,
    deliveryEta: '18 mins'
  };
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
    timeline: ['placed', 'confirmed', 'packed', 'assigned', 'picked_up'],
    driverLocation: assignment?.latitude && assignment?.longitude ? { latitude: Number(assignment.latitude), longitude: Number(assignment.longitude) } : null,
    etaMinutes: 12
  };
}
