import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt';

interface RequestAuth {
  userId: string;
  role: string;
  email?: string;
  mobile?: string;
}

type AuthenticatedRequest = Request & { auth?: RequestAuth };

function getBearerToken(request: Request) {
  const header = request.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice(7).trim();
}

export function attachAuthContext(request: Request, response: Response, next: NextFunction) {
  const token = getBearerToken(request);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.type === 'refresh') {
      response.status(401).json({ message: 'Refresh tokens cannot be used for API access' });
      return;
    }

    (request as AuthenticatedRequest).auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
      mobile: payload.mobile
    };
    next();
  } catch {
    response.status(401).json({ message: 'Invalid or expired access token' });
  }
}

export function requireCustomerAuth(request: Request, response: Response, next: NextFunction) {
  const auth = (request as AuthenticatedRequest).auth;
  if (!auth) {
    response.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (auth.role !== 'customer') {
    response.status(403).json({ message: 'Customer access required' });
    return;
  }

  next();
}

export function requireApprovedCustomer(request: Request, response: Response, next: NextFunction) {
  const auth = (request as AuthenticatedRequest).auth;
  if (!auth) {
    response.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (auth.role !== 'customer') {
    response.status(403).json({ message: 'Customer access required' });
    return;
  }

  next();
}

export function getRequestUserId(request: Request) {
  return (request as AuthenticatedRequest).auth?.userId;
}
