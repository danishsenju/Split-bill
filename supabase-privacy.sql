-- ============================================================
-- kolekduit / BayarLah — Privacy & Security fields
-- Run this in the Supabase SQL editor.
-- ============================================================

-- Visibility toggles: let a user hide their phone / email from other users.
alter table public.profiles
  add column if not exists hide_phone boolean not null default false,
  add column if not exists hide_email boolean not null default false;

-- ------------------------------------------------------------
-- Make sure a user can update their OWN profile (needed for the
-- privacy/security editor). Safe to re-run.
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
