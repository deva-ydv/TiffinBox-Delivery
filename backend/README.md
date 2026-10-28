# TiffinBox API

A production-ready REST API for a Mumbai tiffin/meal subscription service.

Built with **Node.js · Express · TypeScript · Prisma · PostgreSQL · Gemini AI**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (Access + Refresh Tokens) |
| Validation | Zod | 
| Logging | Winston |
| Scheduling | node-cron |
| AI | Google Gemini 1.5 Flash |

---

## Features

- JWT authentication with refresh token rotation
- Role-based access control (CUSTOMER / ADMIN)
- Meal plan management (CRUD)
- Subscription management (subscribe, pause, resume, cancel)
- Daily order auto-generation via cron job (runs at 6AM IST)
- Idempotent order creation — no duplicates even if cron runs twice
- AI-powered meal recommendations based on order history
- AI support chatbot with tool calling (reads real DB data)
- Smart plan suggester for new users

---

## Getting Started

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd tiffin-api
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Fill in your values
```

### 3. Set up database
```bash
npm run db:push       # Push schema to DB
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed admin + sample meal plans
```

### 4. Run development server
```bash
npm run dev
```

Server starts at `http://localhost:3000`

---

<!-- ## Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@tiffinbox.com | admin123 |
| Customer | customer@test.com | customer123 | -->

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | ❌ | Register new customer |
| POST | `/api/v1/auth/login` | ❌ | Login |
| POST | `/api/v1/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/v1/auth/logout` | ✅ | Logout |
| GET | `/api/v1/auth/profile` | ✅ | Get profile |
| PATCH | `/api/v1/auth/profile` | ✅ | Update profile |

### Meals
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/v1/meals` | ❌ | — | Browse all meal plans |
| GET | `/api/v1/meals/:id` | ❌ | — | Single meal plan |
| POST | `/api/v1/meals` | ✅ | ADMIN | Create meal plan |
| PATCH | `/api/v1/meals/:id` | ✅ | ADMIN | Update meal plan |
| DELETE | `/api/v1/meals/:id` | ✅ | ADMIN | Soft delete meal plan |

### Subscriptions
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/v1/subscriptions` | ✅ | CUSTOMER | Subscribe to a plan |
| GET | `/api/v1/subscriptions/my` | ✅ | CUSTOMER | My subscriptions |
| PATCH | `/api/v1/subscriptions/:id/pause` | ✅ | CUSTOMER | Pause subscription |
| PATCH | `/api/v1/subscriptions/:id/resume` | ✅ | CUSTOMER | Resume subscription |
| PATCH | `/api/v1/subscriptions/:id/cancel` | ✅ | CUSTOMER | Cancel subscription |
| GET | `/api/v1/subscriptions` | ✅ | ADMIN | All subscriptions |

### Orders
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/v1/orders/my` | ✅ | CUSTOMER | My orders |
| GET | `/api/v1/orders/my/:id` | ✅ | CUSTOMER | Single order |
| GET | `/api/v1/orders` | ✅ | ADMIN | All orders (filter by status/date) |
| PATCH | `/api/v1/orders/:id/status` | ✅ | ADMIN | Update order status |

### AI
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/ai/recommendations` | ✅ | Personalised meal recommendations |
| POST | `/api/v1/ai/chat` | ✅ | AI support chatbot with DB access |
| POST | `/api/v1/ai/suggest-plan` | ✅ | Smart plan suggester for new users |

---

## Deployment

Recommended: **Render** (free tier) + **Neon** (free PostgreSQL)

1. Push code to GitHub
2. Create a new Web Service on Render pointing to your repo
3. Set all `.env` variables in Render's environment settings
4. Set build command: `npm install && npm run db:generate && npm run build`
5. Set start command: `npm start`

---

## Project Structure

```
src/
├── config/         # DB and env setup
├── middleware/     # Auth, RBAC, validation, error handler
├── modules/        # Feature modules (auth, meals, subscriptions, orders, ai)
│   └── <module>/
│       ├── *.routes.ts
│       ├── *.controller.ts
│       ├── *.service.ts
│       └── *.schema.ts
├── jobs/           # Cron jobs (daily order generator)
├── utils/          # ApiError, ApiResponse, logger
└── app.ts          # Entry point
prisma/
├── schema.prisma
└── seed.ts
```
