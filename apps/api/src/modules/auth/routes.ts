import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { forgotPassword, login, logout, refreshSession, resetPassword, sendOtp, signup, verifyEmail, verifyOtp } from './service';

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

router.post('/logout', asyncHandler(async (request, response) => {
  const payload = z.object({ refreshToken: z.string() }).parse(request.body);
  response.json(await logout(payload.refreshToken));
}));

router.post('/refresh', asyncHandler(async (request, response) => {
  const payload = z.object({ refreshToken: z.string() }).parse(request.body);
  response.json(await refreshSession(payload.refreshToken));
}));

export default router;
