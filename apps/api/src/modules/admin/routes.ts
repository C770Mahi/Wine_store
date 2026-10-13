import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { dbQuery } from '../../db/client';
import { asyncHandler } from '../../lib/async-handler';
import { listKycRequests, reviewKycSubmission } from '../auth/repository';
import { listBrandOptions, listCategoryOptions, listProducts } from '../catalog/repository';

const router = Router();

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createUniqueSlug(table: 'products' | 'categories', value: string, excludeId?: string) {
  const baseSlug = slugify(value) || `${table.slice(0, -1)}-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { rows } = excludeId
      ? await dbQuery<{ id: string }>(`SELECT id FROM ${table} WHERE slug = $1 AND id <> $2 LIMIT 1`, [slug, excludeId])
      : await dbQuery<{ id: string }>(`SELECT id FROM ${table} WHERE slug = $1 LIMIT 1`, [slug]);

    if (!rows[0]) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function ensureActiveCategory(categoryId: string, message = 'Select a valid category before saving the product.') {
  const { rows } = await dbQuery<{ id: string }>('SELECT id FROM categories WHERE id = $1 AND is_active = TRUE LIMIT 1', [categoryId]);
  if (!rows[0]) {
    throw new Error(message);
  }
}

async function resolveBrandId(brandId?: string) {
  if (brandId) {
    const { rows } = await dbQuery<{ id: string }>('SELECT id FROM brands WHERE id = $1 AND is_active = TRUE LIMIT 1', [brandId]);
    if (rows[0]) {
      return rows[0].id;
    }
  }

  const fallback = await dbQuery<{ id: string }>(
    `SELECT id
     FROM brands
     WHERE is_active = TRUE
     ORDER BY CASE WHEN name = 'Fresh Fields' THEN 0 ELSE 1 END, name ASC
     LIMIT 1`
  );

  if (!fallback.rows[0]) {
    throw new Error('No active brand is available for product creation.');
  }

  return fallback.rows[0].id;
}

const variantPayloadSchema = z.object({
  quantity: z.number().int().positive(),
  packType: z.enum(['g', 'ml', 'pcs']),
  mrp: z.number().nonnegative(),
  salePrice: z.number().nonnegative(),
  stockQty: z.number().int().nonnegative()
});

const editableVariantPayloadSchema = variantPayloadSchema.extend({
  id: z.string().optional(),
  inventoryId: z.string().optional()
});

router.get('/dashboard', asyncHandler(async (_request, response) => {
  const [ordersToday, revenueToday, activeCustomers, lowStock, pendingKyc] = await Promise.all([
    dbQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM orders WHERE DATE(created_at) = CURRENT_DATE'),
    dbQuery<{ total: string }>('SELECT COALESCE(SUM(grand_total), 0)::text AS total FROM orders WHERE DATE(created_at) = CURRENT_DATE'),
    dbQuery<{ count: string }>("SELECT COUNT(*)::text AS count FROM users WHERE role = 'customer'"),
    dbQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM inventories WHERE stock_qty <= low_stock_threshold OR is_in_stock = FALSE'),
    dbQuery<{ count: string }>("SELECT COUNT(*)::text AS count FROM users WHERE role = 'customer' AND kyc_status = 'pending'")
  ]);

  response.json({
    ordersToday: Number(ordersToday.rows[0]?.count ?? 0),
    revenueToday: Number(revenueToday.rows[0]?.total ?? 0),
    activeCustomers: Number(activeCustomers.rows[0]?.count ?? 0),
    lowStockSkus: Number(lowStock.rows[0]?.count ?? 0),
    pendingKycRequests: Number(pendingKyc.rows[0]?.count ?? 0),
    conversionRate: 18.6
  });
}));

router.get('/orders', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery(
    `SELECT o.id, o.order_number, o.status, o.payment_status, o.grand_total, o.created_at,
            u.name AS customer_name, u.mobile AS customer_mobile,
            COALESCE(o.delivery_contact_name, a.recipient_name) AS delivery_contact_name,
            COALESCE(o.delivery_mobile, a.mobile) AS delivery_mobile,
            COALESCE(o.delivery_address, CONCAT_WS(', ', a.address_line_1, a.address_line_2, a.landmark, a.city, a.state, a.pincode)) AS delivery_address,
            COALESCE(o.delivery_latitude, a.latitude) AS delivery_latitude,
            COALESCE(o.delivery_longitude, a.longitude) AS delivery_longitude,
            COALESCE(o.google_map_link, a.google_map_link) AS google_map_link,
            p.provider_payment_id AS transaction_id
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     INNER JOIN addresses a ON a.id = o.address_id
     LEFT JOIN LATERAL (
       SELECT provider_payment_id
       FROM payments
       WHERE order_id = o.id
       ORDER BY created_at DESC
       LIMIT 1
     ) p ON TRUE
     ORDER BY o.created_at DESC
     LIMIT 100`
  );
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

router.get('/product-options', asyncHandler(async (_request, response) => {
  const [categories, brands] = await Promise.all([listCategoryOptions(), listBrandOptions()]);
  response.json({ categories, brands });
}));

router.post('/categories', asyncHandler(async (request, response) => {
  const payload = z.object({ name: z.string().trim().min(2) }).parse(request.body);
  const duplicate = await dbQuery<{ id: string }>('SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND is_active = TRUE LIMIT 1', [payload.name]);
  if (duplicate.rows[0]) {
    throw new Error('A category with this name already exists.');
  }

  const sortOrder = await dbQuery<{ sort_order: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 AS sort_order FROM categories');
  const categoryId = uuid();
  const slug = await createUniqueSlug('categories', payload.name);

  await dbQuery(
    `INSERT INTO categories (id, name, slug, sort_order, is_active)
     VALUES ($1, $2, $3, $4, TRUE)`,
    [categoryId, payload.name, slug, Number(sortOrder.rows[0]?.sort_order ?? 0)]
  );

  response.status(201).json({ message: 'Category created', id: categoryId, slug });
}));

router.patch('/categories/:id', asyncHandler(async (request, response) => {
  const payload = z.object({ name: z.string().trim().min(2) }).parse(request.body);
  await ensureActiveCategory(request.params.id, 'Category not found.');

  const duplicate = await dbQuery<{ id: string }>(
    'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2 AND is_active = TRUE LIMIT 1',
    [payload.name, request.params.id]
  );
  if (duplicate.rows[0]) {
    throw new Error('A category with this name already exists.');
  }

  const slug = await createUniqueSlug('categories', payload.name, request.params.id);
  await dbQuery('UPDATE categories SET name = $1, slug = $2 WHERE id = $3', [payload.name, slug, request.params.id]);
  response.json({ message: 'Category updated', id: request.params.id, slug });
}));

router.delete('/categories/:id', asyncHandler(async (request, response) => {
  const payload = z.object({
    replacementCategoryId: z.string().optional(),
    deleteProducts: z.boolean().optional()
  }).parse(request.body ?? {});

  await ensureActiveCategory(request.params.id, 'Category not found.');

  if (payload.replacementCategoryId === request.params.id) {
    throw new Error('Choose a different replacement category.');
  }

  const linkedProducts = await dbQuery<{ id: string }>('SELECT id FROM products WHERE category_id = $1 AND is_active = TRUE', [request.params.id]);
  const productIds = linkedProducts.rows.map((row) => row.id);

  if (payload.replacementCategoryId) {
    await ensureActiveCategory(payload.replacementCategoryId, 'Choose a valid replacement category.');
    await dbQuery('UPDATE products SET category_id = $1, updated_at = NOW() WHERE category_id = $2 AND is_active = TRUE', [payload.replacementCategoryId, request.params.id]);
  } else if (productIds.length) {
    if (!payload.deleteProducts) {
      throw new Error('Choose a replacement category or confirm product deletion before removing this category.');
    }

    await dbQuery('UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = ANY($1::uuid[])', [productIds]);
    await dbQuery('UPDATE product_variants SET is_active = FALSE WHERE product_id = ANY($1::uuid[])', [productIds]);
    await dbQuery(
      `UPDATE inventories
       SET stock_qty = 0,
           is_in_stock = FALSE,
           updated_at = NOW()
       WHERE variant_id IN (
         SELECT id FROM product_variants WHERE product_id = ANY($1::uuid[])
       )`,
      [productIds]
    );
  }

  await dbQuery('UPDATE categories SET is_active = FALSE WHERE id = $1', [request.params.id]);
  response.json({ message: 'Category deleted', id: request.params.id, productsAffected: productIds.length });
}));

router.post('/products', asyncHandler(async (request, response) => {
  const payload = z.object({
    brandId: z.string().optional(),
    categoryId: z.string().min(1),
    name: z.string().trim().min(2),
    slug: z.string().trim().min(2).optional(),
    shortDescription: z.string().trim().min(2),
    longDescription: z.string().trim().min(2),
    imageDataUrl: z.string().min(10).optional(),
    imageUrl: z.string().min(10).optional(),
    variants: z.array(variantPayloadSchema).min(1)
  }).parse(request.body);

  await ensureActiveCategory(payload.categoryId);
  const productId = uuid();
  const brandId = await resolveBrandId(payload.brandId);
  const slug = await createUniqueSlug('products', payload.slug ?? payload.name);

  await dbQuery(
    `INSERT INTO products (id, brand_id, category_id, name, slug, short_description, long_description, rating_avg, rating_count, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
    [productId, brandId, payload.categoryId, payload.name, slug, payload.shortDescription, payload.longDescription, 4.5, 0]
  );

  if (payload.imageDataUrl || payload.imageUrl) {
    await dbQuery(
      `INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order)
       VALUES ($1, $2, $3, $4, 0)`,
      [uuid(), productId, payload.imageDataUrl ?? payload.imageUrl, payload.name]
    );
  }

  for (const [index, variant] of payload.variants.entries()) {
    const variantId = uuid();
    await dbQuery(
      `INSERT INTO product_variants (id, product_id, sku, volume_ml, pack_type, mrp, sale_price, tax_rate, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
      [variantId, productId, `${slug.toUpperCase()}-${index + 1}`, variant.quantity, variant.packType, variant.mrp, variant.salePrice, variant.packType === 'ml' ? 18 : 5]
    );
    await dbQuery(
      `INSERT INTO inventories (id, variant_id, store_id, stock_qty, reserved_qty, low_stock_threshold, is_in_stock)
       VALUES ($1, $2, '33333333-3333-3333-3333-333333333333', $3, 0, $4, $5)`,
      [uuid(), variantId, variant.stockQty, Math.max(2, Math.min(variant.stockQty || 2, 10)), variant.stockQty > 0]
    );
  }

  response.status(201).json({ message: 'Product created', id: productId, slug });
}));

router.patch('/products/:id', asyncHandler(async (request, response) => {
  const payload = z.object({
    name: z.string().trim().min(2).optional(),
    brandId: z.string().optional(),
    categoryId: z.string().min(1).optional(),
    shortDescription: z.string().trim().min(2).optional(),
    longDescription: z.string().trim().min(2).optional(),
    imageDataUrl: z.string().min(10).optional(),
    imageUrl: z.string().min(10).optional(),
    isActive: z.boolean().optional(),
    variants: z.array(editableVariantPayloadSchema).min(1).optional()
  }).parse(request.body);

  if (payload.categoryId) {
    await ensureActiveCategory(payload.categoryId);
  }

  const resolvedBrandId = payload.brandId ? await resolveBrandId(payload.brandId) : null;

  await dbQuery(
    `UPDATE products
     SET name = COALESCE($1, name),
         brand_id = COALESCE($2, brand_id),
         category_id = COALESCE($3, category_id),
         short_description = COALESCE($4, short_description),
         long_description = COALESCE($5, long_description),
         is_active = COALESCE($6, is_active),
         updated_at = NOW()
     WHERE id = $7`,
    [payload.name ?? null, resolvedBrandId, payload.categoryId ?? null, payload.shortDescription ?? null, payload.longDescription ?? null, payload.isActive ?? null, request.params.id]
  );

  if (payload.imageDataUrl || payload.imageUrl) {
    const existingImage = await dbQuery<{ id: string }>('SELECT id FROM product_images WHERE product_id = $1 AND sort_order = 0 LIMIT 1', [request.params.id]);
    const imageUrl = payload.imageDataUrl ?? payload.imageUrl;

    if (existingImage.rows[0]) {
      await dbQuery('UPDATE product_images SET image_url = $1, alt_text = $2 WHERE id = $3', [imageUrl, payload.name ?? 'Product image', existingImage.rows[0].id]);
    } else {
      await dbQuery(
        `INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order)
         VALUES ($1, $2, $3, $4, 0)`,
        [uuid(), request.params.id, imageUrl, payload.name ?? 'Product image']
      );
    }
  }

  if (payload.variants) {
    const existingVariants = await dbQuery<{ id: string }>('SELECT id FROM product_variants WHERE product_id = $1 AND is_active = TRUE', [request.params.id]);
    const retainedVariantIds: string[] = [];

    for (const [index, variant] of payload.variants.entries()) {
      if (variant.id) {
        retainedVariantIds.push(variant.id);
        await dbQuery(
          `UPDATE product_variants
           SET volume_ml = $1,
               pack_type = $2,
               mrp = $3,
               sale_price = $4,
               tax_rate = $5,
               is_active = TRUE
           WHERE id = $6 AND product_id = $7`,
          [variant.quantity, variant.packType, variant.mrp, variant.salePrice, variant.packType === 'ml' ? 18 : 5, variant.id, request.params.id]
        );

        const inventoryUpdate = await dbQuery(
          `UPDATE inventories
           SET stock_qty = $1,
               low_stock_threshold = $2,
               is_in_stock = $3,
               updated_at = NOW()
           WHERE variant_id = $4`,
          [variant.stockQty, Math.max(2, Math.min(variant.stockQty || 2, 10)), variant.stockQty > 0, variant.id]
        );

        if (!inventoryUpdate.rowCount) {
          await dbQuery(
            `INSERT INTO inventories (id, variant_id, store_id, stock_qty, reserved_qty, low_stock_threshold, is_in_stock)
             VALUES ($1, $2, '33333333-3333-3333-3333-333333333333', $3, 0, $4, $5)`,
            [uuid(), variant.id, variant.stockQty, Math.max(2, Math.min(variant.stockQty || 2, 10)), variant.stockQty > 0]
          );
        }
      } else {
        const variantId = uuid();
        retainedVariantIds.push(variantId);
        await dbQuery(
          `INSERT INTO product_variants (id, product_id, sku, volume_ml, pack_type, mrp, sale_price, tax_rate, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
          [variantId, request.params.id, `${slugify(payload.name ?? `product-${request.params.id}` ).toUpperCase()}-${index + 1}`, variant.quantity, variant.packType, variant.mrp, variant.salePrice, variant.packType === 'ml' ? 18 : 5]
        );
        await dbQuery(
          `INSERT INTO inventories (id, variant_id, store_id, stock_qty, reserved_qty, low_stock_threshold, is_in_stock)
           VALUES ($1, $2, '33333333-3333-3333-3333-333333333333', $3, 0, $4, $5)`,
          [uuid(), variantId, variant.stockQty, Math.max(2, Math.min(variant.stockQty || 2, 10)), variant.stockQty > 0]
        );
      }
    }

    const variantIdsToDisable = existingVariants.rows.map((variant) => variant.id).filter((id) => !retainedVariantIds.includes(id));
    if (variantIdsToDisable.length) {
      await dbQuery('UPDATE product_variants SET is_active = FALSE WHERE id = ANY($1::uuid[])', [variantIdsToDisable]);
      await dbQuery('UPDATE inventories SET stock_qty = 0, is_in_stock = FALSE, updated_at = NOW() WHERE variant_id = ANY($1::uuid[])', [variantIdsToDisable]);
    }
  }

  response.json({ message: 'Product updated', id: request.params.id });
}));

