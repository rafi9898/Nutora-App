import { mealPhotos } from '@/src/data/mock';
import type { Meal } from '@/src/types';

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/** Local stand-in for a future backend AI endpoint. It never sends a photo anywhere. */
export const mockAiService = {
  async analyze(photoUri?: string, locale: string = 'pl'): Promise<Meal> {
    await wait(900);
    const id = `analysis-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const isEn = locale !== 'pl';

    return {
      id,
      userId: 'user-1',
      mealName: isEn ? 'Chicken with rice and vegetables' : 'Kurczak z ryżem i warzywami',
      mealType: 'lunch',
      estimatedCalories: 684,
      proteinG: 45,
      fatG: 18,
      carbsG: 74,
      confidenceScore: 0.72,
      photoUrl: photoUri || mealPhotos.chicken,
      createdAt: timestamp,
      updatedAt: timestamp,
      aiNotes: isEn ? 'This is a local, sample analysis. Actual values may vary.' : 'To lokalna, przykładowa analiza. Rzeczywiste wartości mogą się różnić.',
      items: [
        { id: `${id}-1`, mealId: id, name: isEn ? 'Grilled chicken' : 'Kurczak grillowany', estimatedWeightG: 150, estimatedCalories: 240, proteinG: 36, fatG: 8, carbsG: 0, confidenceScore: 0.78 },
        { id: `${id}-2`, mealId: id, name: isEn ? 'White rice' : 'Ryż biały', estimatedWeightG: 180, estimatedCalories: 272, proteinG: 5, fatG: 1, carbsG: 60, confidenceScore: 0.7 },
        { id: `${id}-3`, mealId: id, name: isEn ? 'Vegetables' : 'Warzywa', estimatedWeightG: 150, estimatedCalories: 120, proteinG: 3, fatG: 1, carbsG: 20, confidenceScore: 0.68 },
        { id: `${id}-4`, mealId: id, name: isEn ? 'Cream sauce' : 'Sos śmietanowy', estimatedWeightG: 40, estimatedCalories: 52, proteinG: 1, fatG: 8, carbsG: 2, confidenceScore: 0.55 }
      ]
    };
  },
  async analyzeText(text: string, locale: string = 'pl'): Promise<Meal> {
    await wait(600);
    const id = `analysis-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const isEn = locale !== 'pl';

    return {
      id,
      userId: 'user-1',
      mealName: text,
      mealType: 'other',
      estimatedCalories: 350,
      proteinG: 12,
      fatG: 10,
      carbsG: 45,
      createdAt: timestamp,
      updatedAt: timestamp,
      aiNotes: isEn ? 'This is a local, sample text analysis from Mock AI.' : 'To lokalna, przykładowa analiza tekstowa z Mock AI.',
      items: [
        { id: `${id}-1`, mealId: id, name: text, estimatedWeightG: 200, estimatedCalories: 350, proteinG: 12, fatG: 10, carbsG: 45 }
      ]
    };
  }
};
