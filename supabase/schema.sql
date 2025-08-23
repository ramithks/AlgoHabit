-- Supabase schema for AlgoHabit (normalized, Auth integrated)
-- Run this in Supabase SQL editor. This assumes Supabase Auth (email/password) is enabled.

-- Note on password rules: Configure password complexity in Supabase Dashboard
-- Settings → Auth → Password policy (require lowercase, uppercase, digits, symbols).
-- Passwords are managed by Supabase Auth and are NOT stored in public tables.

-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists pgcrypto;

-- Profiles mirror the auth.users table and keep a copy of the email for joins.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text unique,
  full_name text,
  is_public boolean not null default false,
  username_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: unique index on lower(username) to enforce case-insensitive uniqueness
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'profiles_username_lower_unique'
  ) then
    execute 'create unique index profiles_username_lower_unique on public.profiles (lower(username))';
  end if;
end $$;

-- Keep profiles.email in sync with auth.users.email via triggers
-- Helper: reserved usernames
create or replace function public.is_reserved_username(name text)
returns boolean as $$
begin
  if name is null then return false; end if;
  return lower(name) in (
    'me','auth','login','signup','settings','u','app','admin'
  );
end;
$$ language plpgsql immutable set search_path = public;

-- Helper: verified email check (SECURITY DEFINER to safely read auth.users)
create or replace function public.is_email_verified(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(u.email_confirmed_at is not null, false)
  from auth.users u
  where u.id = uid
$$;

revoke all on function public.is_email_verified(uuid) from public;
grant execute on function public.is_email_verified(uuid) to authenticated;

-- Helper: generate random username (ensures not reserved and unique)
create or replace function public.generate_random_username()
returns text as $$
declare
  adjs text[] := array['swift','brave','clever','calm','bright','bold','eager','keen'];
  nouns text[] := array['coder','algo','byte','stack','graph','tree','array','heap'];
  candidate text;
  tries int := 0;
begin
  loop
    tries := tries + 1;
    candidate := lower(
      adjs[1 + floor(random()*array_length(adjs,1))::int] || '-' ||
      nouns[1 + floor(random()*array_length(nouns,1))::int] || '-' ||
      lpad((floor(random()*999))::int::text, 2, '0')
    );
    if not public.is_reserved_username(candidate)
       and not exists (select 1 from public.profiles p where lower(p.username) = lower(candidate)) then
      return candidate;
    end if;
    if tries > 25 then
      -- fallback to uuid slice
      candidate := lower(replace(gen_random_uuid()::text,'-',''));
      return left(candidate, 12);
    end if;
  end loop;
end;
$$ language plpgsql volatile set search_path = public;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, public.generate_random_username())
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.handle_user_email_update()
returns trigger as $$
begin
  update public.profiles
  set email = new.email,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- Username format constraint (lowercase letters, digits, dash, underscore; 3-30 chars)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format_chk'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_chk
      check (
        username is null or lower(username) ~ '^[a-z0-9_-]{3,30}$'
      );
  end if;
end $$;

-- Speed up public lookups
create index if not exists idx_profiles_is_public on public.profiles(is_public);

-- Username aliases keep old handles for redirects
create table if not exists public.username_aliases (
  user_id uuid not null references public.profiles(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, username)
);

do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='username_aliases_username_lower_unique'
  ) then
    execute 'create unique index username_aliases_username_lower_unique on public.username_aliases (lower(username))';
  end if;
end $$;

alter table public.username_aliases enable row level security;

-- Owner access
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='username_aliases' and policyname='username_aliases rw'
  ) then
    create policy "username_aliases rw" on public.username_aliases
    for all using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
  end if;
end $$;

-- Public read for aliases when profile is public
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='username_aliases' and policyname='username_aliases public read'
  ) then
    create policy "username_aliases public read" on public.username_aliases
    for select using ( exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true) );
  end if;
end $$;

-- User metrics (xp, streak, last_active)
create table if not exists public.user_metrics (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp integer not null default 0,
  streak integer not null default 0,
  last_active date,
  updated_at timestamptz not null default now()
);

do $$
begin
  create type topic_status as enum ('pending','in-progress','complete','skipped');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.topics_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id text not null,
  week integer not null,
  status topic_status not null default 'pending',
  last_touched date,
  xp_in_progress boolean not null default false,
  xp_complete boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

-- Per-topic daily notes (one row per day per topic)
create table if not exists public.topic_daily_notes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id text not null,
  day date not null,
  note text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id, day)
);

-- tasks table removed

-- Performance indexes for normalized access patterns
create index if not exists idx_topics_progress_user on public.topics_progress(user_id);
create index if not exists idx_topics_progress_user_week on public.topics_progress(user_id, week);
create index if not exists idx_topics_progress_user_status on public.topics_progress(user_id, status);
create index if not exists idx_topic_daily_notes_user_day on public.topic_daily_notes(user_id, day);
-- tasks index removed

