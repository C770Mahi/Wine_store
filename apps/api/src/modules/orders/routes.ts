import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { getRequestUserId, requireApprovedCustomer, requireCustomerAuth } from '../../middleware/auth';
import { getCart } from '../cart/repository';
import { createOrder, getOrderById, getTracking, listOrders } from './repository';

const router = Router();

router.post('/checkout/validate', requireApprovedCustomer, asyncHandler(async (request, response) => {
  const cart = await getCart(getRequestUserId(request)!);
  response.json({ valid: cart.items.length > 0, serviceable: true, ageCheckRequired: true, stockCheckPassed: cart.items.length > 0 });
}));

router.post('/checkout/create-order', requireApprovedCustomer, asyncHandler(async (request, response) => {
  const payload = z.object({
    addressId: z.string(),
    slot: z.string().optional(),
    paymentMethod: z.string().optional(),
    ageConfirmed: z.boolean().default(false)
  }).parse(request.body);

  const order = await createOrder({
    userId: getRequestUserId(request)!,
    addressId: payload.addressId,
    slot: payload.slot,
    paymentMethod: payload.paymentMethod,
    ageConfirmed: payload.ageConfirmed
  });
  response.status(201).json({ orderId: order.id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus });
}));

router.post('/checkout/select-slot', requireApprovedCustomer, asyncHandler(async (request, response) => {
  const payload = z.object({ slot: z.string() }).parse(request.body);
  response.json({ message: 'Slot selected', slot: payload.slot });
}));

router.get('/orders', requireCustomerAuth, asyncHandler(async (request, response) => {
  response.json(await listOrders(getRequestUserId(request)!));
}));

router.get('/orders/:id', requireCustomerAuth, asyncHandler(async (request, response) => {
  const order = await getOrderById(request.params.id as string, getRequestUserId(request)!);
  if (!order) {
    response.status(404).json({ message: 'Order not found' });
    return;
  }

  response.json(order);
}));

router.post('/orders/:id/cancel', requireCustomerAuth, asyncHandler(async (request, response) => {
  const order = await getOrderById(request.params.id as string, getRequestUserId(request)!);
  if (!order) {
    response.status(404).json({ message: 'Order not found' });
    return;
  }

  response.json({ message: 'Order cancellation requested' });
}));

router.post('/orders/:id/reorder', requireCustomerAuth, asyncHandler(async (request, response) => {
  const order = await getOrderById(request.params.id as string, getRequestUserId(request)!);
  if (!order) {
    response.status(404).json({ message: 'Order not found' });
    return;
  }

  response.json({ message: 'Items added back to cart' });
}));

router.get('/orders/:id/tracking', requireCustomerAuth, asyncHandler(async (request, response) => {
  const order = await getOrderById(request.params.id as string, getRequestUserId(request)!);
  if (!order) {
    response.status(404).json({ message: 'Order not found' });
    return;
  }

  response.json({ orderId: request.params.id as string, ...(await getTracking(request.params.id as string)) });
}));

router.get('/orders/:id/invoice', requireCustomerAuth, asyncHandler(async (request, response) => {
  const order = await getOrderById(request.params.id as string, getRequestUserId(request)!);
  if (!order) {
    response.status(404).json({ message: 'Order not found' });
    return;
  }

  response.json({ invoiceId: `INV-${request.params.id as string}`, status: 'available' });
}));

export default router;
