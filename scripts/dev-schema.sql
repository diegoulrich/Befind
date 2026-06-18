-- Dev database schema for Befind.
-- Hand-written DDL mirroring lib/db/src/schema/*.ts (the repo has no migration tool).
-- Apply with: psql "$DATABASE_URL" -f scripts/dev-schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  email TEXT,
  user_name TEXT,
  business_name TEXT NOT NULL,
  business_description TEXT NOT NULL,
  earning_potential TEXT NOT NULL DEFAULT 'Potentiel à préciser selon l''exécution et le marché.',
  why_it_fits TEXT NOT NULL,
  action_plan TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  is_alternative BOOLEAN NOT NULL DEFAULT false,
  origin_result_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  name TEXT NOT NULL,
  slogan TEXT NOT NULL,
  description TEXT NOT NULL,
  niche TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#6366f1',
  accent_color TEXT NOT NULL DEFAULT '#f59e0b',
  logo_emoji TEXT NOT NULL DEFAULT '🛍️',
  status TEXT NOT NULL DEFAULT 'active',
  shopify_connected BOOLEAN NOT NULL DEFAULT false,
  shopify_domain TEXT,
  public_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_products (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  category TEXT NOT NULL,
  image_emoji TEXT NOT NULL DEFAULT '📦',
  supplier_hint TEXT,
  margin_hint TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_tool_states (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  workspace TEXT NOT NULL,
  module TEXT NOT NULL,
  business_name TEXT NOT NULL,
  field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_output TEXT NOT NULL DEFAULT '',
  saved_note TEXT NOT NULL DEFAULT '',
  completed_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
