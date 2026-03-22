# Web Starter Kit

Full-stack monorepo (Vite/React frontend, Express/TypeScript API, pnpm workspaces).

Structure
- `artifacts/hospital-appointment`: Vite/React + Tailwind v4 frontend
- `artifacts/api-server`: Express/TypeScript API
- `lib/*`: shared libraries (api client, db, zod types)

## Prerequisites
- Node 22+
- pnpm 10+
- PostgreSQL URL (Neon is fine)

## Install
```bash
pnpm install
```

## Run locally
Open two terminals at `Web-Starter-Kit/`.

**API (port 5001)**
```bash
$env:DATABASE_URL="<postgres_url>"
$env:OPENAI_API_KEY="<openai_key>"
$env:PORT="5001"
pnpm --filter @workspace/api-server start
```

**Frontend (port 5173, proxies /api → 5001)**
```bash
$env:PORT="5173"
$env:BASE_PATH="/"
pnpm --filter @workspace/hospital-appointment dev
```

Then open http://localhost:5173.

Required environment variables
- `DATABASE_URL` (PostgreSQL connection string)
- `OPENAI_API_KEY` (only needed if using AI endpoints)
- `PORT` (API listen port, e.g., 5001)
- `BASE_PATH` (frontend base path, usually "/")

## Build
```bash
pnpm --filter @workspace/hospital-appointment build
pnpm --filter @workspace/api-server build
```

## Notes
- `.env` files are gitignored. Provide env vars via shell or local env files.
- Tailwind v4 is used in the frontend; rebuild if styles look stale.
- If a port is busy, change `PORT` (API) or `PORT` for Vite and restart both terminals.
