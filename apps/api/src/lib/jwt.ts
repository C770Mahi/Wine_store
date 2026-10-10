import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface AuthTokenPayload {
  sub: string;
  role: string;
  mobile?: string;
  email?: string;
  type?: string;
}

export function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: AuthTokenPayload) {
  return jwt.sign({ ...payload, type: 'refresh' }, env.jwtSecret, {
    expiresIn: env.refreshTokenExpiresIn as jwt.SignOptions['expiresIn']
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & AuthTokenPayload;
}
