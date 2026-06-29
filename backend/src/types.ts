export type AppLanguage = 'pl' | 'en' | 'es' | 'de' | 'fr' | 'it' | 'pt' | 'uk';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export type AiMealAnalysis = {
  mealName: string;
  mealType: MealType;
  estimatedCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  confidenceScore: number;
  aiNotes: string;
  items: {
    name: string;
    estimatedWeightG?: number;
    estimatedCalories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    confidenceScore?: number;
  }[];
};

export type AuthenticatedUser = {
  id: string;
  email?: string;
};
