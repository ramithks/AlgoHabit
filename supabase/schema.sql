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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep profiles.email in sync with auth.users.email via triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
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

do $$
begin
  create type task_kind as enum ('learn','review','reinforce','plan');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  kind task_kind not null,
  title text not null,
  topic_id text,
  prereq text,
  done boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_user_date on public.tasks(user_id, date);

-- Performance indexes for normalized access patterns
create index if not exists idx_topics_progress_user on public.topics_progress(user_id);
create index if not exists idx_topics_progress_user_week on public.topics_progress(user_id, week);
create index if not exists idx_topics_progress_user_status on public.topics_progress(user_id, status);
create index if not exists idx_topic_daily_notes_user_day on public.topic_daily_notes(user_id, day);
create index if not exists idx_tasks_user_done on public.tasks(user_id, done);

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
alter table public.tasks enable row level security;
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

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='tasks' and policyname='tasks rw'
  ) then
  execute 'alter policy "tasks rw" on public.tasks using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) )';
  else
    create policy "tasks rw" on public.tasks
    for all using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
  end if;
end $$;

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

-- Optional helper to keep updated_at current
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

do $$ begin
  perform 1;
  exception when others then null;
end $$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_user_metrics on public.user_metrics;
create trigger set_updated_at_user_metrics before update on public.user_metrics
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_topics_progress on public.topics_progress;
create trigger set_updated_at_topics_progress before update on public.topics_progress   
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_topic_daily_notes on public.topic_daily_notes;
create trigger set_updated_at_topic_daily_notes before update on public.topic_daily_notes
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_tasks on public.tasks;
create trigger set_updated_at_tasks before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_activity_log on public.activity_log;
create trigger set_updated_at_activity_log before update on public.activity_log
for each row execute function public.set_updated_at();

-- Migrate legacy JSON tables if present and revoke access to stop expensive anon writes
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'items'
  ) then
    alter table public.tasks rename to tasks_legacy;
  end if;
end $$;

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
do $$
begin
  if to_regclass('public.tasks_legacy') is not null then
    revoke all on table public.tasks_legacy from public;
    do $$ begin
      execute 'revoke all on table public.tasks_legacy from anon';
    exception when undefined_object then null; end $$;
    do $$ begin
      execute 'revoke all on table public.tasks_legacy from authenticated';
    exception when undefined_object then null; end $$;
  end if;
end $$;

do $$
begin
  if to_regclass('public.progress_legacy') is not null then
    revoke all on table public.progress_legacy from public;
    do $$ begin
      execute 'revoke all on table public.progress_legacy from anon';
    exception when undefined_object then null; end $$;
    do $$ begin
      execute 'revoke all on table public.progress_legacy from authenticated';
    exception when undefined_object then null; end $$;
  end if;
end $$;
