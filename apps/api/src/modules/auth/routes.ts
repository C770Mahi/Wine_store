import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { getRequestUserId, requireCustomerAuth } from '../../middleware/auth';
import { forgotPassword, getCurrentUserProfile, getKycOverview, login, logout, refreshSession, resetPassword, sendOtp, signup, submitKyc, verifyEmail, verifyOtp } from './service';

const router = Router();

router.post('/signup', asyncHandler(async (request, response) => {
  const payload = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    mobile: z.string().min(10),
    password: z.string().min(8)
  }).parse(request.body);

  response.status(201).json(await signup(payload));
}));

router.post('/login', asyncHandler(async (request, response) => {
  const payload = z.object({
    identifier: z.string(),
    password: z.string().optional(),
    otp: z.string().optional()
  }).parse(request.body);

  response.json(await login(payload));
}));

router.post('/send-otp', asyncHandler(async (request, response) => {
  const payload = z.object({
    identifier: z.string(),
    purpose: z.enum(['signup', 'login', 'reset_password', 'verify_email'])
  }).parse(request.body);

  response.json(await sendOtp(payload));
}));

router.post('/verify-otp', asyncHandler(async (request, response) => {
  const payload = z.object({
    identifier: z.string(),
    purpose: z.enum(['signup', 'login', 'reset_password', 'verify_email']),
    code: z.string().length(6)
  }).parse(request.body);

  response.json(await verifyOtp(payload));
}));

router.post('/forgot-password', asyncHandler(async (request, response) => {
  const payload = z.object({ identifier: z.string() }).parse(request.body);
  response.json(await forgotPassword(payload.identifier));
}));

router.post('/reset-password', asyncHandler(async (request, response) => {
  const payload = z.object({
    identifier: z.string(),
    code: z.string().length(6),
    password: z.string().min(8)
  }).parse(request.body);

  response.json(await resetPassword(payload));
}));

router.post('/verify-email', asyncHandler(async (request, response) => {
  const payload = z.object({
    identifier: z.string().email(),
    code: z.string().length(6)
  }).parse(request.body);

  response.json(await verifyEmail(payload));
}));

router.get('/me', requireCustomerAuth, asyncHandler(async (request, response) => {
  response.json(await getCurrentUserProfile(getRequestUserId(request)!));
}));

router.get('/kyc', requireCustomerAuth, asyncHandler(async (request, response) => {
  response.json(await getKycOverview(getRequestUserId(request)!));
}));

router.post('/kyc', requireCustomerAuth, asyncHandler(async (request, response) => {
  const payload = z.object({
    fullName: z.string().min(2),
    dateOfBirth: z.string().date(),
    documentType: z.enum(['aadhaar', 'driving_license', 'passport', 'voter_id']),
    documentNumber: z.string().min(4),
    frontImageUrl: z.string().min(16),
    backImageUrl: z.string().min(16).optional().nullable(),
    selfieImageUrl: z.string().min(16).optional().nullable()
  }).parse(request.body);

  response.status(201).json(await submitKyc(getRequestUserId(request)!, payload));
}));

router.post('/logout', asyncHandler(async (request, response) => {
  const payload = z.object({ refreshToken: z.string() }).parse(request.body);
  response.json(await logout(payload.refreshToken));
}));

router.post('/refresh', asyncHandler(async (request, response) => {
  const payload = z.object({ refreshToken: z.string() }).parse(request.body);
  response.json(await refreshSession(payload.refreshToken));
}));

export default router;
