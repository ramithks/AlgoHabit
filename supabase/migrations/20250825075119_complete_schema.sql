-- Complete schema for AlgoHabit (normalized, Auth integrated)
-- This creates all tables, enums, functions, triggers, and constraints from scratch

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles mirror the auth.users table and keep a copy of the email for joins.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  username text UNIQUE,
  full_name text,
  is_public boolean NOT NULL DEFAULT false,
  username_changed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: unique index on lower(username) to enforce case-insensitive uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'profiles_username_lower_unique'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX profiles_username_lower_unique ON public.profiles (lower(username))';
  END IF;
END $$;

-- Helper: reserved usernames
CREATE OR REPLACE FUNCTION public.is_reserved_username(name text)
RETURNS boolean AS $$
BEGIN
  IF name IS NULL THEN RETURN false; END IF;
  RETURN lower(name) IN (
    'me','auth','login','signup','settings','u','app','admin'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Helper: verified email check (SECURITY DEFINER to safely read auth.users)
CREATE OR REPLACE FUNCTION public.is_email_verified(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(u.email_confirmed_at IS NOT NULL, false)
  FROM auth.users u
  WHERE u.id = uid
$$;

REVOKE ALL ON FUNCTION public.is_email_verified(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_email_verified(uuid) TO authenticated;

-- Helper: generate random username (ensures not reserved and unique)
CREATE OR REPLACE FUNCTION public.generate_random_username()
RETURNS text AS $$
DECLARE
  adjs text[] := ARRAY['swift','brave','clever','calm','bright','bold','eager','keen'];
  nouns text[] := ARRAY['coder','algo','byte','stack','graph','tree','array','heap'];
  candidate text;
  tries int := 0;
BEGIN
  LOOP
    tries := tries + 1;
    candidate := lower(
      adjs[1 + floor(random()*array_length(adjs,1))::int] || '-' ||
      nouns[1 + floor(random()*array_length(nouns,1))::int] || '-' ||
      lpad((floor(random()*999))::int::text, 2, '0')
    );
    IF NOT public.is_reserved_username(candidate)
       AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(candidate)) THEN
      RETURN candidate;
    END IF;
    IF tries > 25 THEN
      -- fallback to uuid slice
      candidate := lower(replace(gen_random_uuid()::text,'-',''));
      RETURN left(candidate, 12);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (new.id, new.email, public.generate_random_username())
  ON CONFLICT (id) DO UPDATE SET email = excluded.email, updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET email = new.email,
      updated_at = now()
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for user management
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_update();

-- Username format constraint (lowercase letters, digits, dash, underscore; 3-30 chars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_format_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format_chk
      CHECK (
        username IS NULL OR lower(username) ~ '^[a-z0-9_-]{3,30}$'
      );
  END IF;
END $$;

-- Speed up public lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public);

-- Username aliases keep old handles for redirects
CREATE TABLE IF NOT EXISTS public.username_aliases (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, username)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='username_aliases_username_lower_unique'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX username_aliases_username_lower_unique ON public.username_aliases (lower(username))';
  END IF;
END $$;

ALTER TABLE public.username_aliases ENABLE ROW LEVEL SECURITY;

-- Owner access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='username_aliases' AND policyname='username_aliases rw'
  ) THEN
    CREATE POLICY "username_aliases rw" ON public.username_aliases
    FOR ALL USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) );
  END IF;
END $$;

-- Public read for aliases when profile is public
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='username_aliases' AND policyname='username_aliases public read'
  ) THEN
    CREATE POLICY "username_aliases public read" ON public.username_aliases
    FOR SELECT USING ( EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.is_public = true) );
  END IF;
END $$;

