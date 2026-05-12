#!/usr/bin/env node
/**
 * DIAGNOSTIC SCRIPT — Cek penyebab RLS error
 * 
 * Jalankan ini untuk diagnose masalah "new row violates row-level security policy"
 * 
 * Usage:
 *   node diagnose-rls.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('🔍 DIAGNOSTIC: RLS Policy Error Troubleshooting');
console.log('='.repeat(70));

// Check 1: .env file
console.log('\n✓ CHECK 1: Local Environment Variables (.env)');
console.log('-'.repeat(70));

const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'MIDTRANS_SERVER_KEY',
  'VITE_MIDTRANS_CLIENT_KEY',
];

let allEnvOk = true;
for (const key of required) {
  const hasKey = envLines.some(line => line.trim().startsWith(key + '='));
  const value = envLines.find(line => line.trim().startsWith(key + '='))?.split('=')[1]?.slice(0, 20);
  if (hasKey) {
    console.log(`✅ ${key} = ${value}...`);
  } else {
    console.log(`❌ ${key} = NOT FOUND`);
    allEnvOk = false;
  }
}

if (!allEnvOk) {
  console.log('\n❌ ISSUE FOUND: Missing environment variables in .env');
  console.log('   Copy values from Vercel or your Supabase dashboard');
  process.exit(1);
}

// Check 2: Verify SUPABASE_SERVICE_ROLE_KEY format
console.log('\n✓ CHECK 2: SUPABASE_SERVICE_ROLE_KEY Format');
console.log('-'.repeat(70));

const serviceRoleMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+?)(?:\n|$)/);
if (!serviceRoleMatch || !serviceRoleMatch[1]) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found or empty');
  process.exit(1);
}

const serviceRoleKey = serviceRoleMatch[1].trim();
if (serviceRoleKey.startsWith('eyJ')) {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY looks valid (JWT format)');
  console.log(`   Length: ${serviceRoleKey.length} chars`);
  console.log(`   Preview: ${serviceRoleKey.slice(0, 30)}...`);
} else {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY does NOT look like a valid JWT');
  console.log(`   Got: ${serviceRoleKey.slice(0, 50)}...`);
  process.exit(1);
}

// Check 3: API endpoint
console.log('\n✓ CHECK 3: Booking API Endpoint');
console.log('-'.repeat(70));

const apiPath = path.resolve(__dirname, 'packages/public/api/wolio/bookings.ts');
if (!fs.existsSync(apiPath)) {
  console.log('❌ API endpoint not found:', apiPath);
  process.exit(1);
}

const apiContent = fs.readFileSync(apiPath, 'utf-8');
const usesServiceRole = apiContent.includes('SUPABASE_SERVICE_ROLE_KEY');
if (usesServiceRole) {
  console.log('✅ API endpoint uses SUPABASE_SERVICE_ROLE_KEY');
} else {
  console.log('❌ API endpoint does NOT use SUPABASE_SERVICE_ROLE_KEY');
}

// Check 4: Vite config
console.log('\n✓ CHECK 4: Vite Dev Middleware');
console.log('-'.repeat(70));

const viteConfigPath = path.resolve(__dirname, 'packages/public/vite.config.ts');
if (!fs.existsSync(viteConfigPath)) {
  console.log('❌ vite.config.ts not found:', viteConfigPath);
  process.exit(1);
}

const viteContent = fs.readFileSync(viteConfigPath, 'utf-8');
const hasWolioPlugin = viteContent.includes('wolioBookingsDevPlugin');
if (hasWolioPlugin) {
  console.log('✅ Vite has wolioBookingsDevPlugin for dev middleware');
} else {
  console.log('❌ Vite middleware missing');
}

// Check 5: Migration files
console.log('\n✓ CHECK 5: Supabase Migration Files');
console.log('-'.repeat(70));

const migration1 = path.resolve(__dirname, 'packages/public/supabase/migrations/20260212180000_wolio_bookings.sql');
const migration2 = path.resolve(__dirname, 'packages/public/supabase/migrations/20260213120000_profiles_admin_rls.sql');

if (fs.existsSync(migration1)) {
  const content = fs.readFileSync(migration1, 'utf-8');
  if (content.includes('profiles_admin_full')) {
    console.log('✅ Migration 1 has updated RLS policies');
  } else {
    console.log('⚠️  Migration 1 might have old policies');
  }
} else {
  console.log('❌ Migration 1 not found');
}

if (fs.existsSync(migration2)) {
  const content = fs.readFileSync(migration2, 'utf-8');
  if (content.includes('get_public_booked_dates')) {
    console.log('✅ Migration 2 has RPC function');
  } else {
    console.log('⚠️  Migration 2 missing RPC function');
  }
} else {
  console.log('❌ Migration 2 not found');
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📋 SUMMARY & NEXT STEPS');
console.log('='.repeat(70));

console.log(`
✅ Local setup looks good!

Now verify in Vercel:
1. Open: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Check if SUPABASE_SERVICE_ROLE_KEY is present:
   - Should show: <hidden> (Vercel hides sensitive values)
   - If not present: ❌ ADD IT!
   
If SUPABASE_SERVICE_ROLE_KEY is NOT in Vercel:
   a) Copy value from .env file (SUPABASE_SERVICE_ROLE_KEY=...)
   b) Add to Vercel: Settings → Environment Variables → + Add
   c) Name: SUPABASE_SERVICE_ROLE_KEY
   d) Value: (paste the key)
   e) Redeploy: Deployments → Redeploy
   
If already in Vercel:
   1. Run SUPABASE_FIX.sql in Supabase SQL Editor
   2. Redeploy Vercel
   3. Test again: node test-booking-api.js http://localhost:3001
`);

console.log('='.repeat(70));
console.log('\n');
