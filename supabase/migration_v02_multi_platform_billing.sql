-- EchoLeads v0.2 migration: multi-platform leads + billing tables
-- Run this once against your existing Supabase Postgres if you deployed v0.1.
-- For fresh databases, `pnpm db:push` after this file is not needed.

BEGIN;

ALTER TABLE leads RENAME COLUMN reddit_post_id TO external_id;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_reddit_post_id_key;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_reddit_post_id_unique;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'reddit';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_reason text;
UPDATE leads SET external_id = external_id WHERE platform IS NULL;

ALTER TABLE leads
  ADD CONSTRAINT leads_campaign_platform_external_unique
  UNIQUE (campaign_id, platform, external_id);

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS platforms text[] NOT NULL DEFAULT ARRAY['reddit']::text[];

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'free',
  plan text NOT NULL DEFAULT 'free',
  stripe_price_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own subscription" ON subscriptions;
CREATE POLICY "users read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS usage_monthly (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  ai_replies integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

ALTER TABLE usage_monthly ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own usage" ON usage_monthly;
CREATE POLICY "users read own usage" ON usage_monthly
  FOR SELECT USING (auth.uid() = user_id);

COMMIT;