-- Optimize RLS policies to avoid per-row re-evaluation of auth functions
-- Fixes Supabase linter warnings: auth_rls_initplan and multiple_permissive_policies
-- Replace auth.uid() with (select auth.uid()) and consolidate duplicate DELETE policies

-- ============================================
-- PROFILES TABLE
-- ============================================
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ============================================
-- JOBS TABLE
-- ============================================
drop policy if exists jobs_insert_owner on public.jobs;
create policy jobs_insert_owner on public.jobs
  for insert to authenticated
  with check ((select auth.uid()) = created_by);

drop policy if exists jobs_update_owner_or_assignee on public.jobs;
create policy jobs_update_owner_or_assignee on public.jobs
  for update to authenticated
  using (((select auth.uid()) = created_by) or ((select auth.uid()) = assigned_to))
  with check (((select auth.uid()) = created_by) or ((select auth.uid()) = assigned_to));

-- ============================================
-- BIDS TABLE
-- ============================================
drop policy if exists bids_insert_self on public.bids;
create policy bids_insert_self on public.bids
  for insert to authenticated
  with check ((select auth.uid()) = bidder_id);

drop policy if exists bids_update_self on public.bids;
create policy bids_update_self on public.bids
  for update to authenticated
  using ((select auth.uid()) = bidder_id)
  with check ((select auth.uid()) = bidder_id);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
drop policy if exists payments_select_self on public.payments;
create policy payments_select_self on public.payments
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists payments_insert_self on public.payments;
create policy payments_insert_self on public.payments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists payments_update_self on public.payments;
create policy payments_update_self on public.payments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================
-- WITHDRAWALS TABLE
-- ============================================
drop policy if exists withdrawals_select_self on public.withdrawals;
create policy withdrawals_select_self on public.withdrawals
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists withdrawals_insert_self on public.withdrawals;
create policy withdrawals_insert_self on public.withdrawals
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists withdrawals_update_self on public.withdrawals;
create policy withdrawals_update_self on public.withdrawals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
-- Consolidate duplicate DELETE policies (messages_delete_self, messages_delete_sender)
-- into a single policy to resolve multiple_permissive_policies warnings
drop policy if exists messages_delete_self on public.messages;
drop policy if exists messages_delete_sender on public.messages;
create policy messages_delete_owner on public.messages
  for delete to authenticated
  using ((select auth.uid()) = sender_id);

-- Optimize INSERT policy with (select auth.uid())
drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert to authenticated
  with check (((select auth.uid()) is not null) and ((select auth.uid()) = sender_id));
