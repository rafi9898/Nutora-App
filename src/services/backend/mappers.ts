import type { Meal, MealItem, UserProfile } from '@/src/types';
import type { MealInsert, MealItemInsert, MealItemRow, MealRow, MealUpdate, UserProfileRow, UserProfileUpdate } from '@/src/types/supabase';

export const mapProfileRowToProfile = (row: UserProfileRow, email = ''): UserProfile => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  email,
  gender: row.gender ?? undefined,
  age: row.age ?? undefined,
  heightCm: row.height_cm ?? undefined,
  weightKg: row.weight_kg ?? undefined,
  goal: row.goal,
  activityLevel: row.activity_level,
  dailyCalorieGoal: row.daily_calorie_goal,
  proteinGoalG: row.protein_goal_g,
  fatGoalG: row.fat_goal_g,
  carbsGoalG: row.carbs_goal_g
});

export const mapProfileToUpdate = (profile: UserProfile): UserProfileUpdate => ({
  name: profile.name,
  gender: profile.gender ?? null,
  age: profile.age ?? null,
  height_cm: profile.heightCm ?? null,
  weight_kg: profile.weightKg ?? null,
  goal: profile.goal,
  activity_level: profile.activityLevel,
  daily_calorie_goal: profile.dailyCalorieGoal,
  protein_goal_g: profile.proteinGoalG,
  fat_goal_g: profile.fatGoalG,
  carbs_goal_g: profile.carbsGoalG,
  updated_at: new Date().toISOString()
});

export const mapMealRowToMeal = (row: MealRow, items: MealItem[] = []): Meal => ({
  id: row.id,
  userId: row.user_id,
  photoUrl: row.photo_url ?? undefined,
  mealName: row.meal_name,
  mealType: row.meal_type,
  estimatedCalories: row.estimated_calories,
  proteinG: row.protein_g,
  fatG: row.fat_g,
  carbsG: row.carbs_g,
  confidenceScore: row.confidence_score ?? undefined,
  aiNotes: row.ai_notes ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items
});

export const mapMealItemRowToItem = (row: MealItemRow): MealItem => ({
  id: row.id,
  mealId: row.meal_id,
  name: row.name,
  estimatedWeightG: row.estimated_weight_g ?? undefined,
  estimatedCalories: row.estimated_calories,
  proteinG: row.protein_g,
  fatG: row.fat_g,
  carbsG: row.carbs_g,
  confidenceScore: row.confidence_score ?? undefined
});

export const mapMealToInsert = (meal: Meal): MealInsert => ({
  id: meal.id,
  user_id: meal.userId,
  photo_url: meal.photoUrl ?? null,
  meal_name: meal.mealName,
  meal_type: meal.mealType,
  estimated_calories: meal.estimatedCalories,
  protein_g: meal.proteinG,
  fat_g: meal.fatG,
  carbs_g: meal.carbsG,
  confidence_score: meal.confidenceScore ?? null,
  ai_notes: meal.aiNotes ?? null,
  created_at: meal.createdAt,
  updated_at: meal.updatedAt
});

export const mapMealToUpdate = (meal: Meal): MealUpdate => ({
  photo_url: meal.photoUrl ?? null,
  meal_name: meal.mealName,
  meal_type: meal.mealType,
  estimated_calories: meal.estimatedCalories,
  protein_g: meal.proteinG,
  fat_g: meal.fatG,
  carbs_g: meal.carbsG,
  confidence_score: meal.confidenceScore ?? null,
  ai_notes: meal.aiNotes ?? null,
  updated_at: new Date().toISOString()
});

export const mapMealItemToInsert = (item: MealItem, mealId: string): MealItemInsert => ({
  id: item.id,
  meal_id: mealId,
  name: item.name,
  estimated_weight_g: item.estimatedWeightG ?? null,
  estimated_calories: item.estimatedCalories,
  protein_g: item.proteinG,
  fat_g: item.fatG,
  carbs_g: item.carbsG,
  confidence_score: item.confidenceScore ?? null
});
