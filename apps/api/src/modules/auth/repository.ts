import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { dbQuery } from '../../db/client';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: 'customer' | 'admin' | 'partner';
  isMobileVerified: boolean;
  isEmailVerified: boolean;
}

function mapUserRow(row: {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password_hash: string;
  role: string;
  is_mobile_verified: boolean;
  is_email_verified: boolean;
}): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    passwordHash: row.password_hash,
    role: row.role as AuthUser['role'],
    isMobileVerified: Boolean(row.is_mobile_verified),
    isEmailVerified: Boolean(row.is_email_verified)
  };
}

export async function findUserByIdentifier(identifier: string) {
  const { rows } = await dbQuery<{
    id: string;
    name: string;
    email: string;
    mobile: string;
    password_hash: string;
    role: string;
    is_mobile_verified: boolean;
    is_email_verified: boolean;
  }>('SELECT id, name, email, mobile, password_hash, role, is_mobile_verified, is_email_verified FROM users WHERE email = $1 OR mobile = $1 LIMIT 1', [identifier]);

  return rows[0] ? mapUserRow(rows[0]) : null;
}

export async function findUserById(id: string) {
  const { rows } = await dbQuery<{
    id: string;
    name: string;
    email: string;
    mobile: string;
    password_hash: string;
    role: string;
    is_mobile_verified: boolean;
    is_email_verified: boolean;
  }>('SELECT id, name, email, mobile, password_hash, role, is_mobile_verified, is_email_verified FROM users WHERE id = $1 LIMIT 1', [id]);

  return rows[0] ? mapUserRow(rows[0]) : null;
}

export async function createUser(input: { name: string; email: string; mobile: string; passwordHash: string }) {
  const id = uuid();
  await dbQuery(
    `INSERT INTO users (id, name, email, mobile, password_hash, role, is_mobile_verified, is_email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, input.name, input.email, input.mobile, input.passwordHash, 'customer', false, false]
  );

  return {
    id,
    name: input.name,
    email: input.email,
    mobile: input.mobile,
    passwordHash: input.passwordHash,
    role: 'customer' as const,
    isMobileVerified: false,
    isEmailVerified: false
  };
}

export async function markMobileVerified(identifier: string) {
  await dbQuery('UPDATE users SET is_mobile_verified = TRUE, updated_at = NOW() WHERE mobile = $1', [identifier]);
}

export async function markEmailVerified(identifier: string) {
  await dbQuery('UPDATE users SET is_email_verified = TRUE, updated_at = NOW() WHERE email = $1', [identifier]);
}

export async function updatePassword(userId: string, passwordHash: string) {
  await dbQuery('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);
}

export async function saveRefreshSession(userId: string, refreshToken: string) {
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await dbQuery(
    `INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [uuid(), userId, refreshTokenHash, expiresAt]
  );
}

export async function hasValidRefreshSession(userId: string, refreshToken: string) {
  const { rows } = await dbQuery<{ refresh_token_hash: string }>(
    `SELECT refresh_token_hash
     FROM user_sessions
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [userId]
  );

  for (const row of rows) {
    if (await bcrypt.compare(refreshToken, row.refresh_token_hash)) {
      return true;
    }
  }

  return false;
}

export async function revokeRefreshSession(refreshToken: string) {
  const { rows } = await dbQuery<{ id: string; refresh_token_hash: string }>(
    'SELECT id, refresh_token_hash FROM user_sessions WHERE revoked_at IS NULL AND expires_at > NOW()'
  );

  for (const row of rows) {
    if (await bcrypt.compare(refreshToken, row.refresh_token_hash)) {
      await dbQuery('UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1', [row.id]);
    }
  }
}
