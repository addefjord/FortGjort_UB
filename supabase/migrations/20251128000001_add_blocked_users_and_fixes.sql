-- Add blocked_users table and fix security issues
-- Run this migration to address critical schema gaps

-- ----------
-- Blocked Users Table
-- ----------
create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);

create index if not exists blocked_users_blocker_idx on public.blocked_users(blocker_id);
create index if not exists blocked_users_blocked_idx on public.blocked_users(blocked_id);

-- Enable RLS
alter table public.blocked_users enable row level security;

-- Blocked users policies: users can see their own blocks
drop policy if exists blocked_users_select_own on public.blocked_users;
create policy blocked_users_select_own on public.blocked_users
  for select using (blocker_id = auth.uid());

drop policy if exists blocked_users_insert_own on public.blocked_users;
create policy blocked_users_insert_own on public.blocked_users
  for insert with check (blocker_id = auth.uid());

drop policy if exists blocked_users_delete_own on public.blocked_users;
create policy blocked_users_delete_own on public.blocked_users
  for delete using (blocker_id = auth.uid());

-- ----------
-- Improve Messages RLS Security
-- ----------
-- Tighten insert policy: verify sender_id matches auth user and not blocked
drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert with check (
    sender_id = auth.uid() 
    and auth.uid() IS NOT NULL
    and not exists (
      select 1 from public.blocked_users
      where (blocker_id = sender_id and blocked_id = receiver_id)
         or (blocker_id = receiver_id and blocked_id = sender_id)
    )
  );

-- Improve select policy to exclude blocked conversations
drop policy if exists messages_select_involved on public.messages;
create policy messages_select_involved on public.messages
  for select using (
    (sender_id = auth.uid() or receiver_id = auth.uid())
    and not exists (
      select 1 from public.blocked_users
      where (blocker_id = sender_id and blocked_id = receiver_id)
         or (blocker_id = receiver_id and blocked_id = sender_id)
    )
  );

-- ----------
-- Add Missing Indexes for Performance
-- ----------
-- Composite index for chat thread queries (sender + receiver + time)
create index if not exists messages_thread_idx on public.messages(sender_id, receiver_id, created_at desc);
create index if not exists messages_thread_reverse_idx on public.messages(receiver_id, sender_id, created_at desc);

-- Index for unread message counts
create index if not exists messages_unread_idx on public.messages(receiver_id, read) where read = false;

-- ----------
-- Enable Realtime for Messages and Blocked Users
-- ----------
-- Note: Realtime respects RLS policies automatically in Supabase
-- Just ensure tables are published (done by default for user tables)
