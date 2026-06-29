const { createClient } = require('@supabase/supabase-js');
const envData = require('fs').readFileSync('.env', 'utf8');
const envVars = {};
envData.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});
const supabase = createClient(envVars['EXPO_PUBLIC_SUPABASE_URL'], envVars['EXPO_PUBLIC_SUPABASE_ANON_KEY']);

async function run() {
  const { data } = await supabase
      .from('off_products')
      .select('barcode, product_name, calories')
      .ilike('product_name', '%sokolik%')
      .limit(3);
  console.log(`Sokoliki barcodes:`, data);
}
run();