-- Activity log (days user was active)
create table if not exists public.activity_log (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_metrics enable row level security;
alter table public.topics_progress enable row level security;
alter table public.topic_daily_notes enable row level security;
-- tasks RLS not applicable (table removed)
alter table public.activity_log enable row level security;

-- Policies: owners can read/write their rows (avoid per-row re-evaluation of auth.uid())
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles self select'
  ) then
  execute 'alter policy "profiles self select" on public.profiles using ( id = (select auth.uid()) )';
  else
    create policy "profiles self select" on public.profiles
    for select using ( id = (select auth.uid()) );
  end if;
end $$;

-- Public read-only access to profiles when is_public is true
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles public read'
  ) then
  execute 'alter policy "profiles public read" on public.profiles using ( is_public = true )';
  else
    create policy "profiles public read" on public.profiles
    for select using ( is_public = true );
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles self upsert'
  ) then
  execute 'alter policy "profiles self upsert" on public.profiles with check ( id = (select auth.uid()) )';
  else
    create policy "profiles self upsert" on public.profiles
    for insert with check ( id = (select auth.uid()) );
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles self update'
  ) then
  execute 'alter policy "profiles self update" on public.profiles using ( id = (select auth.uid()) )';
  else
    create policy "profiles self update" on public.profiles
    for update using ( id = (select auth.uid()) );
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_metrics' and policyname='metrics rw'
  ) then
  execute 'alter policy "metrics rw" on public.user_metrics using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) )';
  else
    create policy "metrics rw" on public.user_metrics
    for all using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
  end if;
end $$;

-- Public read for metrics where the owning profile is public
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_metrics' and policyname='metrics public read'
  ) then
  execute 'alter policy "metrics public read" on public.user_metrics using ( exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true) )';
  else
    create policy "metrics public read" on public.user_metrics
    for select using ( exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true) );
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='topics_progress' and policyname='topics_progress rw'
  ) then
  execute 'alter policy "topics_progress rw" on public.topics_progress using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) )';
  else
    create policy "topics_progress rw" on public.topics_progress
    for all using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
  end if;
end $$;

-- Public read for topics where the owning profile is public
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='topics_progress' and policyname='topics_progress public read'
  ) then
  execute 'alter policy "topics_progress public read" on public.topics_progress using ( exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true) )';
  else
    create policy "topics_progress public read" on public.topics_progress
    for select using ( exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true) );
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='topic_daily_notes' and policyname='topic_notes rw'
  ) then
  execute 'alter policy "topic_notes rw" on public.topic_daily_notes using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) )';
  else
    create policy "topic_notes rw" on public.topic_daily_notes
    for all using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
  end if;
end $$;

-- Optional: public read for notes if you want to show them on public profile (disabled by default)
-- Uncomment to allow public read of notes
-- do $$
-- begin
--   if exists (
--     select 1 from pg_policies where schemaname='public' and tablename='topic_daily_notes' and policyname='topic_notes public read'
--   ) then
--   execute 'alter policy "topic_notes public read" on public.topic_daily_notes using ( exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true) )';
--   else
--     create policy "topic_notes public read" on public.topic_daily_notes
--     for select using ( exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true) );
--   end if;
-- end $$;

-- tasks policy removed

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='activity_log' and policyname='activity rw'
  ) then
  execute 'alter policy "activity rw" on public.activity_log using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) )';
  else
    create policy "activity rw" on public.activity_log
    for all using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
  end if;
end $$;

-- Public read for activity days when profile is public
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='activity_log' and policyname='activity public read'
  ) then
  execute 'alter policy "activity public read" on public.activity_log using ( exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true) )';
  else
    create policy "activity public read" on public.activity_log
    for select using ( exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true) );
  end if;
end $$;

-- Optional helper to keep updated_at current
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Enforce username rules (reserved names, cooldown, and track change time)
create or replace function public.enforce_username_rules()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.username is not null and public.is_reserved_username(new.username) then
      raise exception 'Reserved username';
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.username is distinct from old.username then
      -- store old username as an alias for redirects
      if old.username is not null then
        begin
          insert into public.username_aliases(user_id, username)
          values (old.id, old.username)
          on conflict do nothing;
        exception when others then null;
        end;
      end if;
      if new.username is null then
        -- allow clearing (though app does not use it), do not set changed_at
        return new;
      end if;
      if public.is_reserved_username(new.username) then
        raise exception 'Reserved username';
      end if;
      -- enforce 7 day cooldown between username changes
      if old.username_changed_at is not null and (now() - old.username_changed_at) < interval '7 days' then
        raise exception 'Username can only be changed once every 7 days';
      end if;
      new.username_changed_at := now();
    end if;
    -- Only allow enabling public if email is verified
    if new.is_public = true and (old.is_public is distinct from true) then
      if not public.is_email_verified(new.id) then
        raise exception 'Verify your email before enabling public profile';
      end if;
    end if;
    return new;
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists trg_enforce_username_rules on public.profiles;
create trigger trg_enforce_username_rules
before insert or update on public.profiles
for each row execute function public.enforce_username_rules();

do $$ begin
  perform 1;
  exception when others then null;
end $$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
for each row execute function public.set_updated_at();

-- Backfill: assign usernames to existing profiles missing a username
do $$
begin
  update public.profiles p
  set username = public.generate_random_username()
  where p.username is null;
