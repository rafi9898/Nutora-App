import type { Meal, UserProfile } from '@/src/types';

export const mealPhotos = {
  oatmeal: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=300&q=80',
  chicken: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
  yogurt: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80'
};

const now = new Date().toISOString();

export const mockProfile: UserProfile = {
  id: 'profile-1', userId: 'user-1', name: 'Rafał', email: 'rafal@example.com',
  gender: 'Mężczyzna', age: 31, heightCm: 180, weightKg: 78, goal: 'lose_weight',
  activityLevel: 'medium', dailyCalorieGoal: 2200, proteinGoalG: 165, fatGoalG: 73, carbsGoalG: 275
};

export const mockMeals: Meal[] = [
  { id: 'meal-1', userId: 'user-1', mealName: 'Owsianka z owocami', mealType: 'breakfast', estimatedCalories: 412, proteinG: 22, fatG: 12, carbsG: 61, photoUrl: mealPhotos.oatmeal, createdAt: now, updatedAt: now, items: [] },
  { id: 'meal-2', userId: 'user-1', mealName: 'Kurczak z ryżem i warzywami', mealType: 'lunch', estimatedCalories: 684, proteinG: 45, fatG: 18, carbsG: 74, confidenceScore: 0.72, photoUrl: mealPhotos.chicken, createdAt: now, updatedAt: now, aiNotes: 'To szacunkowa analiza na podstawie zdjęcia.', items: [
    { id: 'item-1', mealId: 'meal-2', name: 'Kurczak grillowany', estimatedWeightG: 150, estimatedCalories: 240, proteinG: 36, fatG: 8, carbsG: 0, confidenceScore: 0.78 },
    { id: 'item-2', mealId: 'meal-2', name: 'Ryż biały', estimatedWeightG: 180, estimatedCalories: 272, proteinG: 5, fatG: 1, carbsG: 60, confidenceScore: 0.7 },
    { id: 'item-3', mealId: 'meal-2', name: 'Warzywa', estimatedWeightG: 150, estimatedCalories: 120, proteinG: 3, fatG: 1, carbsG: 20, confidenceScore: 0.68 },
    { id: 'item-4', mealId: 'meal-2', name: 'Sos śmietanowy', estimatedWeightG: 40, estimatedCalories: 52, proteinG: 1, fatG: 8, carbsG: 2, confidenceScore: 0.55 }
  ] },
  { id: 'meal-3', userId: 'user-1', mealName: 'Sałatka z tuńczykiem', mealType: 'dinner', estimatedCalories: 364, proteinG: 35, fatG: 16, carbsG: 22, photoUrl: mealPhotos.salad, createdAt: now, updatedAt: now, items: [] },
  { id: 'meal-4', userId: 'user-1', mealName: 'Jogurt naturalny z orzechami', mealType: 'snack', estimatedCalories: 210, proteinG: 13, fatG: 10, carbsG: 18, photoUrl: mealPhotos.yogurt, createdAt: now, updatedAt: now, items: [] }
];

export const weeklyCalories = [1800, 1540, 2100, 2310, 1990, 1650, 1460];