-- User metrics (xp, streak, last_active)
CREATE TABLE IF NOT EXISTS public.user_metrics (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  last_active date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Topic status enum
DO $$
BEGIN
  CREATE TYPE topic_status AS ENUM ('pending','in-progress','complete','skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.topics_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  week integer NOT NULL,
  status topic_status NOT NULL DEFAULT 'pending',
  last_touched date,
  xp_in_progress boolean NOT NULL DEFAULT false,
  xp_complete boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

-- Per-topic daily notes (one row per day per topic)
CREATE TABLE IF NOT EXISTS public.topic_daily_notes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  day date NOT NULL,
  note text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id, day)
);

-- Performance indexes for normalized access patterns
CREATE INDEX IF NOT EXISTS idx_topics_progress_user ON public.topics_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_progress_user_week ON public.topics_progress(user_id, week);
CREATE INDEX IF NOT EXISTS idx_topics_progress_user_status ON public.topics_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_topic_daily_notes_user_day ON public.topic_daily_notes(user_id, day);

-- Activity log (days user was active)
CREATE TABLE IF NOT EXISTS public.activity_log (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policies: owners can read/write their rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles self select'
  ) THEN
  EXECUTE 'ALTER POLICY "profiles self select" ON public.profiles USING ( id = (SELECT auth.uid()) )';
  ELSE
    CREATE POLICY "profiles self select" ON public.profiles
    FOR SELECT USING ( id = (SELECT auth.uid()) );
  END IF;
END $$;

-- Public read-only access to profiles when is_public is true
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles public read'
  ) THEN
  EXECUTE 'ALTER POLICY "profiles public read" ON public.profiles USING ( is_public = true )';
  ELSE
    CREATE POLICY "profiles public read" ON public.profiles
    FOR SELECT USING ( is_public = true );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles self upsert'
  ) THEN
  EXECUTE 'ALTER POLICY "profiles self upsert" ON public.profiles WITH CHECK ( id = (SELECT auth.uid()) )';
  ELSE
    CREATE POLICY "profiles self upsert" ON public.profiles
    FOR INSERT WITH CHECK ( id = (SELECT auth.uid()) );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles self update'
  ) THEN
  EXECUTE 'ALTER POLICY "profiles self update" ON public.profiles USING ( id = (SELECT auth.uid()) )';
  ELSE
    CREATE POLICY "profiles self update" ON public.profiles
    FOR UPDATE USING ( id = (SELECT auth.uid()) );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_metrics' AND policyname='metrics rw'
  ) THEN
  EXECUTE 'ALTER POLICY "metrics rw" ON public.user_metrics USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) )';
  ELSE
    CREATE POLICY "metrics rw" ON public.user_metrics
    FOR ALL USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) );
  END IF;
END $$;

-- Public read for metrics where the owning profile is public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_metrics' AND policyname='metrics public read'
  ) THEN
  EXECUTE 'ALTER POLICY "metrics public read" ON public.user_metrics USING ( EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.is_public = true) )';
  ELSE
    CREATE POLICY "metrics public read" ON public.user_metrics
    FOR SELECT USING ( EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.is_public = true) );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='topics_progress' AND policyname='topics_progress rw'
  ) THEN
  EXECUTE 'ALTER POLICY "topics_progress rw" ON public.topics_progress USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) )';
  ELSE
    CREATE POLICY "topics_progress rw" ON public.topics_progress
    FOR ALL USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) );
  END IF;
END $$;

-- Public read for topics where the owning profile is public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='topics_progress' AND policyname='topics_progress public read'
  ) THEN
  EXECUTE 'ALTER POLICY "topics_progress public read" ON public.topics_progress USING ( EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.is_public = true) )';
  ELSE
    CREATE POLICY "topics_progress public read" ON public.topics_progress
    FOR SELECT USING ( EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.is_public = true) );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='topic_daily_notes' AND policyname='topic_notes rw'
  ) THEN
  EXECUTE 'ALTER POLICY "topic_notes rw" ON public.topic_daily_notes USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) )';
  ELSE
    CREATE POLICY "topic_notes rw" ON public.topic_daily_notes
    FOR ALL USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activity_log' AND policyname='activity rw'
  ) THEN
  EXECUTE 'ALTER POLICY "activity rw" ON public.activity_log USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) )';
  ELSE
    CREATE POLICY "activity rw" ON public.activity_log
    FOR ALL USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) );
  END IF;
