const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// 1. Wczytanie środowiska .env
const envPath = path.resolve(__dirname, '../../.env');
let envData = '';
try {
  envData = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error('Błąd: Nie znaleziono pliku .env w głównym folderze projektu.');
  process.exit(1);
}

const envVars = {};
envData.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars['EXPO_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Błąd: Brak kluczy Supabase w .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// 2. Przygotowanie strumienia do odczytu
const GZ_FILE_PATH = path.resolve(__dirname, '../../openfoodfacts-products.jsonl.gz');
const JSONL_FILE_PATH = path.resolve(__dirname, '../../openfoodfacts-products.jsonl');

let rl;

if (fs.existsSync(GZ_FILE_PATH)) {
  console.log('Znaleziono spakowany plik .gz. Dekompresuję w locie...');
  const fileStream = fs.createReadStream(GZ_FILE_PATH);
  const gunzip = zlib.createGunzip();
  rl = readline.createInterface({
    input: fileStream.pipe(gunzip),
    crlfDelay: Infinity
  });
} else if (fs.existsSync(JSONL_FILE_PATH)) {
  console.log('Znaleziono rozpakowany plik .jsonl. Czytam bezpośrednio...');
  const fileStream = fs.createReadStream(JSONL_FILE_PATH);
  rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
} else {
  console.error(`Błąd: Nie znaleziono ani pliku ${GZ_FILE_PATH} ani ${JSONL_FILE_PATH}`);
  console.log('Przenieś jeden z tych plików do głównego folderu projektu i spróbuj ponownie.');
  process.exit(1);
}

let batch = [];
const BATCH_SIZE = 1000;
let totalProcessed = 0;
let totalSaved = 0;

console.log('Rozpoczynam analizę i import bazy Open Food Facts (CAŁY ŚWIAT)...');

const getVal = (nutriments, key) => {
  return Math.round(Number(nutriments[`${key}_serving`] || nutriments[`${key}_100g`] || nutriments[key] || 0));
};

const saveBatch = async () => {
  if (batch.length === 0) return;
  const currentBatch = [...batch];
  batch = [];

  const { error } = await supabase
    .from('off_products')
    .upsert(currentBatch, { onConflict: 'barcode', ignoreDuplicates: true });

  if (error) {
    console.error('Błąd podczas zapisu partii:', error.message);
  } else {
    totalSaved += currentBatch.length;
    console.log(`Zapisano pomyślnie! Łącznie w bazie: ${totalSaved} produktów z całego świata.`);
  }
};

rl.on('line', async (line) => {
  totalProcessed++;
  if (totalProcessed % 100000 === 0) {
    console.log(`Przeanalizowano ${totalProcessed} produktów z pliku...`);
  }

  try {
    const product = JSON.parse(line);

    if (product.code) {
      const nutriments = product.nutriments || {};
      const name = product.product_name || product.product_name_en || product.product_name_pl;
      
      if (!name) return; // Ignoruj produkty bez nazwy

      const record = {
        barcode: String(product.code),
        product_name: name,
        product_name_pl: product.product_name_pl || null,
        image_url: product.image_url || null,
        calories: getVal(nutriments, 'energy-kcal'),
        proteins: getVal(nutriments, 'proteins'),
        fats: getVal(nutriments, 'fat'),
        carbs: getVal(nutriments, 'carbohydrates'),
        quantity: parseFloat(product.quantity) || null
      };

      batch.push(record);

      if (batch.length >= BATCH_SIZE) {
        // Zatrzymujemy czytanie na czas wysyłki do bazy
        rl.pause();
        await saveBatch();
        rl.resume();
      }
    }
  } catch (err) {
    // ignoruj błędy parsowania pojedynczych linii
  }
});

rl.on('close', async () => {
  console.log('Zakończono czytanie pliku. Zapisuję ostatnią partię...');
  await saveBatch();
  console.log(`GOTOWE! Znaleziono i zaimportowano ${totalSaved} produktów na ${totalProcessed} przeanalizowanych wierszy.`);
  process.exit(0);
});
