-- ============================================================
-- kolekduit / BayarLah — Chat feature schema
-- Run this in the Supabase SQL editor.
-- ============================================================

-- 1. Messages table -----------------------------------------------------------
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references auth.users(id) on delete cascade,
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  body          text,
  message_type  text not null default 'text'
                check (message_type in ('text', 'bill_share')),
  bill_id       uuid references public.bills(id) on delete set null,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- 2. Indexes ------------------------------------------------------------------
create index if not exists messages_pair_idx
  on public.messages (sender_id, recipient_id, created_at desc);
create index if not exists messages_recipient_idx
  on public.messages (recipient_id, read_at);
create index if not exists messages_created_idx
  on public.messages (created_at desc);

-- 3. Row Level Security -------------------------------------------------------
alter table public.messages enable row level security;

-- Read: either party of the conversation can read the message
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Insert: you may only send as yourself.
-- (Tighten to friends-only by uncommenting the EXISTS clause below.)
drop policy if exists "messages_insert_self" on public.messages;
create policy "messages_insert_self"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    -- and exists (
    --   select 1 from public.friendships f
    --   where f.organizer_id = auth.uid()
    --     and f.friend_user_id = recipient_id
    -- )
  );

-- Update: the recipient can mark a message as read
drop policy if exists "messages_update_read" on public.messages;
create policy "messages_update_read"
  on public.messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- 4. Realtime -----------------------------------------------------------------
-- Enable Realtime so incoming messages stream into the chat without refresh.
alter publication supabase_realtime add table public.messages;
