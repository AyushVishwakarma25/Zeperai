import { createClient } from '@supabase/supabase-js';

// Sanitize potential string-literal "undefined" from build defines
const getEnv = (key: string, fallback: string): string => {
    const val = process.env[key];
    if (!val || val === 'undefined' || val === 'null' || val === '') return fallback;
    return val;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://gaekuvdnewzzwckmlntc.supabase.co');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZWt1dmRuZXd6endja21sbnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjA3MTYsImV4cCI6MjA4MTM5NjcxNn0.VIczknJhGRu3d4rTCKKHBeN56ykzw_Xgg4sTUF_x0J4');

export const supabase = createClient(supabaseUrl, supabaseKey);