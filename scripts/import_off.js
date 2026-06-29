const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// Wymagane zmienne środowiskowe:
// SUPABASE_URL=https://twoj-projekt.supabase.co
// SUPABASE_SERVICE_ROLE_KEY=ey...
// OFF_JSONL_PATH=./openfoodfacts-products.jsonl

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jsonlPath = process.env.OFF_JSONL_PATH;

if (!supabaseUrl || !supabaseKey || !jsonlPath) {
  console.error("Brakujące zmienne środowiskowe: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OFF_JSONL_PATH");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importData() {
  console.log(`Rozpoczynam import z ${jsonlPath}...`);
  
  const fileStream = fs.createReadStream(jsonlPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let totalProcessed = 0;
  let totalInserted = 0;

  for await (const line of rl) {
    totalProcessed++;
    if (totalProcessed % 50000 === 0) {
      console.log(`Przetworzono ${totalProcessed} linii. Dodano do tej pory: ${totalInserted} polskich produktów.`);
    }

    try {
      const p = JSON.parse(line);
      
      // Sprawdzamy czy produkt jest sprzedawany w Polsce
      const isPolish = p.countries_tags && p.countries_tags.some(tag => tag.includes('poland') || tag.includes('polska'));
      if (!isPolish) continue;

      const name = p.product_name || p.product_name_pl || '';
      if (!name) continue; // pomijamy produkty bez nazwy

      // Bezpieczne pobranie wartości odżywczych (często brakujące)
      const n = p.nutriments || {};
      
      const record = {
        barcode: p.code,
        product_name: name,
        product_name_pl: p.product_name_pl || null,
        image_url: p.image_front_url || p.image_url || p.image_small_url || null,
        calories: typeof n['energy-kcal_100g'] === 'number' ? n['energy-kcal_100g'] : null,
        proteins: typeof n.proteins_100g === 'number' ? n.proteins_100g : null,
        fats: typeof n.fat_100g === 'number' ? n.fat_100g : null,
        carbs: typeof n.carbohydrates_100g === 'number' ? n.carbohydrates_100g : null,
        quantity: typeof p.product_quantity === 'number' ? p.product_quantity : null
      };

      batch.push(record);

      if (batch.length >= 1000) {
        // Wgrywamy paczkę 1000 rekordów naraz
        const { error } = await supabase.from('off_products').upsert(batch, { onConflict: 'barcode' });
        if (error) {
          console.error("Błąd zapisu partii:", error.message);
        } else {
          totalInserted += batch.length;
        }
        batch = []; // czyszczenie paczki
      }
    } catch (err) {
      // Błąd parsowania linii (np. uszkodzony JSONL) - ignorujemy
    }
  }

  // Zapisz resztki (ostatnia, niepełna paczka)
  if (batch.length > 0) {
    const { error } = await supabase.from('off_products').upsert(batch, { onConflict: 'barcode' });
    if (!error) totalInserted += batch.length;
  }

  console.log(`ZAKOŃCZONO! Przetworzono łącznie: ${totalProcessed} rekordów z pliku.`);
  console.log(`Dodano lub zaktualizowano w Supabase: ${totalInserted} polskich produktów.`);
}

importData().catch(console.error);
