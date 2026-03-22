# Web Starter Kit

Full-stack monorepo (Vite/React frontend, Express/TypeScript API, pnpm workspaces).

Structure
- `artifacts/hospital-appointment`: Vite/React + Tailwind v4 frontend
- `artifacts/api-server`: Express/TypeScript API
- `lib/*`: shared libraries (api client, db, zod types)

## System architecture
- Client: Vite/React SPA (Tailwind v4) served by Vite dev server or static build.
- API: Express + TypeScript server that exposes REST endpoints under `/api` and proxies auth via middleware.
- Data: PostgreSQL accessed with Drizzle ORM; database schema lives in `lib/db`.
- Contracts: OpenAPI spec in `lib/api-spec`; type-safe clients generated in `lib/api-client-react` and zod validators in `lib/api-zod`.
- Auth: Middleware-based auth layer in `artifacts/api-server/src/middlewares/authMiddleware.ts` plus helpers in `artifacts/api-server/src/lib/auth.ts`.
- Local flow: Browser → Vite (5173) → `/api` proxy → API server (5001) → PostgreSQL.
- Deployable units: frontend static bundle and API server can be deployed independently as long as `/api` points to the API host.

## Development & Deployment Pipeline
1. **Local Development**:
   - Frontend runs in Vite dev server (HMR enabled).
   - Backend runs via standard node runtime or watch scripts (e.g. nodemon/tsc watch).
   - Vite proxies `/api` requests to bypass local CORS limitations.
2. **Schema & API Generation**:
   - `lib/api-spec/openapi.yaml` defines the REST contracts.
   - ORVAL (or similar generators) build React Query hooks/types inside `lib/api-client-react`.
3. **Database Migrations**:
   - Drizzle ORM schemas in `lib/db/src/schema` dictate table structures.
   - `pnpm drizzle-kit push` (or similar commands) syncs schema changes directly to Neon Postgres.
4. **Build Phase**:
   - Frontend: `pnpm build` creates an optimized static `dist` bundle using Vite. Tailwind v4 scans code to generate optimal CSS.
   - Backend: `tsc` compiles TypeScript APIs into `dist`/`build` folders ready for Node environments.
5. **Deployment Strategy**:
   - **Frontend**: Uploads the `dist` folder to static hosts (Vercel, Netlify, Cloudflare Pages, S3).
   - **Backend**: Deploys the built NodeJS output to containerized/PaaS environments (Render, Railway, Heroku, AWS ECS).
   - **Database**: Cloud-hosted Postgres like Neon.tech handling connection pooling (`pooler` URLs recommended).

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
