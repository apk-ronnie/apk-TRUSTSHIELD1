/**
 * TrustShield AI - Supabase Diagnostics & Connection Verification Script
 * Run via: node scripts/setup-supabase.js
 */
const { supabaseAdmin, isConfigured, supabaseUrl } = require('../config/supabase');

async function testSupabase() {
  console.log('=====================================================');
  console.log('🔍 Testing Supabase Connection for TrustShield AI...');
  console.log('=====================================================');
  console.log('Supabase URL:', supabaseUrl || '(not configured)');
  console.log('Configuration Status:', isConfigured ? '✅ Keys Provided' : '❌ Keys Missing');

  if (!isConfigured || !supabaseAdmin) {
    console.log('\n⚠️  Supabase is not configured yet.');
    console.log('Please add your project credentials to backend/.env.supabase or backend/.env:');
    console.log('  SUPABASE_URL=https://your-project-id.supabase.co');
    console.log('  SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    console.log('\nThen execute the SQL in backend/supabase/schema.sql in your Supabase SQL Editor.');
    return;
  }

  try {
    console.log('\n[1/2] Verifying users table in Supabase...');
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .limit(3);

    if (userError) {
      console.error('❌ Failed to query users table:', userError.message);
      if (userError.code === '42P01') {
        console.log('💡 TIP: The table "users" does not exist yet. Please run the SQL migration in backend/supabase/schema.sql in your Supabase SQL editor.');
      }
    } else {
      console.log(`✅ Users table accessible! Found ${users.length} sample records.`);
      users.forEach((u) => console.log(`   - ${u.name} (${u.email}) [${u.role}]`));
    }

    console.log('\n[2/2] Verifying analyses table in Supabase...');
    const { data: analyses, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('id, threat_score, threat_type, created_at')
      .limit(3);

    if (analysisError) {
      console.error('❌ Failed to query analyses table:', analysisError.message);
      if (analysisError.code === '42P01') {
        console.log('💡 TIP: The table "analyses" does not exist yet. Please run the SQL migration in backend/supabase/schema.sql in your Supabase SQL editor.');
      }
    } else {
      console.log(`✅ Analyses table accessible! Found ${analyses.length} sample telemetry records.`);
    }

    console.log('\n🎉 Supabase connection test completed!');
  } catch (err) {
    console.error('Unexpected error during connection test:', err.message);
  }
}

testSupabase();

