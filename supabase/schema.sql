-- Block Fit — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New Query → Run

-- ────────────────────────────────────────────────────────────
-- scores
-- Stores campaign, speedrun, and daily-challenge results.
-- ────────────────────────────────────────────────────────────
create table if not exists scores (
  id             bigserial primary key,
  username       text        not null check (char_length(username) <= 20),
  user_id        text,                                      -- UUID/identifier of guest/authed user
  mode           text        not null check (mode in ('campaign', 'speedrun', 'daily')),
  level_id       integer     not null,
  stars          integer     not null check (stars between 1 and 3),
  moves          integer     not null check (moves >= 0),
  time           integer     not null check (time >= 0),   -- seconds
  challenge_date date,                                      -- only set for mode = 'daily'
  created_at     timestamptz not null default now()
);

-- Fast leaderboard queries
create index if not exists scores_campaign_idx
  on scores (mode, level_id, stars desc, moves asc, time asc)
  where mode = 'campaign';

create index if not exists scores_speedrun_idx
  on scores (mode, level_id, time asc, moves asc)
  where mode = 'speedrun';

create index if not exists scores_daily_idx
  on scores (mode, challenge_date, stars desc, moves asc, time asc)
  where mode = 'daily';

-- Row Level Security: public read, no direct writes (all writes go through
-- the service-role key in serverless functions, which bypasses RLS).
alter table scores enable row level security;

create policy "public read" on scores
  for select using (true);

-- ────────────────────────────────────────────────────────────
-- sync_profiles
-- Temporary cross-device profile sync via a 6-char code.
-- Rows expire after 24 hours (handled by the pg_cron extension
-- or a Supabase scheduled function — see README for setup).
-- ────────────────────────────────────────────────────────────
create table if not exists sync_profiles (
  code        text        primary key check (char_length(code) = 6),
  profile     jsonb       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security: no direct client access — service-role only.
alter table sync_profiles enable row level security;

-- Optional: auto-delete codes older than 24 hours.
-- Requires pg_cron enabled in Supabase Dashboard → Database → Extensions.
-- Uncomment once pg_cron is enabled:
--
-- select cron.schedule(
--   'cleanup-sync-profiles',
--   '0 * * * *',   -- every hour
--   $$delete from sync_profiles where created_at < now() - interval '24 hours'$$
-- );

-- ────────────────────────────────────────────────────────────
-- profiles
-- Stores persistent user profile data (progress, themes, stars, etc.)
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  user_id      text primary key, -- Supabase auth user ID
  email        text not null,
  username     text not null,
  profile_data jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Row Level Security: public read, service-role only writes.
alter table profiles enable row level security;

create policy "public read profiles" on profiles
  for select using (true);
