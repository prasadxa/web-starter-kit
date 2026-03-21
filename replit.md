# MediBook — Multi-Hospital Doctor Appointment System

## Overview

Full-stack doctor appointment booking platform (simplified Practo/ZocDoc). Patients can browse departments, find top-rated doctors, check availability, and book appointments. Doctors can manage their schedules. Hospital admins can manage their facility. A super admin sees platform-wide analytics. Includes AI symptom checker, payment processing, interactive hospital maps, medical records, in-app notifications, and enhanced analytics.

Built as a pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React 18 + Vite + TailwindCSS v4 + shadcn/ui + React Query + Recharts + Leaflet
- **Backend**: Express 5 + PostgreSQL + Drizzle ORM + OpenAI (via Replit AI Integration) + Stripe (optional)
- **Auth**: Replit OIDC (openid-client), session-based (cookie)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (API server bundle)

## Structure

```text
├── artifacts/
│   ├── api-server/             # Express API server (port 8080)
│   └── hospital-appointment/   # React+Vite frontend (proxies /api to 8080)
├── lib/
│   ├── api-spec/               # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas from OpenAPI
│   ├── db/                     # Drizzle ORM schema + DB connection
│   └── replit-auth-web/        # useAuth() React hook for Replit OIDC
├── scripts/
│   └── src/seed.ts             # Database seed script
├── pnpm-workspace.yaml
├── tsconfig.base.json          # Shared TS options
└── tsconfig.json               # Root TS project references
```

## Key Features

- **Doctor Ranking Algorithm**: `score = rating × 0.6 + log(reviews) × 0.3 + (hasAvailability ? 0.1 : 0)`
- **"Top Rated" Badge**: Gold award icon for doctors with rating ≥ 4.5 AND totalReviews ≥ 10
- **Double-booking Prevention**: Unique constraint on `(doctorId, date, timeSlot)` + runtime 409 check
- **Role-based Dashboards**: patient / doctor / hospital_admin / super_admin
- **Appointment Lifecycle**: pending → booked → completed/cancelled
- **Reviews**: Auto-updates doctor's averageRating + totalReviews after submission, doctor reply support, verified patient badge
- **AI Symptom Checker**: OpenAI GPT-4o-mini integration for symptom analysis and department recommendation
- **Payment Processing**: Stripe integration with demo fallback (auto-marks paid if no STRIPE_SECRET_KEY)
- **Hospital Map**: Leaflet/OpenStreetMap with hospital markers and Google Maps directions
- **Medical Records (EHR)**: CRUD for medical records — patients can self-create, doctors/admins manage
- **In-app Notifications**: Real-time notification bell with unread count, mark-read support
- **Enhanced Analytics**: Revenue charts, appointment trends, top doctors/departments (Recharts)
- **Video Consultations**: consultation_type field and meeting_link on appointments

## Database Schema

- `users` (from replit auth) — id (replitUserId), role, hospitalId, doctorId
- `hospitals` — name, location, approved, latitude, longitude
- `departments` — name, description, icon
- `doctors` — userId (FK→users), hospitalId, departmentId, firstName, lastName, experience, consultationFee, averageRating, totalReviews, bio, specialization, qualification
- `availability` — doctorId, date (string "yyyy-MM-dd"), timeSlots (text[]), UNIQUE(doctorId, date)
- `appointments` — patientId, doctorId, hospitalId, date, timeSlot, status, notes, hasReview, paymentStatus, paymentId, stripeSessionId, consultationType, meetingLink, UNIQUE(doctorId, date, timeSlot) for status=booked
- `reviews` — patientId, doctorId, appointmentId, rating (1-5), comment, verifiedPatient, doctorReply, doctorReplyAt, createdAt
- `medical_records` — patientId, doctorId, appointmentId, title, description, fileUrl, fileType, diagnosis, prescription, createdAt
- `notifications` — userId, title, message, type, read, relatedId, createdAt

## API Routes (all under /api)

- `GET/POST /departments`
- `GET/POST /hospitals`, `GET/PATCH /hospitals/:id`
- `GET/POST /doctors`, `GET/PATCH /doctors/:id`
- `GET /doctors/:id/availability`, `POST /doctors/:id/availability`
- `GET/POST /appointments`, `GET/PATCH /appointments/:id`
- `POST /reviews`, `POST /reviews/:id/reply` (doctor reply)
- `GET/PATCH /users/profile`
- `GET /admin/analytics` (super_admin only)
- `GET /admin/enhanced-analytics` (admin roles)
- `POST /symptoms/check` (AI symptom analysis)
- `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- `GET/POST /medical-records`
- `POST /payments/create-session`, `GET /payments/success`, `POST /payments/webhook`
- `GET /auth/user`, `GET /auth/login`, `GET /auth/callback`, `GET /auth/logout`

## Auth Flow

Replit OIDC → `/api/login` → Replit OAuth → `/api/callback` → session cookie. `useAuth()` hook in frontend reads `/api/auth/user` to check session.

## Frontend Pages

- `/` — Hero + Browse by Specialty + Top Rated Doctors + Hospital Map
- `/doctors` — Searchable/filterable doctor listing with sidebar filters
- `/doctors/:id` — Doctor profile (bio, qualifications, reviews with doctor replies, verified badges)
- `/doctors/:id/book` — Appointment booking (date picker → time slots → confirm)
- `/dashboard` — Role-based dashboard (patient / doctor / hospital_admin / super_admin)
- `/symptom-checker` — AI-powered symptom analysis with department recommendations
- `/medical-records` — EHR management (view/create medical records)
- `/analytics` — Enhanced analytics dashboard with Recharts (trends, revenue, top docs/depts)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI Integration (auto-set)
- `STRIPE_SECRET_KEY` — Optional; if not set, payment runs in demo mode (auto-marks paid)

## Development Commands

```bash
pnpm install                                       # Install all deps
pnpm --filter @workspace/db run push               # Push schema to DB
pnpm --filter @workspace/scripts run seed          # Seed test data
pnpm --filter @workspace/api-server run dev        # Start API server
pnpm --filter @workspace/hospital-appointment run dev  # Start frontend
```

## Important Notes

- **Date Serialization**: Custom serializer on each route converts PostgreSQL `Date` objects to ISO strings
- **Hospital Zod Parse Removed**: Hospital routes return serialized data directly (no Zod response validation) to avoid date type mismatch
- **Doctor Names**: Stored directly on `doctors` table (`firstName`, `lastName`) for seed doctors
- **Vite Proxy**: Frontend Vite config proxies `/api/*` to `http://localhost:8080` for development
- **Seed Data**: 3 hospitals (with lat/lng), 10 departments, 12 doctors with 5-7 days of availability pre-seeded
- **Stripe Demo Mode**: If `STRIPE_SECRET_KEY` is not set, payment endpoints mark appointments as paid immediately without Stripe

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` with `composite: true`. Root `tsconfig.json` lists all packages as project references.

- Run typecheck from root: `pnpm run typecheck`
- Run codegen: `pnpm --filter @workspace/api-spec run codegen`
