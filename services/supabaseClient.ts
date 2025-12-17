
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gaekuvdnewzzwckmlntc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZWt1dmRuZXd6endja21sbnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjA3MTYsImV4cCI6MjA4MTM5NjcxNn0.VIczknJhGRu3d4rTCKKHBeN56ykzw_Xgg4sTUF_x0J4';

export const supabase = createClient(supabaseUrl, supabaseKey);
