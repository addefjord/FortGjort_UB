# Supabase Migrations via GitHub Actions

This project uses GitHub Actions to automatically apply Supabase database migrations on push to `main`.

## Setup

### 1. Get Connection Details from Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/uxvynhtpkesaldbgkslz)
2. Navigate to **Settings → Database → Connection Pooling**
3. Note the following values:
   - **Host**: `aws-1-eu-north-1.pooler.supabase.com` (or your region's pooler)
   - **User**: `postgres.uxvynhtpkesaldbgkslz` (format: `postgres.<project-ref>`)
   - **Password**: Your database password
   - **Database**: `postgres`

### 2. Add GitHub Secrets

1. Go to your GitHub repository → **Settings → Secrets and variables → Actions**
2. Click **New repository secret** and add:

| Secret Name | Value | Example |
|------------|-------|---------|
| `SUPABASE_POOLER_HOST` | Connection pooler host | `aws-1-eu-north-1.pooler.supabase.com` |
| `SUPABASE_POOLER_USER` | Postgres user with project ref | `postgres.uxvynhtpkesaldbgkslz` |
| `SUPABASE_DB_PASSWORD` | Your database password | `jepfaj-wibjAp-3socpu` |
| `SUPABASE_DB_NAME` | Database name | `postgres` |

### 3. How It Works

- Any push to `main` that changes files in `supabase/migrations/` triggers the workflow
- The workflow installs `psql` and applies all `.sql` files in `supabase/migrations/` in alphabetical order
- Uses the connection pooler (IPv4) to avoid local networking issues
- Fails fast on any SQL error (`ON_ERROR_STOP=1`)

### 4. Manual Trigger

You can also run migrations manually:
1. Go to **Actions** tab in GitHub
2. Select **Supabase DB Migrations** workflow
3. Click **Run workflow** → **Run workflow**

## Migration Files

Current migrations:
- `20251128_fix_messages_rls.sql` - Relaxed insert policy and added delete policy
- `20251128000002_optimize_rls_performance.sql` - Optimizes RLS policies to fix Supabase linter warnings

## Local Alternative

If you need to apply migrations locally without the Free plan IPv4 limitation:

1. Use the **Supabase Dashboard SQL Editor**:
   - Go to SQL Editor in your project dashboard
   - Paste the contents of the migration file
   - Click **Run**

2. Or upgrade your Supabase plan to enable dedicated IPv4 for direct CLI access

## Troubleshooting

- **Workflow fails with connection error**: Check that secrets are set correctly
- **Migration fails**: Check the SQL syntax and run it manually in the dashboard first
- **Duplicate policy errors**: Normal if re-running; policies use `drop policy if exists`
