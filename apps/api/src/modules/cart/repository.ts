import { v4 as uuid } from 'uuid';
import { dbQuery } from '../../db/client';
import { DEMO_USER_ID } from '../../lib/app-defaults';

interface CouponRow {
  code: string;
  type: string;
  value: number;
  min_order_value: number | null;
  max_discount: number | null;
}

async function getOrCreateCartId(userId: string) {
  const existing = await dbQuery<{ id: string }>('SELECT id FROM carts WHERE user_id = $1 AND status = $2 LIMIT 1', [userId, 'active']);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const cartId = uuid();
  await dbQuery('INSERT INTO carts (id, user_id, status, coupon_code) VALUES ($1, $2, $3, $4)', [cartId, userId, 'active', null]);
  return cartId;
}

async function getCouponForCart(cartId: string) {
  const { rows } = await dbQuery<CouponRow>(
    `SELECT c.code, c.type, c.value, c.min_order_value, c.max_discount
     FROM carts ca
     LEFT JOIN coupons c ON c.code = ca.coupon_code AND c.is_active = TRUE
     WHERE ca.id = $1
     LIMIT 1`,
    [cartId]
  );

  return rows[0] ?? null;
}

function calculateDiscount(subtotal: number, coupon: CouponRow | null) {
  if (!coupon) {
    return 0;
  }

  if (coupon.min_order_value && subtotal < Number(coupon.min_order_value)) {
    return 0;
  }

  if (coupon.type === 'percentage') {
    const computed = (subtotal * Number(coupon.value)) / 100;
    if (coupon.max_discount) {
      return Math.min(computed, Number(coupon.max_discount));
    }
    return Math.round(computed);
  }

  return Number(coupon.value);
}

function summarizeCart(subtotal: number, discount: number) {
  const tax = Math.round(subtotal * 0.14);
  const delivery = subtotal > 299 ? 0 : 39;
  return {
    subtotal,
    discount,
    tax,
    delivery,
    payable: subtotal - discount + tax + delivery
  };
}

function formatVariantLabel(quantity: number, unit: string) {
  if (unit === 'g' && quantity >= 1000) {
    return `${quantity / 1000} kg`;
  }

  if (unit === 'ml' && quantity >= 1000) {
    return `${quantity / 1000} L`;
  }

  return `${quantity} ${unit}`;
}

export async function getCart(userId = DEMO_USER_ID) {
  const cartId = await getOrCreateCartId(userId);
  const { rows } = await dbQuery<{
    id: string;
    variant_id: string;
    quantity: number;
    unit_price: number;
    product_name: string;
    product_image: string | null;
    volume_ml: number;
    pack_type: string;
  }>(
    `SELECT ci.id, ci.variant_id, ci.quantity, ci.unit_price, p.name AS product_name, pi.image_url AS product_image, pv.volume_ml, pv.pack_type
     FROM cart_items ci
     INNER JOIN product_variants pv ON pv.id = ci.variant_id
     INNER JOIN products p ON p.id = pv.product_id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.sort_order = 0
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cartId]
  );

  const coupon = await getCouponForCart(cartId);
  const subtotal = rows.reduce((total, item) => total + Number(item.unit_price) * Number(item.quantity), 0);
  const discount = calculateDiscount(subtotal, coupon);

  return {
    id: cartId,
    userId,
    items: rows.map((item) => ({
      id: item.id,
      variantId: item.variant_id,
      productName: `${item.product_name} · ${formatVariantLabel(Number(item.volume_ml), String(item.pack_type ?? 'ml'))}`,
      image: item.product_image ?? undefined,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price)
    })),
    coupon: coupon ? { code: coupon.code, discountAmount: discount } : undefined,
    summary: summarizeCart(subtotal, discount)
  };
}

export async function addCartItem(input: { userId?: string; variantId: string; quantity: number }) {
  const userId = input.userId ?? DEMO_USER_ID;
  const cartId = await getOrCreateCartId(userId);
  const existing = await dbQuery<{ id: string; quantity: number }>('SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND variant_id = $2 LIMIT 1', [cartId, input.variantId]);
  const variant = await dbQuery<{ sale_price: number }>('SELECT sale_price FROM product_variants WHERE id = $1 LIMIT 1', [input.variantId]);
  const unitPrice = Number(variant.rows[0]?.sale_price ?? 0);

  if (existing.rows[0]) {
    await dbQuery('UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2', [Number(existing.rows[0].quantity) + input.quantity, existing.rows[0].id]);
  } else {
    await dbQuery('INSERT INTO cart_items (id, cart_id, variant_id, quantity, unit_price) VALUES ($1, $2, $3, $4, $5)', [uuid(), cartId, input.variantId, input.quantity, unitPrice]);
  }

  return getCart(userId);
}

export async function updateCartItem(input: { userId?: string; itemId: string; quantity: number }) {
  const userId = input.userId ?? DEMO_USER_ID;
  const cartId = await getOrCreateCartId(userId);
  const { rowCount } = await dbQuery('UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND cart_id = $3', [input.quantity, input.itemId, cartId]);
  if (!rowCount) {
    return null;
  }
  return getCart(userId);
}

export async function removeCartItem(input: { userId?: string; itemId: string }) {
  const userId = input.userId ?? DEMO_USER_ID;
  const cartId = await getOrCreateCartId(userId);
  await dbQuery('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [input.itemId, cartId]);
  return getCart(userId);
}

export async function applyCoupon(input: { userId?: string; code: string }) {
  const userId = input.userId ?? DEMO_USER_ID;
  const cartId = await getOrCreateCartId(userId);
  const { rows } = await dbQuery<{ code: string }>('SELECT code FROM coupons WHERE code = $1 AND is_active = TRUE LIMIT 1', [input.code]);

  if (!rows[0]) {
    throw new Error('Coupon not found');
  }

  await dbQuery('UPDATE carts SET coupon_code = $1, updated_at = NOW() WHERE id = $2', [rows[0].code, cartId]);
  return getCart(userId);
}

export async function removeCoupon(userId = DEMO_USER_ID) {
  const cartId = await getOrCreateCartId(userId);
  await dbQuery('UPDATE carts SET coupon_code = NULL, updated_at = NOW() WHERE id = $1', [cartId]);
  return getCart(userId);
}
