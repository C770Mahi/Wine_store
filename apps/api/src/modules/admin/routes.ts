import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { dbQuery } from '../../db/client';
import { asyncHandler } from '../../lib/async-handler';
import { listProducts } from '../catalog/repository';

const router = Router();

router.get('/dashboard', asyncHandler(async (_request, response) => {
  const [ordersToday, revenueToday, activeCustomers, lowStock] = await Promise.all([
    dbQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM orders WHERE DATE(created_at) = CURRENT_DATE'),
    dbQuery<{ total: string }>('SELECT COALESCE(SUM(grand_total), 0)::text AS total FROM orders WHERE DATE(created_at) = CURRENT_DATE'),
    dbQuery<{ count: string }>("SELECT COUNT(*)::text AS count FROM users WHERE role = 'customer'"),
    dbQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM inventories WHERE stock_qty <= low_stock_threshold OR is_in_stock = FALSE')
  ]);

  response.json({
    ordersToday: Number(ordersToday.rows[0]?.count ?? 0),
    revenueToday: Number(revenueToday.rows[0]?.total ?? 0),
    activeCustomers: Number(activeCustomers.rows[0]?.count ?? 0),
    lowStockSkus: Number(lowStock.rows[0]?.count ?? 0),
    conversionRate: 18.6
  });
}));

router.get('/orders', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery('SELECT id, order_number, status, payment_status, grand_total, created_at FROM orders ORDER BY created_at DESC LIMIT 100');
  response.json(rows);
}));

router.patch('/orders/:id/status', asyncHandler(async (request, response) => {
  const payload = z.object({ status: z.string().min(3) }).parse(request.body);
  await dbQuery('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [payload.status, request.params.id]);
  response.json({ orderId: request.params.id, status: payload.status });
}));

router.get('/products', asyncHandler(async (_request, response) => {
  response.json(await listProducts());
}));

router.post('/products', asyncHandler(async (request, response) => {
  const payload = z.object({
    brandId: z.string(),
    categoryId: z.string(),
    name: z.string().min(2),
    slug: z.string().min(2),
    shortDescription: z.string().min(2),
    longDescription: z.string().min(2)
  }).parse(request.body);

  await dbQuery(
    `INSERT INTO products (id, brand_id, category_id, name, slug, short_description, long_description, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
    [uuid(), payload.brandId, payload.categoryId, payload.name, payload.slug, payload.shortDescription, payload.longDescription]
  );

  response.status(201).json({ message: 'Product created' });
}));

router.patch('/products/:id', asyncHandler(async (request, response) => {
  const payload = z.object({
    name: z.string().min(2).optional(),
    shortDescription: z.string().min(2).optional(),
    longDescription: z.string().min(2).optional(),
    isActive: z.boolean().optional()
  }).parse(request.body);

  await dbQuery(
    `UPDATE products
     SET name = COALESCE($1, name),
         short_description = COALESCE($2, short_description),
         long_description = COALESCE($3, long_description),
         is_active = COALESCE($4, is_active),
         updated_at = NOW()
     WHERE id = $5`,
    [payload.name ?? null, payload.shortDescription ?? null, payload.longDescription ?? null, payload.isActive ?? null, request.params.id]
  );

  response.json({ message: 'Product updated', id: request.params.id });
}));

router.get('/inventory', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery(
    `SELECT p.name AS product, pv.volume_ml, i.stock_qty, i.low_stock_threshold, i.is_in_stock
     FROM inventories i
     INNER JOIN product_variants pv ON pv.id = i.variant_id
     INNER JOIN products p ON p.id = pv.product_id
     ORDER BY p.name ASC, pv.volume_ml ASC`
  );
  response.json(rows);
}));

router.patch('/inventory/:id', asyncHandler(async (request, response) => {
  const payload = z.object({ stockQty: z.number().int().nonnegative(), isInStock: z.boolean() }).parse(request.body);
  await dbQuery('UPDATE inventories SET stock_qty = $1, is_in_stock = $2, updated_at = NOW() WHERE id = $3', [payload.stockQty, payload.isInStock, request.params.id]);
  response.json({ message: 'Inventory updated', id: request.params.id });
}));

router.get('/customers', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery(
    `SELECT u.id, u.name, u.email, u.mobile,
            COUNT(DISTINCT o.id)::int AS orders,
            COUNT(DISTINCT ci.id)::int AS active_cart_items
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     LEFT JOIN carts c ON c.user_id = u.id AND c.status = 'active'
     LEFT JOIN cart_items ci ON ci.cart_id = c.id
     WHERE u.role = 'customer'
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  response.json(rows);
}));

router.get('/coupons', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery('SELECT code, type, value, min_order_value, max_discount, is_active FROM coupons ORDER BY created_at DESC NULLS LAST, code ASC');
  response.json(rows);
}));

router.post('/coupons', asyncHandler(async (request, response) => {
  const payload = z.object({
    code: z.string().min(3),
    type: z.string().min(3),
    value: z.number().positive(),
    minOrderValue: z.number().nonnegative().optional(),
    maxDiscount: z.number().nonnegative().optional()
  }).parse(request.body);

  await dbQuery(
    `INSERT INTO coupons (id, code, type, value, min_order_value, max_discount, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
    [uuid(), payload.code, payload.type, payload.value, payload.minOrderValue ?? null, payload.maxDiscount ?? null]
  );

  response.status(201).json({ message: 'Coupon created' });
}));

router.get('/reports/sales', asyncHandler(async (_request, response) => {
  const [totals, topCategory] = await Promise.all([
    dbQuery<{ total_orders: string; average_order_value: string }>('SELECT COUNT(*)::text AS total_orders, COALESCE(AVG(grand_total), 0)::text AS average_order_value FROM orders'),
    dbQuery<{ category_name: string }>(
      `SELECT c.name AS category_name
       FROM order_items oi
       INNER JOIN product_variants pv ON pv.id = oi.variant_id
       INNER JOIN products p ON p.id = pv.product_id
       INNER JOIN categories c ON c.id = p.category_id
       GROUP BY c.name
       ORDER BY COUNT(*) DESC
       LIMIT 1`
    )
  ]);

  response.json({
    totalOrders: Number(totals.rows[0]?.total_orders ?? 0),
    averageOrderValue: Number(totals.rows[0]?.average_order_value ?? 0),
    topCategory: topCategory.rows[0]?.category_name ?? null
  });
}));

router.get('/reports/revenue', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery<{ gross_revenue: string; discounts: string; net_revenue: string }>(
    `SELECT COALESCE(SUM(grand_total), 0)::text AS gross_revenue,
            COALESCE(SUM(discount_total), 0)::text AS discounts,
            COALESCE(SUM(grand_total - discount_total), 0)::text AS net_revenue
     FROM orders`
  );
  response.json({
    grossRevenue: Number(rows[0]?.gross_revenue ?? 0),
    discounts: Number(rows[0]?.discounts ?? 0),
    netRevenue: Number(rows[0]?.net_revenue ?? 0)
  });
}));

export default router;
