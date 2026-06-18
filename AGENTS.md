# Befind

Befind is an AI-powered business-finder + e-commerce shop generator (French UI). It is an npm-workspaces monorepo: a React/Vite frontend (`artifacts/business-finder`), an Express API (`artifacts/api-server`), and shared libs (`lib/*`).

## Cursor Cloud specific instructions

### Where the code lives
- The `main` branch only contains `README.md`. The actual application currently lives on the feature branch `cursor/rebuild-befind-app-860c` (most complete). Check out that branch (or one based on it) to have any code to run.
- App code is under `artifacts/*` (workspaces `@workspace/business-finder`, `@workspace/api-server`) and `lib/*`. Root `package.json` defines the npm workspaces.

### Services
| Service | Command (from repo root) | Port | Required |
| --- | --- | --- | --- |
| Web (Vite) | `npm run dev` | 5173 | Yes |
| API (Express, tsx watch) | `npm run dev:api` | 3001 | Yes |
| Both together | `npm run dev:replit` | 5173 + 3001 | — |
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | 5432 | Yes |

Vite proxies `/api` → `http://localhost:3001` (see `artifacts/business-finder/vite.config.ts`).

### Required setup that is NOT in the update script
The update script only runs `npm install`. Each session you must also:

1. **Start PostgreSQL** (it does not auto-start): `sudo pg_ctlcluster 16 main start`. A `befind` superuser (password `befind`) and `befind` database are provisioned in the VM snapshot. If missing, recreate with `sudo -u postgres psql -c "CREATE USER befind WITH PASSWORD 'befind' SUPERUSER;" -c "CREATE DATABASE befind OWNER befind;"`.
2. **Tables**: there is no migration tool (no drizzle-kit). Tables are created from hand-written DDL in `scripts/dev-schema.sql` (mirrors `lib/db/src/schema/*.ts`). The tables persist in the snapshot, but to (re)create run: `PGPASSWORD=befind psql -h localhost -U befind -d befind -f scripts/dev-schema.sql`. Keep this file in sync if schema files change.
3. **`.env`**: the API loads env via `dotenv/config`. Because `npm run dev:api` executes with the workspace's cwd, `.env` must exist in BOTH the repo root AND `artifacts/api-server/`. `.env` is gitignored; it persists in the snapshot but recreate it if missing. Minimum working values:
   - `DATABASE_URL=postgresql://befind:befind@localhost:5432/befind`
   - `OPENAI_API_KEY=...` — **must be set or the API throws at module load and won't boot.** A dummy value (e.g. `sk-dummy-local-dev-key`) is enough to boot and to use non-AI flows (auth, contact). A real key is required for the AI features (quiz, chat, shop generation) to actually return results.
   - `AUTH_TOKEN_SECRET=...` (any string; has a dev fallback).

### Optional integrations (degrade gracefully)
- **Stripe** is read via Replit connectors (`REPLIT_CONNECTORS_HOSTNAME`, `REPL_IDENTITY`/`WEB_REPL_RENEWAL`), loaded lazily per request. Pricing/checkout/premium gating need it; everything else works without it.
- **SMTP** (`SMTP_HOST/PORT/USER/PASS/FROM`) only powers the contact-form email. Without it, contact messages are still saved to the DB and the API returns `emailSent: false`.

### Checks
- Typecheck (the real static check): `npm run typecheck` (runs `tsc --noEmit` per workspace).
- Build (frontend only): `npm run build`.
- `npm run lint` is currently a no-op — no workspace defines a `lint` script and there is no ESLint config.
- There is no automated test suite.

### Good no-AI smoke test (end-to-end frontend → API → DB)
Open `http://localhost:5173/contact`, submit the contact form, and confirm a row lands in `contact_messages`. Registering a user at `/api/auth/register` also exercises the DB without OpenAI.
