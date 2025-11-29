#!/usr/bin/env node
/**
 * Quick test and user creation script for FortGjort
 * This creates a user directly in Supabase and tests the connection
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uxvynhtpkesaldbgkslz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4dnluaHRwa2VzYWxkYmdrc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDU4NzIsImV4cCI6MjA3NzMyMTg3Mn0.O5ZD8kvADixrZQ_Z8vi25ch6wblUdJSFpNwB8H1kexg';

// You need to get this from Supabase Dashboard -> Settings -> API -> service_role key
// DO NOT commit this to git!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createTestUser() {
  if (!SERVICE_ROLE_KEY) {
    console.log('\n⚠️  Missing SUPABASE_SERVICE_ROLE_KEY');
    console.log('Get it from: https://supabase.com/dashboard/project/uxvynhtpkesaldbgkslz/settings/api');
    console.log('Then run: SUPABASE_SERVICE_ROLE_KEY=your-key-here node scripts/create-quick-test-user.js\n');
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const email = 'test@fortgjort.no';
  const password = 'Test1234!';
  const name = 'Test Bruker';

  console.log('🔧 Creating test user...');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}\n`);

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        provider: 'password',
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ User already exists! You can log in with:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}\n`);
        
        // Try to sign in to verify
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.log('❌ But login test failed:', signInError.message);
          console.log('\nPossible issues:');
          console.log('1. Check if email confirmations are required in Supabase Auth settings');
          console.log('2. Verify the password is correct');
          console.log('3. Check if the user is active in Supabase Dashboard -> Authentication -> Users\n');
        } else {
          console.log('✅ Login test successful! User ID:', signInData.user.id);
          console.log('   You can now log in to the app with these credentials.\n');
        }
      } else {
        console.log('❌ Error creating user:', error.message);
      }
      return;
    }

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}\n`);

    // Test login
    console.log('🧪 Testing login...');
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log('❌ Login failed:', signInError.message);
    } else {
      console.log('✅ Login successful!\n');
      console.log('You can now log in to the app with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}\n`);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createTestUser();
