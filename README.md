# TiffinBox Web

React frontend for the TiffinBox API (customer app + admin panel).

**Stack:** Vite 8 · React 19 · TypeScript · Tailwind CSS 4 · React Router 7 · TanStack Query 5 · Axios

## Requirements

- Node.js **20.19+** or **22.12+** (Vite 8 requirement). Check with `node -v`.
- The TiffinBox API running (default `http://localhost:3000`).

## Run it

```bash
npm install
cp .env.example .env     # only edit if your API isn't on localhost:3000
npm run dev              # http://localhost:5173
```

Other scripts: `npm run build` (type-check + production build), `npm run preview`.

## Try it with the seeded accounts

Run `npm run db:seed` in the API project first.

| Role     | Email                | Password    | Lands on |
|----------|----------------------|-------------|----------|
<!-- | Admin    | admin@tiffinbox.com  | admin123    | /admin   | -->
| Customer | customer@test.com    | customer123 | /app     |

## What's inside

**Public:** landing, plans, sign in, register
**Customer (`/app`):** dashboard with today's order tracker and AI picks, subscribe flow,
subscriptions (pause / resume / cancel), orders with status filter, profile, AI assistant (chat + plan finder)
**Admin (`/admin`):** daily orders board with status updates, meal plan CRUD, all subscriptions

## How it talks to the API

- Base URL from `VITE_API_URL` (must include `/api/v1`).
- Access + refresh tokens are kept in `localStorage`. On a 401 the client refreshes once
  (shared across parallel requests), retries, and signs the user out if refresh fails.
- Routes are guarded by role: customers can't open `/admin`, admins are redirected away from `/app`.

## Project layout

```
src/
  api/          one typed function per endpoint
  auth/         AuthContext + route guards
  components/   ui kit, layouts, PlanCard, DayPicker, OrderTracker, TiffinStack (hero)
  lib/          axios client, types, formatting + date helpers
  pages/        public pages, customer/, admin/
  index.css     design tokens (colours, fonts) live in the @theme block
```

## Restyling later

All colours and fonts are tokens in the `@theme` block of `src/index.css`.
Change them there and the whole app follows. Load a web font via a `<link>` in `index.html`
and point `--font-sans` / `--font-display` at it.
