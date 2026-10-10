import { v4 as uuid } from 'uuid';
import { dbQuery } from '../../db/client';
import { DEMO_USER_ID } from '../../lib/app-defaults';

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

export async function createOrder(input: { addressId: string; grandTotal?: number }, userId = DEMO_USER_ID) {
  const id = uuid();
  const orderNumber = `IR${Date.now()}`;
  await dbQuery(
    `INSERT INTO orders (id, user_id, address_id, order_number, status, payment_status, subtotal, grand_total)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, userId, input.addressId, orderNumber, 'created', 'pending', input.grandTotal ?? 0, input.grandTotal ?? 0]
  );

  return {
    id,
    userId,
    orderNumber,
    status: 'created',
    paymentStatus: 'pending',
    grandTotal: input.grandTotal ?? 0,
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
