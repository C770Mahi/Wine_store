import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { getRequestUserId } from '../../middleware/auth';
import { addCartItem, applyCoupon, getCart, removeCartItem, removeCoupon, updateCartItem } from './repository';

const router = Router();

router.get('/', asyncHandler(async (request, response) => {
  response.json(await getCart(getRequestUserId(request)));
}));

router.post('/items', asyncHandler(async (request, response) => {
  const payload = z.object({
    variantId: z.string(),
    quantity: z.number().int().min(1).default(1)
  }).parse(request.body);

  response.status(201).json({ message: 'Item added', cart: await addCartItem({ ...payload, userId: getRequestUserId(request) }) });
}));

router.patch('/items/:itemId', asyncHandler(async (request, response) => {
  const payload = z.object({ quantity: z.number().int().min(1) }).parse(request.body);
  const cart = await updateCartItem({ userId: getRequestUserId(request), itemId: request.params.itemId as string, quantity: payload.quantity });
  if (!cart) {
    response.status(404).json({ message: 'Cart item not found' });
    return;
  }

  response.json({ message: 'Cart updated', cart });
}));

router.delete('/items/:itemId', asyncHandler(async (request, response) => {
  response.json({ message: 'Cart item removed', cart: await removeCartItem({ userId: getRequestUserId(request), itemId: request.params.itemId as string }) });
}));

router.post('/save-for-later/:itemId', asyncHandler(async (_request, response) => {
  response.json({ message: 'Item moved to save for later' });
}));

router.post('/apply-coupon', asyncHandler(async (request, response) => {
  const payload = z.object({ code: z.string().min(3) }).parse(request.body);
  response.json({ message: 'Coupon applied', cart: await applyCoupon({ userId: getRequestUserId(request), code: payload.code }) });
}));

router.delete('/remove-coupon', asyncHandler(async (request, response) => {
  response.json({ message: 'Coupon removed', cart: await removeCoupon(getRequestUserId(request)) });
}));

export default router;