router.delete('/products/:id', asyncHandler(async (request, response) => {
  await dbQuery('UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [request.params.id]);
  await dbQuery('UPDATE product_variants SET is_active = FALSE WHERE product_id = $1', [request.params.id]);
  await dbQuery(
    `UPDATE inventories
     SET stock_qty = 0,
         is_in_stock = FALSE,
         updated_at = NOW()
     WHERE variant_id IN (
       SELECT id FROM product_variants WHERE product_id = $1
     )`,
    [request.params.id]
  );
  response.json({ message: 'Product removed from live catalog', id: request.params.id });
}));

router.get('/inventory', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery(
    `SELECT i.id, p.id AS product_id, pv.id AS variant_id, p.name AS product, pv.volume_ml, pv.pack_type, i.stock_qty, i.low_stock_threshold, i.is_in_stock
     FROM inventories i
     INNER JOIN product_variants pv ON pv.id = i.variant_id
     INNER JOIN products p ON p.id = pv.product_id
     WHERE p.is_active = TRUE AND pv.is_active = TRUE
     ORDER BY p.name ASC, pv.volume_ml ASC`
  );
  response.json(rows.map((row) => ({
    ...row,
    label: row.pack_type === 'g' && Number(row.volume_ml) >= 1000
      ? `${Number(row.volume_ml) / 1000} kg`
      : row.pack_type === 'ml' && Number(row.volume_ml) >= 1000
        ? `${Number(row.volume_ml) / 1000} L`
        : `${row.volume_ml} ${row.pack_type}`
  })));
}));

