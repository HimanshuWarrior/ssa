import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFromFile(envPath) {
  try {
    const txt = fs.readFileSync(envPath, 'utf8');
    const lines = txt.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch (e) {
    return null;
  }
}

(async () => {
  // Try reading .env in project root
  const envPath = path.resolve(process.cwd(), '.env');
  const env = loadEnvFromFile(envPath) || process.env;

  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Supabase URL or anon key not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env or set SUPABASE_URL/SUPABASE_ANON_KEY in environment.');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const admin = {
    email: 'h@gmail.com',
    password: 'MTIz', // base64('123')
    name: 'Himanshu',
    role: 'admin'
  };

  try {
    console.log('Upserting admin row:', admin.email);
    const { data, error } = await supabase.from('admins').upsert(admin, { onConflict: 'email' }).select();
    if (error) {
      console.error('Upsert error:', error);
      process.exit(1);
    }
    console.log('Upsert result:', data);
    console.log('Now you should be able to login with h@gmail.com / 123 (password).');
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();
