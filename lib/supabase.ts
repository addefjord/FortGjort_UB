import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import storage from './storage';

const supabaseUrl = 'https://uxvynhtpkesaldbgkslz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4dnluaHRwa2VzYWxkYmdrc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDU4NzIsImV4cCI6MjA3NzMyMTg3Mn0.O5ZD8kvADixrZQ_Z8vi25ch6wblUdJSFpNwB8H1kexg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});