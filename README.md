# Indus Reserve Platform Starter

This repository contains a **starter monorepo** for the requested production-style architecture:

- Next.js storefront
- Next.js admin dashboard
- Next.js delivery partner panel
- Express API
- PostgreSQL schema

## Structure

```text
apps/
  customer-web/
  admin-web/
  partner-web/
  api/
packages/
  types/
database/
  schema.sql
infra/
```

## Intended stack

- Frontend: Next.js + React + Tailwind CSS + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Auth: JWT + OTP-ready flows
- Maps: Google Maps API integration points
- Payments: Razorpay / Stripe integration points

## Notes

- The monorepo is a scaffold/starter, not a fully wired production deployment yet.
- The current environment does not appear to have Node/npm on the shell path, so the scaffold is created as code structure and starter files.

## Database bootstrap

1. Create a PostgreSQL database.
2. Run `database/schema.sql`.
3. Run `database/seed.sql`.
4. Copy `apps/api/.env.example` to `.env` inside `apps/api/` and set `DATABASE_URL`.

## Private Git repo push flow

```bash
git init
git remote add origin <your-private-repo-url>
npm install
git add .
git commit -m "Initial monorepo scaffold"
git push -u origin main
```

## Next recommended steps

1. Install Node.js LTS if not already available on the machine shell path.
2. Run `npm install` at the repo root.
3. Bootstrap PostgreSQL with `database/schema.sql` and `database/seed.sql`.
4. Start the API and storefront with the workspace scripts.
5. Add real environment variables and service credentials.

## Vercel + Render deployment

### Services
- Customer storefront: Vercel using `apps/customer-web`
- Admin panel: Vercel using `apps/admin-web`
- API: Render using `render.yaml`
- Database: Render PostgreSQL from the same blueprint, or your own PostgreSQL provider

### Repo files prepared for deployment
- Render blueprint: `render.yaml`
- Customer env example: `apps/customer-web/.env.example`
- Admin env example: `apps/admin-web/.env.example`
- API env example: `apps/api/.env.example`

### Render API setup
1. Push this repository to GitHub.
2. In Render, create a new Blueprint and select this repository.
3. Render will read `render.yaml` and create the API service plus PostgreSQL.
4. Set these values in Render before deploy:
   - `CLIENT_ORIGIN=https://your-customer-domain.vercel.app`
   - `ADMIN_ORIGIN=https://your-admin-domain.vercel.app`
   - `ALLOWED_ORIGINS=` only if you need extra domains
   - payment / OTP keys if you plan to use those integrations
5. After the database is created, run `database/schema.sql` and then `database/seed.sql` against the Render PostgreSQL instance. If you want the updated Near Kart catalog and image patch too, apply `database/patch_nearkart_catalog.sql` after seeding.

### Vercel storefront setup
1. Import the same GitHub repo into Vercel.
2. Create one Vercel project for `apps/customer-web`.
3. Set the Root Directory to `apps/customer-web`.
4. Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-render-api-domain/api/v1`
5. Deploy.

### Vercel admin setup
1. Create another Vercel project for `apps/admin-web`.
2. Set the Root Directory to `apps/admin-web`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-render-api-domain/api/v1`
4. Deploy.

### Useful root commands
- `npm run build:customer`
- `npm run build:admin`
- `npm run build:api`
- `npm run start:api`
