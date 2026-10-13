import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { dbQuery } from '../../db/client';

export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type KycDocumentType = 'aadhaar' | 'driving_license' | 'passport' | 'voter_id';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: 'customer' | 'admin' | 'partner';
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  status: string;
  kycStatus: KycStatus;
  kycRejectedReason: string | null;
  ageVerifiedAt: Date | null;
}

export interface KycSubmissionRecord {
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
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  status: string;
  kyc_status: string;
  kyc_rejected_reason: string | null;
  age_verified_at: Date | null;
}): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    passwordHash: row.password_hash,
    role: row.role as AuthUser['role'],
    isMobileVerified: Boolean(row.is_mobile_verified),
    isEmailVerified: Boolean(row.is_email_verified),
    status: row.status,
    kycStatus: row.kyc_status as KycStatus,
    kycRejectedReason: row.kyc_rejected_reason,
    ageVerifiedAt: row.age_verified_at ? new Date(row.age_verified_at) : null
  };
}

function mapKycSubmissionRow(row: {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  document_type: string;
  document_number: string;
  front_image_url: string;
  back_image_url: string | null;
  selfie_image_url: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}): KycSubmissionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    documentType: row.document_type as KycDocumentType,
    documentNumber: row.document_number,
    frontImageUrl: row.front_image_url,
    backImageUrl: row.back_image_url,
    selfieImageUrl: row.selfie_image_url,
    status: row.status as KycStatus,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

const USER_SELECT = `SELECT id, name, email, mobile, password_hash, role, is_mobile_verified, is_email_verified,
                            status, kyc_status, kyc_rejected_reason, age_verified_at
                     FROM users`;

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
    status: string;
    kyc_status: string;
    kyc_rejected_reason: string | null;
    age_verified_at: Date | null;
  }>(`${USER_SELECT} WHERE email = $1 OR mobile = $1 LIMIT 1`, [identifier]);

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
    status: string;
    kyc_status: string;
    kyc_rejected_reason: string | null;
    age_verified_at: Date | null;
  }>(`${USER_SELECT} WHERE id = $1 LIMIT 1`, [id]);

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
    isEmailVerified: false,
    status: 'active',
    kycStatus: 'not_submitted' as const,
    kycRejectedReason: null,
    ageVerifiedAt: null
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

export async function getLatestKycSubmission(userId: string) {
  const { rows } = await dbQuery<{
    id: string;
    user_id: string;
    full_name: string;
    date_of_birth: string;
    document_type: string;
    document_number: string;
    front_image_url: string;
    back_image_url: string | null;
    selfie_image_url: string | null;
    status: string;
    rejection_reason: string | null;
    reviewed_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, user_id, full_name, date_of_birth::text, document_type, document_number, front_image_url,
            back_image_url, selfie_image_url, status, rejection_reason, reviewed_at, created_at, updated_at
     FROM kyc_submissions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] ? mapKycSubmissionRow(rows[0]) : null;
}

