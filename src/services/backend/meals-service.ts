import { getSupabaseClient } from '@/src/lib/supabase';
import type { Meal } from '@/src/types';
import { mapMealItemRowToItem, mapMealItemToInsert, mapMealRowToMeal, mapMealToInsert, mapMealToUpdate } from '@/src/services/backend/mappers';

export const mealsService = {
  async saveMeal(meal: Meal): Promise<Meal> {
    const supabase = getSupabaseClient();
    const mealPayload = mapMealToInsert(meal);

    const { data: savedMeal, error: mealError } = await supabase
      .from('meals')
      .upsert(mealPayload)
      .select()
      .single();

    if (mealError) throw mealError;

    if (meal.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('meal_items')
        .upsert(meal.items.map((item) => mapMealItemToInsert(item, savedMeal.id)));

      if (itemsError) throw itemsError;
    }

    return mapMealRowToMeal(savedMeal, meal.items);
  },

  async getMeals(userId?: string): Promise<Meal[]> {
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = userId ? { data: null, error: null } : await supabase.auth.getUser();
    const resolvedUserId = userId ?? authData?.user?.id;

    if (authError) throw authError;
    if (!resolvedUserId) return [];

    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', resolvedUserId)
      .order('created_at', { ascending: false });

    if (mealsError) throw mealsError;
    if (!meals?.length) return [];

    const mealIds = meals.map((meal) => meal.id);
    const { data: items, error: itemsError } = await supabase
      .from('meal_items')
      .select('*')
      .in('meal_id', mealIds);

    if (itemsError) throw itemsError;

    return meals.map((meal) => mapMealRowToMeal(
      meal,
      (items ?? []).filter((item) => item.meal_id === meal.id).map(mapMealItemRowToItem)
    ));
  },

  async updateMeal(meal: Meal): Promise<Meal> {
    const supabase = getSupabaseClient();
    const { data: updatedMeal, error: mealError } = await supabase
      .from('meals')
      .update(mapMealToUpdate(meal))
      .eq('id', meal.id)
      .select()
      .single();

    if (mealError) throw mealError;

    // TODO: Replace delete+insert with a transactional RPC/Edge Function when
    // production backend is active, so meal and items update atomically.
    const { error: deleteItemsError } = await supabase.from('meal_items').delete().eq('meal_id', meal.id);
    if (deleteItemsError) throw deleteItemsError;

    if (meal.items.length > 0) {
      const { error: insertItemsError } = await supabase
        .from('meal_items')
        .insert(meal.items.map((item) => mapMealItemToInsert(item, meal.id)));

      if (insertItemsError) throw insertItemsError;
    }

    return mapMealRowToMeal(updatedMeal, meal.items);
  },

  async deleteMeal(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('meals').delete().eq('id', id);

    if (error) throw error;
  }
};

export const saveMeal = mealsService.saveMeal;
export const getMeals = mealsService.getMeals;
export const updateMeal = mealsService.updateMeal;
export const deleteMeal = mealsService.deleteMeal;
