#!/usr/bin/env node
/*
  Create a testing user in Supabase using the Admin API.
  Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables.

  Usage examples:
    node scripts/create-test-user.js 
    node scripts/create-test-user.js --email tester@example.com --password Test1234! --name "Test Bruker" --phone +4799999999
*/

const { createClient } = require('@supabase/supabase-js');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      out[key] = value;
    }
  }
  return out;
}

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\nAdd them to a .env file or export them in your shell.');
    process.exit(1);
  }

  const opts = parseArgs();
  const email = opts.email || 'tester@example.com';
  const password = opts.password || 'Test1234!';
  const name = opts.name || 'Test Bruker';
  const phone = opts.phone || '';

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log(`Creating user: ${email}`);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      phone,
      provider: 'password',
    },
  });

  if (error) {
    console.error('Failed to create user:', error);
    process.exit(1);
  }

  console.log('User created:');
  console.log({ id: data.user.id, email: data.user.email });
  console.log('\nYou can now log in with these credentials in the app.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
