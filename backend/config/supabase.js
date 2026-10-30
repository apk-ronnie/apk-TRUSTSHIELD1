const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables (from .env or .env.supabase)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env.supabase') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isPlaceholder = (val) =>
  !val ||
  val.includes('your-project-id') ||
  val.includes('your_supabase_') ||
  val.trim() === '';

const isConfigured = !isPlaceholder(supabaseUrl) && (!isPlaceholder(supabaseServiceRoleKey) || !isPlaceholder(supabaseAnonKey));

// 1. Standard Client (using Anon Key)
let supabase = null;
if (!isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// 2. Admin Client (using Service Role Key for server-side database bypass & RLS administration)
let supabaseAdmin = null;
if (!isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseServiceRoleKey)) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else if (supabase) {
  // Fall back to anon client if service role key is not yet set
  supabaseAdmin = supabase;
}

if (isConfigured) {
  console.log(`[Supabase] Cloud database initialized for: ${supabaseUrl}`);
} else {
  console.log(`[Supabase Info] Supabase credentials not yet configured. Fill in .env.supabase or .env with your keys.`);
}

module.exports = {
  supabase,
  supabaseAdmin,
  isConfigured,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey
};
