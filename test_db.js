const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(url, key);

async function test() {
  const { data, error } = await client.from('subscriptions').select('*, profiles!inner(email, name)').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}

test();
