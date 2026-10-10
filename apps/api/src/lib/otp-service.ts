import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { dbQuery } from '../db/client';

export type OtpPurpose = 'signup' | 'login' | 'reset_password' | 'verify_email';

export async function createOtpChallenge(input: { identifier: string; purpose: OtpPurpose; userId?: string | null }) {
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  await dbQuery(
    `INSERT INTO otp_challenges (id, user_id, identifier, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuid(), input.userId ?? null, input.identifier, input.purpose, codeHash, expiresAt]
  );

  return {
    expiresInSeconds: 120,
    previewCode: code
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
