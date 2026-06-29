import { getSupabaseClient } from '@/src/lib/supabase';
import type { MealNutritionInput } from '@/src/types';

export const barcodeService = {
  async fetchProduct(barcode: string): Promise<{ name: string; nutrition: MealNutritionInput } | null> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
        headers: {
          'User-Agent': 'Nutora - iOS/Android - Version 1.0 - contact@nutora.pro'
        }
      });
      if (!response.ok) return null;
      
      const json = await response.json();
      if (json.status !== 1 || !json.product) return null;

      const product = json.product;
      const nutriments = product.nutriments || {};
      const name = product.product_name_pl || product.product_name || 'Zeskanowany produkt';
      
      const getVal = (key: string) => Math.round(Number(nutriments[`${key}_serving`] || nutriments[`${key}_100g`] || nutriments[key] || 0));

      let calories = getVal('energy-kcal');
      if (calories === 0) {
        const energyKj = Math.round(Number(nutriments['energy-kj_serving'] || nutriments['energy-kj_100g'] || nutriments['energy_100g'] || 0));
        if (energyKj > 0) {
          calories = Math.round(energyKj / 4.184);
        }
      }

      const nutrition = {
        estimatedCalories: calories,
        proteinG: getVal('proteins'),
        fatG: getVal('fat'),
        carbsG: getVal('carbohydrates'),
      };

      return { name, nutrition };
    } catch (err) {
      console.error('Błąd podczas pobierania produktu z OFF:', err);
      return null;
    }
  }
};
