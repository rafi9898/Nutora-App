import type { MealType, SubscriptionTier, UserGoal } from '@/src/types';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      user_profiles: {
        Row: UserProfileRow;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
        Relationships: [];
      };
      meals: {
        Row: MealRow;
        Insert: MealInsert;
        Update: MealUpdate;
        Relationships: [];
      };
      meal_items: {
        Row: MealItemRow;
        Insert: MealItemInsert;
        Update: MealItemUpdate;
        Relationships: [];
      };
      ai_analysis_logs: {
        Row: AiAnalysisLogRow;
        Insert: AiAnalysisLogInsert;
        Update: AiAnalysisLogUpdate;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      meal_type: MealType;
      user_goal: UserGoal;
      subscription_tier: SubscriptionTier;
    };
  };
};

export type UserRow = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type UserInsert = {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
};

export type UserUpdate = Partial<Omit<UserInsert, 'id'>>;

export type UserProfileRow = {
  id: string;
  user_id: string;
  name: string;
  gender: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: UserGoal;
  activity_level: 'low' | 'medium' | 'high';
  daily_calorie_goal: number;
  protein_goal_g: number;
  fat_goal_g: number;
  carbs_goal_g: number;
  created_at: string;
  updated_at: string;
};

export type UserProfileInsert = {
  id?: string;
  user_id: string;
  name: string;
  gender?: string | null;
  age?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal?: UserGoal;
  activity_level?: 'low' | 'medium' | 'high';
  daily_calorie_goal?: number;
  protein_goal_g?: number;
  fat_goal_g?: number;
  carbs_goal_g?: number;
  created_at?: string;
  updated_at?: string;
};

export type UserProfileUpdate = Partial<Omit<UserProfileInsert, 'id' | 'user_id'>>;

export type MealRow = {
  id: string;
  user_id: string;
  photo_url: string | null;
  meal_name: string;
  meal_type: MealType;
  estimated_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  confidence_score: number | null;
  ai_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MealInsert = {
  id?: string;
  user_id: string;
  photo_url?: string | null;
  meal_name: string;
  meal_type: MealType;
  estimated_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  confidence_score?: number | null;
  ai_notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MealUpdate = Partial<Omit<MealInsert, 'id' | 'user_id'>>;

export type MealItemRow = {
  id: string;
  meal_id: string;
  name: string;
  estimated_weight_g: number | null;
  estimated_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  confidence_score: number | null;
  created_at: string;
};

export type MealItemInsert = {
  id?: string;
  meal_id: string;
  name: string;
  estimated_weight_g?: number | null;
  estimated_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  confidence_score?: number | null;
  created_at?: string;
};

export type MealItemUpdate = Partial<Omit<MealItemInsert, 'id' | 'meal_id'>>;

export type AiAnalysisLogRow = {
  id: string;
  user_id: string;
  meal_id: string | null;
  photo_url: string | null;
  status: 'pending' | 'completed' | 'failed';
  provider: string | null;
  request_payload: Json | null;
  response_payload: Json | null;
  error_message: string | null;
  created_at: string;
};

export type AiAnalysisLogInsert = {
  id?: string;
  user_id: string;
  meal_id?: string | null;
  photo_url?: string | null;
  status?: 'pending' | 'completed' | 'failed';
  provider?: string | null;
  request_payload?: Json | null;
  response_payload?: Json | null;
  error_message?: string | null;
  created_at?: string;
};

export type AiAnalysisLogUpdate = Partial<Omit<AiAnalysisLogInsert, 'id' | 'user_id'>>;

export type SubscriptionRow = {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  provider: 'revenuecat' | 'manual' | null;
  provider_customer_id: string | null;
  status: 'active' | 'inactive' | 'trialing' | 'cancelled' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  analyses_used_month: number;
  analysis_limit_monthly: number | null;
  usage_month: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInsert = {
  id?: string;
  user_id: string;
  tier?: SubscriptionTier;
  provider?: 'revenuecat' | 'manual' | null;
  provider_customer_id?: string | null;
  status?: 'active' | 'inactive' | 'trialing' | 'cancelled' | 'expired';
  current_period_start?: string | null;
  current_period_end?: string | null;
  analyses_used_month?: number;
  analysis_limit_monthly?: number | null;
  usage_month?: string;
  created_at?: string;
  updated_at?: string;
};

export type SubscriptionUpdate = Partial<Omit<SubscriptionInsert, 'id' | 'user_id'>>;
