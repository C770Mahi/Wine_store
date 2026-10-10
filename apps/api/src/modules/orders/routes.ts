import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { createOrder, getOrderById, getTracking, listOrders } from './repository';

const router = Router();

router.post('/checkout/validate', asyncHandler(async (_request, response) => {
  response.json({ valid: true, serviceable: true, ageCheckRequired: true, stockCheckPassed: true });
}));

router.post('/checkout/create-order', asyncHandler(async (request, response) => {
  const payload = z.object({
    addressId: z.string(),
    grandTotal: z.number().optional()
  }).parse(request.body);

  const order = await createOrder(payload);
  response.status(201).json({ orderId: order.id, orderNumber: order.orderNumber, status: order.status });
}));

router.post('/checkout/select-slot', asyncHandler(async (request, response) => {
  const payload = z.object({ slot: z.string() }).parse(request.body);
  response.json({ message: 'Slot selected', slot: payload.slot });
}));

router.get('/orders', asyncHandler(async (_request, response) => {
  response.json(await listOrders());
}));

router.get('/orders/:id', asyncHandler(async (request, response) => {
  const order = await getOrderById(request.params.id);
  if (!order) {
    response.status(404).json({ message: 'Order not found' });
    return;
  }

  response.json(order);
}));

router.post('/orders/:id/cancel', asyncHandler(async (_request, response) => {
  response.json({ message: 'Order cancellation requested' });
}));

router.post('/orders/:id/reorder', asyncHandler(async (_request, response) => {
  response.json({ message: 'Items added back to cart' });
}));

router.get('/orders/:id/tracking', asyncHandler(async (request, response) => {
  response.json({ orderId: request.params.id, ...(await getTracking(request.params.id)) });
}));

router.get('/orders/:id/invoice', asyncHandler(async (request, response) => {
  response.json({ invoiceId: `INV-${request.params.id}`, status: 'available' });
}));

export default router;
