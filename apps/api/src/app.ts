import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import authRoutes from './modules/auth/routes';
import catalogRoutes from './modules/catalog/routes';
import cartRoutes from './modules/cart/routes';
import locationRoutes from './modules/location/routes';
import orderRoutes from './modules/orders/routes';
import paymentRoutes from './modules/payments/routes';
import adminRoutes from './modules/admin/routes';
import partnerRoutes from './modules/partner/routes';
import { attachAuthContext } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

export const app = express();

const allowedOrigins = new Set([
  env.clientOrigin,
  env.adminOrigin,
  ...env.allowedOrigins,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
].filter(Boolean));

function isAllowedLocalOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function addLoopbackOriginPair(origin: string) {
  try {
    const url = new URL(origin);
    if (url.hostname === 'localhost') {
      allowedOrigins.add(`http://127.0.0.1${url.port ? `:${url.port}` : ''}`);
    }
    if (url.hostname === '127.0.0.1') {
      allowedOrigins.add(`http://localhost${url.port ? `:${url.port}` : ''}`);
    }
  } catch {
    // ignore malformed origins
  }
}

[env.clientOrigin, env.adminOrigin, ...env.allowedOrigins].filter(Boolean).forEach(addLoopbackOriginPair);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || isAllowedLocalOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(attachAuthContext);

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', catalogRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/partner', partnerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
