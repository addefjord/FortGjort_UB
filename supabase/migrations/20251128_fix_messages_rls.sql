-- Fix messages RLS policy to allow authenticated users to send messages
-- Run this in your Supabase SQL Editor

-- Temporarily relax the insert policy to allow any authenticated user
drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert with check (auth.uid() IS NOT NULL);

-- Add delete policy if missing
drop policy if exists messages_delete_sender on public.messages;
create policy messages_delete_sender on public.messages
  for delete using (sender_id = auth.uid());
