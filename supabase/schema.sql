-- ===========================================================
-- The JK Espresso Tracker — Supabase schema
-- Run this once in your Supabase project's SQL Editor
-- (Project → SQL Editor → New query → paste this whole file → Run).
-- ===========================================================

create extension if not exists pgcrypto;

-- ---------- Beans ----------

create table if not exists public.beans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  roaster text,
  roast_type text,
  source text,
  process text,
  price text,
  history text,
  notes text,
  date_added date default current_date,
  created_at timestamptz not null default now()
);

alter table public.beans enable row level security;

create policy "beans_select_own" on public.beans
  for select using (auth.uid() = user_id);
create policy "beans_insert_own" on public.beans
  for insert with check (auth.uid() = user_id);
create policy "beans_update_own" on public.beans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "beans_delete_own" on public.beans
  for delete using (auth.uid() = user_id);

-- ---------- Brews ----------

create table if not exists public.brews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bean_id uuid references public.beans(id) on delete set null,
  bean_name text,
  machine_type text,
  grinder_type text,
  grind_size text,
  tools_used text,
  brew_date date,
  brew_time_of_day time,
  dose_weight numeric,
  yield_weight numeric,
  brew_time_seconds numeric,
  water_temp numeric,
  rating smallint check (rating between 0 and 5),
  feedback text,
  issue_tags text[],
  recommendation text,
  photo_shot_path text,
  photo_puck_path text,
  photo_packaging_path text,
  created_at timestamptz not null default now()
);

-- Safe to re-run: adds the issue_tags column if this table already existed
-- from an earlier version of this schema (e.g. the "what went wrong?"
-- feedback tags added later — bitter, sour, weak, etc.).
alter table public.brews add column if not exists issue_tags text[];

alter table public.brews enable row level security;

create policy "brews_select_own" on public.brews
  for select using (auth.uid() = user_id);
create policy "brews_insert_own" on public.brews
  for insert with check (auth.uid() = user_id);
create policy "brews_update_own" on public.brews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "brews_delete_own" on public.brews
  for delete using (auth.uid() = user_id);

-- ---------- Custom recipes (starter recipes ship in the app itself) ----------

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  style text,
  ratio text,
  dose text,
  time text,
  instructions text,
  tags text[],
  created_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

create policy "recipes_select_own" on public.recipes
  for select using (auth.uid() = user_id);
create policy "recipes_insert_own" on public.recipes
  for insert with check (auth.uid() = user_id);
create policy "recipes_update_own" on public.recipes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes_delete_own" on public.recipes
  for delete using (auth.uid() = user_id);

-- ---------- Storage bucket for brew photos ----------
-- Private bucket; files are stored under a path prefixed with the owner's
-- user id (e.g. "<user_id>/<brew_id>/shot.jpg") and the policies below only
-- allow a user to read/write objects under their own prefix.

insert into storage.buckets (id, name, public)
values ('brew-photos', 'brew-photos', false)
on conflict (id) do nothing;

create policy "brew_photos_select_own" on storage.objects
  for select using (
    bucket_id = 'brew-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "brew_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'brew-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "brew_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'brew-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "brew_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'brew-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
