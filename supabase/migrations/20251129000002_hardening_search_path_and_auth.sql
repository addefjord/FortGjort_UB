-- Harden function search_path and provide guidance for auth settings.

-- Set immutable search_path for functions to avoid role-based path changes
-- Adjust to your desired schema resolution order
-- Common best practice: restrict to pg_catalog and the explicit schema

-- public.set_updated_at
alter function public.set_updated_at()
  set search_path = pg_catalog, public;

-- public.send_message
alter function public.send_message(uuid, uuid, text, text)
  set search_path = pg_catalog, public;

-- Note: Auth warnings (leaked password protection, MFA options)
-- must be configured in the Supabase Dashboard, not via SQL.
-- See supabase/README.md for steps.
