const { createClient } = require('@supabase/supabase-js');
const envData = require('fs').readFileSync('.env', 'utf8');
const envVars = {};
envData.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});
const supabase = createClient(envVars['EXPO_PUBLIC_SUPABASE_URL'], envVars['EXPO_PUBLIC_SUPABASE_ANON_KEY']);

async function run() {
  const email = `test+${Date.now()}@example.com`;
  console.log('Registering', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: { data: { name: 'Test User' } }
  });
  console.log('Result:', JSON.stringify({ data, error }, null, 2));
}
run();
