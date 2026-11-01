# BankOS (React + Express + Supabase) — Vercel-ready

Single Vercel project: Vite/React frontend (`src/`), Express API as a serverless function (`api/index.ts` -> `server/`), Supabase Postgres (`supabase/migrations/001_schema.sql`).

## 1. Database
Supabase -> SQL Editor -> paste and run `supabase/migrations/001_schema.sql`.
Copy the Project URL and the **service_role** key (Settings -> API). The key is server-only.

## 2. Run locally
```bash
cp .env.example .env     # fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm install
npm run dev              # API :8080 + web :5173 (Vite proxies /api)
```

## 3. Deploy to Vercel
1. Push this folder to a Git repo (or run `npx vercel` from this folder).
2. Import in Vercel. Framework is auto-detected as Vite (settings come from `vercel.json`).
3. Add env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (32+ random chars), `CORS_ORIGIN` (`*` or your domain).
4. Deploy, then check `https://<your-domain>/api/health` -> `{"status":"UP"}`.

## API (all under /api; protected routes need `Authorization: Bearer <token>`)
| Method | Path | Body |
|---|---|---|
| GET | /health | |
| POST | /auth/register | username, email, password |
| POST | /auth/login | username, password -> `{token, username, email, role}` |
| POST/GET | /accounts | accountHolderName, accountType, initialBalance |
| GET | /accounts/:id, /accounts/account-number/:n | |
| POST | /transactions/deposit, /transactions/withdraw | accountId, amount |
| GET | /transactions, /transactions/account/:accountId | |
| POST | /transfers | fromAccountId, toAccountId, amount, description |
| GET | /audit, /audit/user/:username | ADMIN sees all; users see their own |

Deposits, withdrawals, transfers and account creation run as single Postgres functions with row locks (no race conditions or overdrafts; `balance >= 0` is also a table constraint).

## Make an admin
`update users set role = 'ADMIN' where username = 'yourname';` (log in again to get a new token).
