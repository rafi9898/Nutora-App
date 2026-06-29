const { createClient } = require('@supabase/supabase-js');
const envData = require('fs').readFileSync('.env', 'utf8');
const envVars = {};
envData.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});
const supabase = createClient(envVars['EXPO_PUBLIC_SUPABASE_URL'], envVars['EXPO_PUBLIC_SUPABASE_ANON_KEY']);

async function run() {
  const { data, error } = await supabase.from('off_products').select('barcode, product_name, image_url, calories').not('image_url', 'is', null).limit(5);
  console.log('Error:', error);
  console.log('Products with images:', data);
}
run();
