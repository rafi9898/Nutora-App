async function run() {
  const response = await fetch('https://world.openfoodfacts.org/api/v0/product/5906712810812.json');
  const json = await response.json();
  const n = json.product.nutriments;
  console.log('Energy:', n['energy']);
  console.log('Energy 100g:', n['energy_100g']);
  console.log('Energy-kcal:', n['energy-kcal']);
  console.log('Energy-kcal 100g:', n['energy-kcal_100g']);
  console.log('Energy-kj 100g:', n['energy-kj_100g']);
  console.log('Proteins 100g:', n['proteins_100g']);
}
run();
