import type { Meal, MealItem, UserProfile } from '@/src/types';

/**
 * Contracts intentionally have no implementation in Etap 1. Future adapters
 * can implement these against Supabase, an Edge Function and RevenueCat while
 * leaving UI and feature state untouched.
 */
export interface MealRepository {
  list(): Promise<Meal[]>;
  save(meal: Meal): Promise<Meal>;
  update(meal: Meal): Promise<Meal>;
  remove(id: string): Promise<void>;
}

export interface PhotoAnalysisService {
  analyze(photoUri: string): Promise<{
    meal: Omit<Meal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    items: MealItem[];
  }>;
}

export interface ProfileRepository {
  get(): Promise<UserProfile>;
  update(profile: UserProfile): Promise<UserProfile>;
}

export interface SubscriptionService {
  purchaseMonthly(): Promise<void>;
  restore(): Promise<void>;
}
