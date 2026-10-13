import { apiFetch } from './api';

const ACCESS_TOKEN_KEY = 'indus_reserve_access_token';
const REFRESH_TOKEN_KEY = 'indus_reserve_refresh_token';
const USER_KEY = 'indus_reserve_user';

export const AUTH_SESSION_EVENT = 'indus-reserve:auth-session';

export type OtpPurpose = 'signup' | 'login' | 'reset_password' | 'verify_email';
export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type KycDocumentType = 'aadhaar' | 'driving_license' | 'passport' | 'voter_id';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  status: string;
  kycStatus: KycStatus;
  kycRejectedReason: string | null;
  ageVerifiedAt: string | null;
}

export interface KycSubmission {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  documentType: KycDocumentType;
  documentNumber: string;
  frontImageUrl: string;
  backImageUrl: string | null;
  selfieImageUrl: string | null;
  status: KycStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

interface OtpDispatchResponse {
  message: string;
  purpose?: OtpPurpose;
  expiresInSeconds?: number;
  previewCode?: string;
}

function notifyAuthSessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
  }
}

export async function signupRequest(payload: { name: string; email: string; mobile: string; password: string }) {
  return apiFetch<OtpDispatchResponse & { nextStep: string; user: AuthResponse['user'] }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function sendOtpRequest(payload: { identifier: string; purpose: OtpPurpose }) {
  return apiFetch<OtpDispatchResponse>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function verifyOtpRequest(payload: { identifier: string; purpose: OtpPurpose; code: string }) {
  return apiFetch<{ message: string; isVerified: boolean }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function loginRequest(payload: { identifier: string; password?: string; otp?: string }) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function forgotPasswordRequest(identifier: string) {
  return apiFetch<OtpDispatchResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ identifier })
  });
}

export async function resetPasswordRequest(payload: { identifier: string; code: string; password: string }) {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getProfileRequest() {
  return apiFetch<{ user: SessionUser }>('/auth/me');
}

export async function getKycRequest() {
  return apiFetch<{ user: SessionUser; submission: KycSubmission | null }>('/auth/kyc');
}

export async function submitKycRequest(payload: {
  fullName: string;
  dateOfBirth: string;
  documentType: KycDocumentType;
  documentNumber: string;
  frontImageUrl: string;
  backImageUrl?: string | null;
  selfieImageUrl?: string | null;
}) {
  return apiFetch<{ message: string; user: SessionUser; submission: KycSubmission | null }>('/auth/kyc', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function persistSession(session: AuthResponse) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  notifyAuthSessionChanged();
}

export function getStoredUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(USER_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as SessionUser;
  } catch {
    return null;
  }
}

export function updateStoredUser(user: SessionUser) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthSessionChanged();
}

export function hasStoredSession() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY));
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  notifyAuthSessionChanged();
}
