import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { dbQuery } from '../../db/client';
import { DEMO_PARTNER_ID } from '../../lib/app-defaults';
import { asyncHandler } from '../../lib/async-handler';
import { signAccessToken } from '../../lib/jwt';

const router = Router();

router.post('/login', asyncHandler(async (request, response) => {
  const payload = z.object({ mobile: z.string().min(10) }).parse(request.body);
  const { rows } = await dbQuery<{ id: string; mobile: string }>('SELECT id, mobile FROM delivery_partners WHERE mobile = $1 AND is_active = TRUE LIMIT 1', [payload.mobile]);
  const partner = rows[0];

  if (!partner) {
    response.status(404).json({ message: 'Partner not found' });
    return;
  }

  response.json({
    message: 'Partner login accepted',
    token: signAccessToken({ sub: partner.id, role: 'partner', mobile: partner.mobile })
  });
}));

router.get('/orders/assigned', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery(
    `SELECT da.id, o.order_number, s.name AS pickup, a.address_line_1 AS drop, da.status,
            EXTRACT(EPOCH FROM NOW() - COALESCE(da.picked_at, da.assigned_at, NOW()))::int / 60 AS eta_minutes
     FROM delivery_assignments da
     INNER JOIN orders o ON o.id = da.order_id
     LEFT JOIN stores s ON s.id = o.store_id
     LEFT JOIN addresses a ON a.id = o.address_id
     WHERE da.partner_id = $1
     ORDER BY COALESCE(da.assigned_at, NOW()) DESC`,
    [DEMO_PARTNER_ID]
  );
  response.json(rows);
}));

router.post('/orders/:id/accept', asyncHandler(async (request, response) => {
  await dbQuery('UPDATE delivery_assignments SET status = $1, assigned_at = COALESCE(assigned_at, NOW()) WHERE order_id = $2', ['accepted', request.params.id]);
  await dbQuery('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['assigned', request.params.id]);
  response.json({ orderId: request.params.id, status: 'accepted' });
}));

router.post('/orders/:id/picked', asyncHandler(async (request, response) => {
  await dbQuery('UPDATE delivery_assignments SET status = $1, picked_at = NOW() WHERE order_id = $2', ['picked_up', request.params.id]);
  await dbQuery('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['picked_up', request.params.id]);
  response.json({ orderId: request.params.id, status: 'picked_up' });
}));

router.post('/orders/:id/delivered', asyncHandler(async (request, response) => {
  await dbQuery('UPDATE delivery_assignments SET status = $1, delivered_at = NOW() WHERE order_id = $2', ['delivered', request.params.id]);
  await dbQuery('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['delivered', request.params.id]);
  response.json({ orderId: request.params.id, status: 'delivered' });
}));

router.post('/location/update', asyncHandler(async (request, response) => {
  const payload = z.object({ assignmentId: z.string(), latitude: z.number(), longitude: z.number() }).parse(request.body);
  await dbQuery('INSERT INTO delivery_locations (id, assignment_id, latitude, longitude) VALUES ($1, $2, $3, $4)', [uuid(), payload.assignmentId, payload.latitude, payload.longitude]);
  response.json({ message: 'Location updated' });
}));

router.get('/earnings', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery<{ today: string; week: string; completed_orders: string }>(
    `SELECT
        COALESCE(SUM(CASE WHEN DATE(delivered_at) = CURRENT_DATE THEN 220 ELSE 0 END), 0)::text AS today,
        COALESCE(SUM(CASE WHEN delivered_at >= NOW() - INTERVAL '7 days' THEN 220 ELSE 0 END), 0)::text AS week,
        COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END)::text AS completed_orders
     FROM delivery_assignments
     WHERE partner_id = $1`,
    [DEMO_PARTNER_ID]
  );

  response.json({
    today: Number(rows[0]?.today ?? 0),
    week: Number(rows[0]?.week ?? 0),
    completedOrders: Number(rows[0]?.completed_orders ?? 0)
  });
}));

export default router;
