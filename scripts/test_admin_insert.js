import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Load env vars from project root
dotenv.config({ path: resolve(rootDir, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

const testAdmin = {
  email: 'h@gmail.com',
  password: 'MTIz',  // base64('123')
  name: 'Himanshu',
  role: 'admin',
  status: 'active'
};

async function main() {
  try {
    // First try a read-only check
    console.log('\nChecking current admins...');
    const { data: before, error: readError } = await supabase
      .from('admins')
      .select('*');

    if (readError) {
      console.error('Error reading admins:', readError);
      return;
    }

    console.log('Current admins:', before.map(a => ({ 
      ...a, 
      password: '[MASKED]'
    })));

    // Try to insert our test admin
    console.log('\nInserting test admin:', testAdmin.email);
    const { data: inserted, error: insertError } = await supabase
      .from('admins')
      .upsert(testAdmin)
      .select();

    if (insertError) {
      console.error('Error inserting admin:', insertError);
      return;
    }

    console.log('Insert result:', inserted.map(a => ({ 
      ...a, 
      password: '[MASKED]'
    })));

    // Verify it exists
    console.log('\nVerifying admin exists...');
    const { data: found, error: verifyError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', testAdmin.email)
      .maybeSingle();

    if (verifyError) {
      console.error('Error verifying admin:', verifyError);
      return;
    }

    if (found) {
      console.log('Found admin:', {
        ...found,
        password: '[MASKED]'
      });
      console.log('\nSuccess! You should now be able to log in with:');
      console.log('Email:', testAdmin.email);
      console.log('Password: 123');
    } else {
      console.log('Admin not found after insert!');
    }

  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

main();