export async function submitKycSubmission(input: {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  documentType: KycDocumentType;
  documentNumber: string;
  frontImageUrl: string;
  backImageUrl?: string | null;
  selfieImageUrl?: string | null;
}) {
  const latest = await getLatestKycSubmission(input.userId);
  const submissionId = latest && latest.status !== 'approved' ? latest.id : uuid();

  if (latest && latest.status !== 'approved') {
    await dbQuery(
      `UPDATE kyc_submissions
       SET full_name = $1,
           date_of_birth = $2,
           document_type = $3,
           document_number = $4,
           front_image_url = $5,
           back_image_url = $6,
           selfie_image_url = $7,
           status = 'pending',
           rejection_reason = NULL,
           reviewed_by = NULL,
           reviewed_at = NULL,
           updated_at = NOW()
       WHERE id = $8`,
      [
        input.fullName,
        input.dateOfBirth,
        input.documentType,
        input.documentNumber,
        input.frontImageUrl,
        input.backImageUrl ?? null,
        input.selfieImageUrl ?? null,
        submissionId
      ]
    );
  } else {
    await dbQuery(
      `INSERT INTO kyc_submissions (id, user_id, full_name, date_of_birth, document_type, document_number, front_image_url, back_image_url, selfie_image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
      [
        submissionId,
        input.userId,
        input.fullName,
        input.dateOfBirth,
        input.documentType,
        input.documentNumber,
        input.frontImageUrl,
        input.backImageUrl ?? null,
        input.selfieImageUrl ?? null
      ]
    );
  }

  await dbQuery(
    `UPDATE users
     SET dob = $1,
         kyc_status = 'pending',
         kyc_rejected_reason = NULL,
         kyc_submitted_at = NOW(),
         kyc_reviewed_at = NULL,
         kyc_reviewed_by = NULL,
         age_verified_at = NULL,
         updated_at = NOW()
     WHERE id = $2`,
    [input.dateOfBirth, input.userId]
  );

  return getLatestKycSubmission(input.userId);
}

export async function listKycRequests() {
  const { rows } = await dbQuery<{
    submission_id: string;
    user_id: string;
    user_name: string;
    email: string;
    mobile: string;
    dob: string | null;
    kyc_status: string;
    kyc_rejected_reason: string | null;
    full_name: string;
    date_of_birth: string;
    document_type: string;
    document_number: string;
    front_image_url: string;
    back_image_url: string | null;
    selfie_image_url: string | null;
    rejection_reason: string | null;
    reviewed_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT k.id AS submission_id,
            u.id AS user_id,
            u.name AS user_name,
            u.email,
            u.mobile,
            u.dob::text AS dob,
            u.kyc_status,
            u.kyc_rejected_reason,
            k.full_name,
            k.date_of_birth::text,
            k.document_type,
            k.document_number,
            k.front_image_url,
            k.back_image_url,
            k.selfie_image_url,
            k.rejection_reason,
            k.reviewed_at,
            k.created_at,
            k.updated_at
     FROM kyc_submissions k
     INNER JOIN users u ON u.id = k.user_id
     ORDER BY CASE k.status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END, k.created_at DESC`
  );

  return rows.map((row) => ({
    submissionId: row.submission_id,
    userId: row.user_id,
    userName: row.user_name,
    email: row.email,
    mobile: row.mobile,
    dob: row.dob,
    userKycStatus: row.kyc_status as KycStatus,
    userKycRejectedReason: row.kyc_rejected_reason,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    documentType: row.document_type as KycDocumentType,
    documentNumber: row.document_number,
    frontImageUrl: row.front_image_url,
    backImageUrl: row.back_image_url,
    selfieImageUrl: row.selfie_image_url,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));
}

export async function reviewKycSubmission(input: {
  submissionId: string;
  status: Extract<KycStatus, 'approved' | 'rejected'>;
  rejectionReason?: string | null;
}) {
  const { rows } = await dbQuery<{ user_id: string; date_of_birth: string }>(
    'SELECT user_id, date_of_birth::text FROM kyc_submissions WHERE id = $1 LIMIT 1',
    [input.submissionId]
  );

  const submission = rows[0];
  if (!submission) {
    throw new Error('KYC submission not found');
  }

  await dbQuery(
    `UPDATE kyc_submissions
     SET status = $1,
         rejection_reason = $2,
         reviewed_at = NOW(),
         updated_at = NOW()
     WHERE id = $3`,
    [input.status, input.status === 'rejected' ? input.rejectionReason ?? 'Documents did not meet verification requirements' : null, input.submissionId]
  );

  await dbQuery(
    `UPDATE users
     SET dob = COALESCE($1, dob),
         kyc_status = $2,
         kyc_rejected_reason = $3,
         kyc_reviewed_at = NOW(),
         age_verified_at = CASE WHEN $2 = 'approved' THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $4`,
    [
      submission.date_of_birth,
      input.status,
      input.status === 'rejected' ? input.rejectionReason ?? 'Documents did not meet verification requirements' : null,
      submission.user_id
    ]
  );

  return findUserById(submission.user_id);
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
