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
