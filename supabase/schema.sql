-- Supabase schema for FortGjort
-- Run this in your Supabase project's SQL editor

-- Extensions (gen_random_uuid)
create extension if not exists pgcrypto;

-- ----------
-- Profiles
-- ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  phone text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------
-- Jobs
-- ----------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  category text not null,
  location text,
  price integer not null,
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  completion_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists jobs_created_by_idx on public.jobs(created_by);
create index if not exists jobs_assigned_to_idx on public.jobs(assigned_to);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_category_idx on public.jobs(category);
create index if not exists jobs_location_idx on public.jobs(location);
create index if not exists jobs_created_at_desc_idx on public.jobs(created_at desc);

-- ----------
-- Bids
-- ----------
create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bids_job_id_idx on public.bids(job_id);
create index if not exists bids_bidder_id_idx on public.bids(bidder_id);

-- ----------
-- Messages
-- ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  image_url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_receiver_id_idx on public.messages(receiver_id);
create index if not exists messages_created_at_desc_idx on public.messages(created_at desc);

-- ----------
-- Payments (minimal to satisfy code)
-- ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending','released','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_job_id_idx on public.payments(job_id);

-- ----------
-- Withdrawals (minimal to satisfy code)
-- ----------
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists withdrawals_user_id_idx on public.withdrawals(user_id);

-- ----------
-- Updated-at trigger for tables with updated_at
-- ----------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach triggers
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

drop trigger if exists set_bids_updated_at on public.bids;
create trigger set_bids_updated_at
  before update on public.bids
  for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

drop trigger if exists set_withdrawals_updated_at on public.withdrawals;
create trigger set_withdrawals_updated_at
  before update on public.withdrawals
  for each row execute function public.set_updated_at();

-- ----------
-- Row Level Security
-- ----------
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.bids enable row level security;
alter table public.messages enable row level security;
alter table public.payments enable row level security;
alter table public.withdrawals enable row level security;

-- Profiles policies
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- Jobs policies
drop policy if exists jobs_select_all on public.jobs;
create policy jobs_select_all on public.jobs
  for select using (true);

drop policy if exists jobs_insert_owner on public.jobs;
create policy jobs_insert_owner on public.jobs
  for insert with check (created_by = auth.uid());

drop policy if exists jobs_update_owner_or_assignee on public.jobs;
create policy jobs_update_owner_or_assignee on public.jobs
  for update using (created_by = auth.uid() or assigned_to = auth.uid());

-- Bids policies
drop policy if exists bids_select_all on public.bids;
create policy bids_select_all on public.bids
  for select using (true);

drop policy if exists bids_insert_self on public.bids;
create policy bids_insert_self on public.bids
  for insert with check (bidder_id = auth.uid());

drop policy if exists bids_update_self on public.bids;
create policy bids_update_self on public.bids
  for update using (bidder_id = auth.uid());

-- Messages policies
drop policy if exists messages_select_involved on public.messages;
create policy messages_select_involved on public.messages
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert with check (sender_id = auth.uid());

drop policy if exists messages_update_self on public.messages;
create policy messages_update_self on public.messages
  for update using (sender_id = auth.uid() or receiver_id = auth.uid());

-- Payments policies (per user)
drop policy if exists payments_select_self on public.payments;
create policy payments_select_self on public.payments
  for select using (user_id = auth.uid());

drop policy if exists payments_insert_self on public.payments;
create policy payments_insert_self on public.payments
  for insert with check (user_id = auth.uid());

drop policy if exists payments_update_self on public.payments;
create policy payments_update_self on public.payments
  for update using (user_id = auth.uid());

-- Withdrawals policies (per user)
drop policy if exists withdrawals_select_self on public.withdrawals;
create policy withdrawals_select_self on public.withdrawals
  for select using (user_id = auth.uid());

drop policy if exists withdrawals_insert_self on public.withdrawals;
create policy withdrawals_insert_self on public.withdrawals
  for insert with check (user_id = auth.uid());

drop policy if exists withdrawals_update_self on public.withdrawals;
create policy withdrawals_update_self on public.withdrawals
  for update using (user_id = auth.uid());

-- ----------
-- Auto-create profile when user signs up
-- ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url, phone, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Bruker'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'provider', 'password')
  )
  on conflict (id) do nothing;
  return new; 
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------
-- Seed data: Create profiles for existing users and add sample jobs
-- ----------
-- Create profiles for any existing auth users that don't have one yet
insert into public.profiles (id, name, provider)
select 
  u.id, 
  coalesce(u.raw_user_meta_data->>'name', 'Demo Bruker'),
  coalesce(u.raw_user_meta_data->>'provider', 'password')
from auth.users u
where u.id not in (select id from public.profiles);

-- Add a couple of sample jobs (only if we have at least one profile)
do $$
declare
  v_profile_id uuid;
begin
  -- Get the first profile ID
  select id into v_profile_id from public.profiles limit 1;
  
  if v_profile_id is not null then
    -- Insert sample jobs
    insert into public.jobs (created_by, title, description, category, location, price, status)
    values 
      (v_profile_id, 'Klippe plen', 'Trenger hjelp til plenklipp denne uken. Tar ca 1-2 timer.', 'fagarbeid', 'Stavanger', 500, 'open'),
      (v_profile_id, 'Bære sofa', 'Trenger bærehjelp i 2. etg. ca 30 min. Sofa veier ca 50kg.', 'enkelt', 'Sandnes', 300, 'open'),
      (v_profile_id, 'Male soverom', 'Trenger maler til soverom på 15kvm. Må ta med egen utstyr.', 'fagarbeid', 'Bergen', 1200, 'open');
  end if;
end $$;
