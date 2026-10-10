# Deployment Plan

## Target
- AWS ECS Fargate for apps/api and Next.js apps
- PostgreSQL on Amazon RDS
- Redis on ElastiCache
- Static assets on S3 + CloudFront

## Environments
- development
- staging
- production

## Secrets
- JWT secrets
- OTP provider credentials
- Google Maps API key
- Razorpay and Stripe credentials
- Database URL
- Redis URL

## CI/CD
- GitHub Actions
- Build and lint per workspace
- Staging deploy before production approval
