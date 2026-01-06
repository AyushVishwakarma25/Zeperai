import { createClient } from '@supabase/supabase-js';

// FIX: Use process.env, which is populated by Vite's `define` config, instead of import.meta.env.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gaekuvdnewzzwckmlntc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZWt1dmRuZXd6endja21sbnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjA3MTYsImV4cCI6MjA4MTM5NjcxNn0.VIczknJhGRu3d4rTCKKHBeN56ykzw_Xgg4sTUF_x0J4';

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is missing. Please check your .env file or environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);