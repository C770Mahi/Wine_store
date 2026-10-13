import bcrypt from 'bcryptjs';
import https from 'node:https';
import { v4 as uuid } from 'uuid';
import { env } from '../config/env';
import { dbQuery } from '../db/client';

export type OtpPurpose = 'signup' | 'login' | 'reset_password' | 'verify_email';

function normalizeIndianMobile(identifier: string) {
  const digits = identifier.replace(/\D/g, '');
  if (digits.length === 10) {
    return digits;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  return null;
}

function request2FactorJson(url: string) {
  return new Promise<{ Status?: string; Details?: string }>((resolve, reject) => {
    const request = https.request(url, {
      method: 'GET',
      rejectUnauthorized: !env.otpProviderAllowInsecureTls
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        if (!response.statusCode || response.statusCode >= 400) {
          reject(new Error(body || '2Factor SMS request failed'));
          return;
        }

        try {
          resolve(JSON.parse(body) as { Status?: string; Details?: string });
        } catch {
          reject(new Error('Invalid 2Factor response'));
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });
    request.end();
  });
}

async function sendOtpThrough2Factor(mobile: string, code: string) {
  const apiKey = env.otpProviderApiKey.trim();
  if (!apiKey) {
    return false;
  }

  if (env.otpProviderName && env.otpProviderName !== '2factor') {
    return false;
  }

  const templateSegment = env.otpProviderTemplateName.trim()
    ? `/${encodeURIComponent(env.otpProviderTemplateName.trim())}`
    : '';
  const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${mobile}/${code}${templateSegment}`;

  try {
    const payload = await request2FactorJson(endpoint);
    if (payload.Status !== 'Success') {
      throw new Error(payload.Details || 'Unable to deliver OTP SMS');
    }

    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('self-signed certificate in certificate chain')) {
      throw new Error('2Factor TLS connection failed. Set OTP_PROVIDER_ALLOW_INSECURE_TLS=true on this network to allow the dev machine certificate chain.');
    }

    throw error;
  }
}

export async function createOtpChallenge(input: { identifier: string; purpose: OtpPurpose; userId?: string | null }) {
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  await dbQuery(
    `INSERT INTO otp_challenges (id, user_id, identifier, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuid(), input.userId ?? null, input.identifier, input.purpose, codeHash, expiresAt]
  );

  const mobile = normalizeIndianMobile(input.identifier);
  let previewCode: string | undefined = code;

  if (mobile) {
    const delivered = await sendOtpThrough2Factor(mobile, code).catch((error) => {
      if (env.otpDevPreviewEnabled) {
        return false;
      }

      throw error;
    });

    if (delivered) {
      previewCode = undefined;
    }
  }

  return {
    expiresInSeconds: 120,
    previewCode
  };
}

export async function verifyOtpChallenge(input: { identifier: string; purpose: OtpPurpose; code: string }) {
  const { rows } = await dbQuery<{
    id: string;
    code_hash: string;
    expires_at: Date;
    verified_at: Date | null;
  }>(
    `SELECT id, code_hash, expires_at, verified_at
     FROM otp_challenges
     WHERE identifier = $1 AND purpose = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [input.identifier, input.purpose]
  );

  const challenge = rows[0];
  if (!challenge || challenge.verified_at || new Date(challenge.expires_at).getTime() < Date.now()) {
    return false;
  }

  const matches = await bcrypt.compare(input.code, challenge.code_hash);
  if (!matches) {
    return false;
  }

  await dbQuery('UPDATE otp_challenges SET verified_at = NOW() WHERE id = $1', [challenge.id]);
  return true;
}
