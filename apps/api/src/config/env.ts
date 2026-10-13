import 'dotenv/config';

function parseOrigins(value?: string) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
  adminOrigin: process.env.ADMIN_ORIGIN ?? '',
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  otpProviderName: process.env.OTP_PROVIDER_NAME ?? '',
  otpProviderApiKey: process.env.OTP_PROVIDER_API_KEY ?? '',
  otpProviderTemplateName: process.env.OTP_PROVIDER_TEMPLATE_NAME ?? '',
  otpProviderAllowInsecureTls: process.env.OTP_PROVIDER_ALLOW_INSECURE_TLS === 'true',
  otpDevPreviewEnabled: process.env.OTP_DEV_PREVIEW_ENABLED !== 'false'
};
