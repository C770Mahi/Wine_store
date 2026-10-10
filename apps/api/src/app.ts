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
import { errorHandler, notFoundHandler } from './middleware/error-handler';

export const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());

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
