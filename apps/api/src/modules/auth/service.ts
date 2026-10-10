import bcrypt from 'bcryptjs';
import { createOtpChallenge, verifyOtpChallenge, OtpPurpose } from '../../lib/otp-service';
import { signAccessToken, signRefreshToken, verifyToken } from '../../lib/jwt';
import {
  createUser,
  findUserById,
  findUserByIdentifier,
  hasValidRefreshSession,
  markEmailVerified,
  markMobileVerified,
  revokeRefreshSession,
  saveRefreshSession,
  updatePassword
} from './repository';

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    isMobileVerified: user.isMobileVerified,
    isEmailVerified: user.isEmailVerified
  };
}

async function issueAuthTokens(user: {
  id: string;
  email: string;
  mobile: string;
  role: string;
  name: string;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
}) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email, mobile: user.mobile });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role, email: user.email, mobile: user.mobile });
  await saveRefreshSession(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  };
}

export async function signup(input: { name: string; email: string; mobile: string; password: string }) {
  const existingEmail = await findUserByIdentifier(input.email);
  if (existingEmail) {
    throw new Error('Email is already registered');
  }

  const existingMobile = await findUserByIdentifier(input.mobile);
  if (existingMobile) {
    throw new Error('Mobile number is already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await createUser({
    name: input.name,
    email: input.email,
    mobile: input.mobile,
    passwordHash
  });

  const otp = await createOtpChallenge({ identifier: user.mobile, purpose: 'signup', userId: user.id });

  return {
    message: 'User registered',
    nextStep: 'verify-otp',
    otp,
    user: sanitizeUser(user)
  };
}

export async function sendOtp(input: { identifier: string; purpose: OtpPurpose }) {
  const user = await findUserByIdentifier(input.identifier);
  const otp = await createOtpChallenge({ identifier: input.identifier, purpose: input.purpose, userId: user?.id ?? null });

  return {
    message: 'OTP dispatched',
    purpose: input.purpose,
    ...otp
  };
}

export async function verifyOtp(input: { identifier: string; purpose: OtpPurpose; code: string }) {
  const isVerified = await verifyOtpChallenge(input);
  if (!isVerified) {
    throw new Error('Invalid or expired OTP');
  }

  if (input.identifier.includes('@')) {
    await markEmailVerified(input.identifier);
  } else {
    await markMobileVerified(input.identifier);
  }

  return {
    message: 'OTP verified',
    isVerified: true
  };
}

export async function login(input: { identifier: string; password?: string; otp?: string }) {
  const user = await findUserByIdentifier(input.identifier);
  if (!user) {
    throw new Error('User not found');
  }

  if (input.otp) {
    const isOtpValid = await verifyOtpChallenge({ identifier: input.identifier, purpose: 'login', code: input.otp });
    if (!isOtpValid) {
      throw new Error('Invalid or expired OTP');
    }

    if (input.identifier.includes('@')) {
      await markEmailVerified(input.identifier);
    } else {
      await markMobileVerified(input.identifier);
    }

    return issueAuthTokens(user);
  }

  if (!input.password) {
    throw new Error('Password or OTP is required');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Incorrect password');
  }

  return issueAuthTokens(user);
}

export async function refreshSession(refreshToken: string) {
  const payload = verifyToken(refreshToken);
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }

  const hasSession = await hasValidRefreshSession(payload.sub, refreshToken);
  if (!hasSession) {
    throw new Error('Refresh session is invalid');
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    throw new Error('User not found');
  }

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role, email: user.email, mobile: user.mobile })
  };
}

export async function logout(refreshToken: string) {
  await revokeRefreshSession(refreshToken);
  return { message: 'Logged out' };
}

export async function forgotPassword(identifier: string) {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw new Error('User not found');
  }

  const otp = await createOtpChallenge({ identifier, purpose: 'reset_password', userId: user.id });
  return {
    message: 'Reset instructions sent',
    otp
  };
}

export async function resetPassword(input: { identifier: string; code: string; password: string }) {
  const user = await findUserByIdentifier(input.identifier);
  if (!user) {
    throw new Error('User not found');
  }

  const isOtpValid = await verifyOtpChallenge({ identifier: input.identifier, purpose: 'reset_password', code: input.code });
  if (!isOtpValid) {
    throw new Error('Invalid or expired OTP');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  await updatePassword(user.id, passwordHash);
  return { message: 'Password reset complete' };
}

export async function verifyEmail(input: { identifier: string; code: string }) {
  const isOtpValid = await verifyOtpChallenge({ identifier: input.identifier, purpose: 'verify_email', code: input.code });
  if (!isOtpValid) {
    throw new Error('Invalid or expired OTP');
  }

  await markEmailVerified(input.identifier);
  return { message: 'Email verified' };
}