exception when others then null;
end $$;

drop trigger if exists set_updated_at_user_metrics on public.user_metrics;
create trigger set_updated_at_user_metrics before update on public.user_metrics
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_topics_progress on public.topics_progress;
create trigger set_updated_at_topics_progress before update on public.topics_progress   
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_topic_daily_notes on public.topic_daily_notes;
create trigger set_updated_at_topic_daily_notes before update on public.topic_daily_notes
for each row execute function public.set_updated_at();

-- tasks trigger removed

drop trigger if exists set_updated_at_activity_log on public.activity_log;
create trigger set_updated_at_activity_log before update on public.activity_log
for each row execute function public.set_updated_at();

-- Migrate legacy JSON tables if present and revoke access to stop expensive anon writes
-- legacy tasks table migration not applicable

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'progress' and column_name = 'payload'
  ) then
    alter table public.progress rename to progress_legacy;
  end if;
end $$;

-- Revoke access from legacy tables if they exist (prevents costly anon upserts)
-- legacy tasks revokes removed

do $$
begin
  if to_regclass('public.progress_legacy') is not null then
    revoke all on table public.progress_legacy from public;
    begin
      execute 'revoke all on table public.progress_legacy from anon';
    exception when undefined_object then null;
    end;
    begin
      execute 'revoke all on table public.progress_legacy from authenticated';
    exception when undefined_object then null;
    end;
  end if;
end $$;

-- ==========================
-- Subscriptions & Payments
-- ==========================

-- Plan types and subscription status enums
do $$
begin
  create type plan_type as enum (
    'weekly','monthly','quarterly','semiannual','yearly','biennial','lifetime'
  );
exception when duplicate_object then null;
end;$$;

do $$
begin
  create type subscription_status as enum (
    'pending','active','canceled','expired','failed'
  );
exception when duplicate_object then null;
end;$$;

do $$
begin
  create type payment_status as enum ('created','pending','success','failed');
exception when duplicate_object then null;
end;$$;

-- Main subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan plan_type not null,
  plan_label text, -- e.g., pro_weekly
  start_date timestamptz not null default now(),
  end_date timestamptz,
  grace_days integer not null default 2,
  status subscription_status not null default 'pending',
  -- Razorpay mapping
  razorpay_subscription_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_state payment_status not null default 'created',
  currency text default 'INR',
  amount_paise integer, -- latest cycle amount for reference
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_dates on public.subscriptions(user_id, end_date);

-- Payments history table
create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_paise integer not null,
  currency text not null default 'INR',
  status payment_status not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_sub_payments_user on public.subscription_payments(user_id);
create index if not exists idx_sub_payments_sub on public.subscription_payments(subscription_id);

alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

-- Owner policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and policyname='subscriptions rw'
  ) then
    create policy "subscriptions rw" on public.subscriptions
    for all using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='subscription_payments' and policyname='sub_payments rw'
  ) then
    create policy "sub_payments rw" on public.subscription_payments
    for all using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
  end if;
end $$;

-- updated_at trigger for subscriptions
drop trigger if exists set_updated_at_subscriptions on public.subscriptions;
create trigger set_updated_at_subscriptions before update on public.subscriptions
for each row execute function public.set_updated_at();

-- Helper: compute if subscription is active including grace period
create or replace function public.subscription_is_active(s public.subscriptions)
returns boolean as $$
begin
  if s.plan = 'lifetime' and s.status = 'active' then
    return true;
  end if;
  if s.status <> 'active' then
    -- allow pending if within start/end? keep strict
    null;
  end if;
  if s.end_date is null then
    return s.status = 'active';
  end if;
  return (
    now() <= s.end_date
    or now() <= (s.end_date + make_interval(days => greatest(s.grace_days, 0)))
  ) and s.status = 'active';
end;
$$ language plpgsql immutable set search_path = public;

-- View: active subscription per user (latest first)
create or replace view public.v_active_subscriptions as
select distinct on (user_id)
  s.*,
  public.subscription_is_active(s) as is_active,
  (case when s.end_date is not null then s.end_date + make_interval(days => greatest(s.grace_days,0)) end) as grace_until
from public.subscriptions s
order by user_id, coalesce(s.end_date, s.created_at) desc, s.created_at desc;

-- SECURITY: ensure the active subscriptions view is not exposed to anon/public roles.
-- Allow only authenticated users (and other privileged roles) to select from this view.
do $$
begin
  -- revoke broadly from public and anon (if present) and grant to authenticated
  begin
    revoke all on public.v_active_subscriptions from public;
  exception when others then null;
  end;
  begin
    revoke all on public.v_active_subscriptions from anon;
  exception when others then null;
  end;
  begin
    grant select on public.v_active_subscriptions to authenticated;
  exception when others then null;
  end;
end $$;

-- Helper: check pro status quickly
create or replace function public.is_pro(uid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(v.is_active, false)
  from public.v_active_subscriptions v
  where v.user_id = uid
  limit 1
$$;

revoke all on function public.is_pro(uuid) from public;
grant execute on function public.is_pro(uuid) to authenticated;