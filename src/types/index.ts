export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
export type UserGoal = 'lose_weight' | 'maintain' | 'gain_weight';
export type SubscriptionTier = 'free' | 'premium';

export interface MealItem {
  id: string;
  mealId: string;
  name: string;
  estimatedWeightG?: number;
  estimatedCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  confidenceScore?: number;
}

export interface Meal {
  id: string;
  userId: string;
  photoUrl?: string;
  mealName: string;
  mealType: MealType;
  estimatedCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  confidenceScore?: number;
  aiNotes?: string;
  createdAt: string;
  updatedAt: string;
  items: MealItem[];
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  gender?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  goal: UserGoal;
  activityLevel: 'low' | 'medium' | 'high';
  dailyCalorieGoal: number;
  proteinGoalG: number;
  fatGoalG: number;
  carbsGoalG: number;
}

export interface MealNutritionInput {
  estimatedCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  analysesUsed: number;
  usageMonth: string;
  monthlyLimit: number | null;
  status?: 'active' | 'inactive' | 'trialing' | 'cancelled' | 'expired';
  provider?: 'revenuecat' | 'manual' | 'demo' | null;
  expiresAt?: string;
}
