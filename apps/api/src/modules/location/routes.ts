import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { checkPincodeServiceability, checkServiceability, createAddress, listAddresses, listNearbyStores } from './repository';

const router = Router();

router.get('/addresses', asyncHandler(async (_request, response) => {
  response.json(await listAddresses());
}));

router.post('/addresses', asyncHandler(async (request, response) => {
  const payload = z.object({
    label: z.string().min(2),
    recipientName: z.string().min(2),
    mobile: z.string().min(10),
    addressLine1: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(6)
  }).parse(request.body);

  response.status(201).json(await createAddress(payload));
}));

router.post('/pincode-check', asyncHandler(async (request, response) => {
  const payload = z.object({ pincode: z.string().min(6) }).parse(request.body);
  response.json(await checkPincodeServiceability(payload.pincode));
}));

router.post('/serviceability-check', asyncHandler(async (request, response) => {
  const payload = z.object({ pincode: z.string().min(6) }).parse(request.body);
  response.json(await checkServiceability(payload.pincode));
}));

router.post('/geocode', asyncHandler(async (_request, response) => {
  response.json({ latitude: 12.9716, longitude: 77.5946, formattedAddress: 'Bangalore, Karnataka' });
}));

router.get('/nearby-stores', asyncHandler(async (_request, response) => {
  response.json(await listNearbyStores());
}));

export default router;
