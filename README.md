# TinyTimes Preschool (starter)

A working first version of a Kriyo-style school & childcare management app, inspired by
[ikriyo.com](https://ikriyo.com/) and branded for "TinyTimes Preschool". This is the "core admin
essentials" slice: enrollment pipeline, student & staff records, attendance check-in/out, and
parent-facing announcements — built as one responsive React app (desktop dashboard for
admin/staff, installable mobile PWA experience for parents) on top of a Node/Express +
PostgreSQL backend.

**Want to put this online for free?** See [DEPLOY.md](./DEPLOY.md) for a step-by-step guide
using Supabase (database) + Render (backend) + Vercel (frontend) — all free tiers, no credit
card required.

## What's included

- **Auth** — JWT login, three roles: `admin`, `staff`, `parent`.
- **Enrollment pipeline** — drag-and-drop kanban across Inquiry → Tour Scheduled → Enrolled →
  Waitlisted → Withdrawn.
- **Student records** — profile, classroom, allergies/notes, linked guardian (parent) accounts,
  attendance history.
- **Staff records** — admin can create/manage staff & admin accounts.
- **Attendance** — one-tap check-in / check-out board, grouped by classroom, live status dots.
- **Announcements** — post to the whole school, a classroom, or a single family, with optional
  photo attachment; parents see a filtered feed.
- **Parent app** — mobile-first, installable as a PWA (Add to Home Screen), showing each
  child's live attendance status and the message feed for their family/classroom/school.
- **Dashboard** — quick counts: enrolled students, present today, pipeline breakdown, recent
  announcements.

## Not included (out of scope for this first slice)

Billing/invoicing, health & meal tracking beyond allergies, bus tracking, multi-language,
white-labeling, and multi-school/franchise support. The data model (see `server/src/db/schema.js`)
was kept simple on purpose so these are straightforward to layer on later.

## Tech stack

- **Backend**: Node.js, Express, PostgreSQL, [Drizzle ORM](https://orm.drizzle.team/) (chosen
  over Prisma because Prisma's engine binaries couldn't be downloaded in the sandboxed build
  environment — Drizzle is pure JS and has no such dependency), JWT auth, bcrypt, multer for
  photo uploads.
- **Frontend**: React 19 + Vite, React Router, Tailwind CSS v4, `vite-plugin-pwa`.

## Project structure

```
kriyo-app/
  server/            Express API
    src/
      db/            Drizzle schema, db client, seed script
      routes/        auth, students, staff, attendance, messages, dashboard
      middleware/     JWT auth + role guard
      utils/          token signing, multer upload config
    uploads/          uploaded photos (served at /uploads)
  web/               React app (Vite)
    src/
      pages/admin/    admin & staff dashboard screens
      pages/parent/   parent mobile screens
      components/     layouts, shared UI
      context/        auth context
      lib/api.js      axios client (JWT attached automatically)
  docker-compose.yml  optional Postgres container
```

## Running it locally

### 1. Database

You need a PostgreSQL 16 database. Either:

**Option A — you already have Postgres installed**, just create a database:

```bash
createdb kriyo
```

**Option B — use Docker:**

```bash
docker compose up -d
```

Either way, the app expects the connection string in `server/.env` (see below) to match.

### 2. Backend

```bash
cd server
npm install
cp .env.example .env   # then edit DATABASE_URL / JWT_SECRET if needed
npm run db:push        # creates all tables
npm run db:seed        # loads demo school, users, students, attendance, announcements
npm run dev            # starts the API on http://localhost:4000
```

### 3. Frontend

In a second terminal:

```bash
cd web
npm install
npm run dev             # starts the app on http://localhost:5173
```

Open **http://localhost:5173** — the Vite dev server proxies `/api` and `/uploads` to the
backend, so you only need to visit the one URL.

### Demo logins (password for all: `password123`)

| Role   | Email               |
|--------|---------------------|
| Admin  | admin@kriyo.demo    |
| Staff  | staff@kriyo.demo    |
| Parent | parent@kriyo.demo   |

The demo parent is linked to two of the seeded enrolled children so you can see the parent
attendance/feed views populated.

### Installing the parent app on a phone

Once both servers are running and you can reach the frontend from a phone on the same network
(use your machine's LAN IP instead of `localhost`), open it in Chrome/Safari, log in as the
parent demo account, and use "Add to Home Screen" — the PWA manifest and service worker are
already wired up.

## Building for production

```bash
cd web && npm run build     # outputs web/dist — serve as static files behind your API/reverse proxy
cd server && npm start      # runs the API with node (no nodemon)
```

You'll want to put a real reverse proxy (nginx, Caddy, etc.) in front of both, serve `web/dist`
as static files, and set a strong `JWT_SECRET` and real database credentials in `server/.env`.

## Extending it

Some natural next slices, in rough priority order:

1. **Billing** — a `plans`/`invoices`/`payments` set of tables, Razorpay/Stripe integration.
2. **Classrooms as a first-class table** (currently just a free-text field on `students`) with
   capacity, teacher assignment, and schedule.
3. **Health & meals** — nap tracking, meal logs, incident reports.
4. **Push notifications** for the parent PWA (web push) instead of pull-based polling.
5. **Multi-school / franchise support** — most tables already scope by `schoolId`, so this is
   mostly an admin UI + auth change away.