END $$;

-- Public read for activity days when profile is public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activity_log' AND policyname='activity public read'
  ) THEN
  EXECUTE 'ALTER POLICY "activity public read" ON public.activity_log USING ( EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.is_public = true) )';
  ELSE
    CREATE POLICY "activity public read" ON public.activity_log
    FOR SELECT USING ( EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.is_public = true) );
  END IF;
END $$;

-- Optional helper to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Enforce username rules (reserved names, cooldown, and track change time)
CREATE OR REPLACE FUNCTION public.enforce_username_rules()
RETURNS trigger AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    IF new.username IS NOT NULL AND public.is_reserved_username(new.username) THEN
      RAISE EXCEPTION 'Reserved username';
    END IF;
    RETURN new;
  END IF;
  IF tg_op = 'UPDATE' THEN
    IF new.username IS DISTINCT FROM old.username THEN
      -- store old username as an alias for redirects
      IF old.username IS NOT NULL THEN
        BEGIN
          INSERT INTO public.username_aliases(user_id, username)
          VALUES (old.id, old.username)
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN others THEN NULL;
        END;
      END IF;
      IF new.username IS NULL THEN
        -- allow clearing (though app does not use it), do not set changed_at
        RETURN new;
      END IF;
      IF public.is_reserved_username(new.username) THEN
        RAISE EXCEPTION 'Reserved username';
      END IF;
      -- enforce 7 day cooldown between username changes
      IF old.username_changed_at IS NOT NULL AND (now() - old.username_changed_at) < interval '7 days' THEN
        RAISE EXCEPTION 'Username can only be changed once every 7 days';
      END IF;
      new.username_changed_at := now();
    END IF;
    -- Only allow enabling public if email is verified
    IF new.is_public = true AND (old.is_public IS DISTINCT FROM true) THEN
      IF NOT public.is_email_verified(new.id) THEN
        RAISE EXCEPTION 'Verify your email before enabling public profile';
      END IF;
    END IF;
    RETURN new;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_username_rules ON public.profiles;
CREATE TRIGGER trg_enforce_username_rules
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_username_rules();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill: assign usernames to existing profiles missing a username
DO $$
BEGIN
  UPDATE public.profiles p
  SET username = public.generate_random_username()
  WHERE p.username IS NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_user_metrics ON public.user_metrics;
CREATE TRIGGER set_updated_at_user_metrics BEFORE UPDATE ON public.user_metrics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_topics_progress ON public.topics_progress;
CREATE TRIGGER set_updated_at_topics_progress BEFORE UPDATE ON public.topics_progress   
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_topic_daily_notes ON public.topic_daily_notes;
CREATE TRIGGER set_updated_at_topic_daily_notes BEFORE UPDATE ON public.topic_daily_notes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_activity_log ON public.activity_log;
CREATE TRIGGER set_updated_at_activity_log BEFORE UPDATE ON public.activity_log
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migrate legacy JSON tables if present and revoke access to stop expensive anon writes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'progress' AND column_name = 'payload'
  ) THEN
    ALTER TABLE public.progress RENAME TO progress_legacy;
  END IF;
END $$;

-- Revoke access from legacy tables if they exist (prevents costly anon upserts)
DO $$
BEGIN
  IF to_regclass('public.progress_legacy') IS NOT NULL THEN
    REVOKE ALL ON TABLE public.progress_legacy FROM public;
    BEGIN
      EXECUTE 'REVOKE ALL ON TABLE public.progress_legacy FROM anon';
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    BEGIN
      EXECUTE 'REVOKE ALL ON TABLE public.progress_legacy FROM authenticated';
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
  END IF;
