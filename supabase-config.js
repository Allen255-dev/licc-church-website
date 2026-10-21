// ============================================================
// LICC WEBSITE — SUPABASE CONFIG
// ============================================================
// IMPORTANT: Fill in your own project values below.
// Find these in your Supabase Dashboard → Project Settings → API
// ============================================================

const SUPABASE_URL = 'https://zkzpvcbbnxxdarssgjdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprenB2Y2Jibnh4ZGFyc3NnamRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMDIzMjUsImV4cCI6MjA5NzU3ODMyNX0.mUNOUPUMPPq64n-mya0528xEVMrc8DPVg-hjICOwFqs';

// Initialize client (supabase-js is loaded via CDN script tag in each HTML page)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);