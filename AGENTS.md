# Project Notes

## Current layers
- Legacy Flask prototype remains at the repository root (`app.py`, `templates/`, `static/`)
- New starter monorepo lives under `apps/`, `packages/`, `database/`, and `infra/`

## Workspace apps
- `apps/customer-web` — Next.js storefront on port 3000
- `apps/admin-web` — Next.js admin panel on port 3001
- `apps/partner-web` — Next.js delivery partner panel on port 3002
- `apps/api` — Express API on port 4000

## Commands
- Install dependencies at repo root: `npm install`
- Run storefront: `npm run dev:customer`
- Run admin: `npm run dev:admin`
- Run partner panel: `npm run dev:partner`
- Run API: `npm run dev:api`

## Environment
- Customer env example: `apps/customer-web/.env.example`
- API env example: `apps/api/.env.example`

## Database
- PostgreSQL starter schema: `database/schema.sql`
- PostgreSQL seed data: `database/seed.sql`
- Bootstrap order: run `schema.sql` first, then `seed.sql`

## Notes
- Node/npm were not available on the shell path during scaffolding, so the monorepo was created as starter code and structure without running `npm install` or Next/Express processes in this session.
- The API is now structured for database-backed operation rather than runtime mock fallback.
