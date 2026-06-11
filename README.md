# Befind

Befind is an AI-powered business finder and e-commerce shop generator.

## Workspaces

- `artifacts/business-finder` - React/Vite web app
- `artifacts/api-server` - Express API server
- `lib/db` - Drizzle database schema and client
- `lib/api-zod` - shared API validation schemas
- `lib/api-client-react` - React Query API helpers

## Local development

```bash
npm install
npm run dev
```

Run the API separately with:

```bash
npm run dev:api
```

To run the web app and API together:

```bash
npm run dev:replit
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the
API on `http://localhost:3001`.

## Replit setup

This repo includes a `.replit` file. After importing the GitHub repo in Replit:

1. Add the required secrets in Replit:
   - `OPENAI_API_KEY`
   - `DATABASE_URL`
2. Connect Stripe from the Replit Integrations tab if you want pricing,
   checkout, and subscription-gated shop generation to work.
3. Press Run. Replit will execute:

```bash
npm run dev:replit
```

The public Replit webview should open the Vite app on port `5173`; the Express
API stays available internally on port `3001`.
