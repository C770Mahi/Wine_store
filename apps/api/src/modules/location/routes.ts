import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { getRequestUserId, requireCustomerAuth } from '../../middleware/auth';
import { checkPincodeServiceability, checkServiceability, createAddress, deleteAddress, listAddresses, listNearbyStores, setDefaultAddress, updateAddress } from './repository';

const router = Router();

const addressPayloadSchema = z.object({
  addressType: z.string().trim().min(2).max(60),
  fullName: z.string().trim().min(2).max(120),
  mobileNumber: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number.'),
  houseNo: z.string().trim().min(1).max(160),
  apartmentName: z.string().trim().max(160).optional().default(''),
  streetArea: z.string().trim().min(2).max(200),
  landmark: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode.'),
  country: z.string().trim().min(2).max(80).default('India'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  formattedAddress: z.string().trim().min(5).max(500).optional(),
  isDefault: z.boolean().optional()
});

router.get('/addresses', requireCustomerAuth, asyncHandler(async (request, response) => {
  response.json(await listAddresses(getRequestUserId(request)!));
}));

router.post('/addresses', requireCustomerAuth, asyncHandler(async (request, response) => {
  const payload = addressPayloadSchema.parse(request.body);
  response.status(201).json(await createAddress(payload, getRequestUserId(request)!));
}));

router.patch('/addresses/:id', requireCustomerAuth, asyncHandler(async (request, response) => {
  const payload = addressPayloadSchema.parse(request.body);
  response.json(await updateAddress(request.params.id, payload, getRequestUserId(request)!));
}));

router.delete('/addresses/:id', requireCustomerAuth, asyncHandler(async (request, response) => {
  response.json(await deleteAddress(request.params.id, getRequestUserId(request)!));
}));

router.post('/addresses/:id/default', requireCustomerAuth, asyncHandler(async (request, response) => {
  response.json(await setDefaultAddress(request.params.id, getRequestUserId(request)!));
}));

router.post('/pincode-check', asyncHandler(async (request, response) => {
  const payload = z.object({ pincode: z.string().trim().min(6) }).parse(request.body);
  response.json(await checkPincodeServiceability(payload.pincode));
}));

router.post('/serviceability-check', asyncHandler(async (request, response) => {
  const payload = z.object({ pincode: z.string().trim().min(6) }).parse(request.body);
  response.json(await checkServiceability(payload.pincode));
}));

router.post('/geocode', asyncHandler(async (_request, response) => {
  response.json({ latitude: 12.9716, longitude: 77.5946, formattedAddress: 'Bangalore, Karnataka' });
}));

router.get('/nearby-stores', asyncHandler(async (_request, response) => {
  response.json(await listNearbyStores());
}));

export default router;