router.patch('/inventory/:id', asyncHandler(async (request, response) => {
  const payload = z.object({ stockQty: z.number().int().nonnegative(), isInStock: z.boolean() }).parse(request.body);
  await dbQuery('UPDATE inventories SET stock_qty = $1, is_in_stock = $2, updated_at = NOW() WHERE id = $3', [payload.stockQty, payload.isInStock, request.params.id]);
  response.json({ message: 'Inventory updated', id: request.params.id });
}));

router.get('/customers', asyncHandler(async (_request, response) => {
  const { rows } = await dbQuery(
    `SELECT u.id, u.name, u.email, u.mobile, u.status, u.kyc_status, u.kyc_rejected_reason, u.age_verified_at,
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

router.get('/kyc-requests', asyncHandler(async (_request, response) => {
  response.json(await listKycRequests());
}));

router.patch('/kyc-requests/:id', asyncHandler(async (request, response) => {
  const payload = z.object({
    status: z.enum(['approved', 'rejected']),
    rejectionReason: z.string().min(5).optional()
  }).parse(request.body);

  const user = await reviewKycSubmission({
    submissionId: request.params.id as string,
    status: payload.status,
    rejectionReason: payload.rejectionReason ?? null
  });

  response.json({
    message: `KYC ${payload.status}`,
    userId: user?.id,
    status: user?.kycStatus ?? payload.status
  });
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