END $$;

-- ==========================
-- Subscriptions & Payments
-- ==========================

-- Plan types and subscription status enums
DO $$
BEGIN
  CREATE TYPE plan_type AS ENUM (
    'weekly','monthly','quarterly','semiannual','yearly','biennial','lifetime'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END;$$;

DO $$
BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'pending','active','canceled','expired','failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END;$$;

DO $$
BEGIN
  CREATE TYPE payment_status AS ENUM ('created','pending','success','failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END;$$;

-- Main subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan plan_type NOT NULL,
  plan_label text, -- e.g., pro_weekly
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  grace_days integer NOT NULL DEFAULT 2,
  status subscription_status NOT NULL DEFAULT 'pending',
  -- Razorpay mapping
  razorpay_subscription_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_state payment_status NOT NULL DEFAULT 'created',
  currency text DEFAULT 'INR',
  amount_paise integer, -- latest cycle amount for reference
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON public.subscriptions(user_id, end_date);

-- Payments history table
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_paise integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_user ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_sub ON public.subscription_payments(subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Owner policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions' AND policyname='subscriptions rw'
  ) THEN
    CREATE POLICY "subscriptions rw" ON public.subscriptions
    FOR ALL USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscription_payments' AND policyname='sub_payments rw'
  ) THEN
    CREATE POLICY "sub_payments rw" ON public.subscription_payments
    FOR ALL USING ( user_id = (SELECT auth.uid()) ) WITH CHECK ( user_id = (SELECT auth.uid()) );
  END IF;
END $$;

-- updated_at trigger for subscriptions
DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: compute if subscription is active including grace period
CREATE OR REPLACE FUNCTION public.subscription_is_active(s public.subscriptions)
RETURNS boolean AS $$
BEGIN
  IF s.plan = 'lifetime' AND s.status = 'active' THEN
    RETURN true;
  END IF;
  IF s.status <> 'active' THEN
    -- allow pending if within start/end? keep strict
    RETURN false;
  END IF;
  IF s.end_date IS NULL THEN
    RETURN s.status = 'active';
  END IF;
  RETURN (
    now() <= s.end_date
    OR now() <= (s.end_date + make_interval(days => greatest(s.grace_days, 0)))
  ) AND s.status = 'active';
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- View: active subscription per user (latest first)
CREATE OR REPLACE VIEW public.v_active_subscriptions AS
SELECT DISTINCT ON (user_id)
  s.*,
  public.subscription_is_active(s) AS is_active,
  (CASE WHEN s.end_date IS NOT NULL THEN s.end_date + make_interval(days => greatest(s.grace_days,0)) END) AS grace_until
FROM public.subscriptions s
ORDER BY user_id, COALESCE(s.end_date, s.created_at) DESC, s.created_at DESC;

-- SECURITY: ensure the active subscriptions view is not exposed to anon/public roles.
-- Allow only authenticated users (and other privileged roles) to select from this view.
DO $$
BEGIN
  -- revoke broadly from public and anon (if present) and grant to authenticated
  BEGIN
    REVOKE ALL ON public.v_active_subscriptions FROM public;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    REVOKE ALL ON public.v_active_subscriptions FROM anon;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    GRANT SELECT ON public.v_active_subscriptions TO authenticated;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- Helper: check pro status quickly
CREATE OR REPLACE FUNCTION public.is_pro(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(v.is_active, false)
  FROM public.v_active_subscriptions v
  WHERE v.user_id = uid
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.is_pro(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO authenticated;

-- ==========================
-- CRITICAL FIX: Prevent duplicate active subscriptions
-- ==========================

-- Add unique index to prevent duplicate active subscriptions per user
-- This prevents race conditions between verify-payment and webhook functions
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_status_unique 
ON public.subscriptions(user_id, status) 
WHERE status = 'active';
