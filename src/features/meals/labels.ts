import type { TFunction } from 'i18next';
import type { Meal, MealItem } from '@/src/types';

const knownMealNameKeys: Record<string, string> = {
  'Owsianka z owocami': 'meal-1',
  'Kurczak z ryżem i warzywami': 'meal-2',
  'Sałatka z tuńczykiem': 'meal-3',
  'Jogurt naturalny z orzechami': 'meal-4'
};

const knownItemNameKeys: Record<string, string> = {
  'Kurczak grillowany': 'item-1',
  'Ryż biały': 'item-2',
  'Brokuły': 'item-3',
  'Warzywa': 'item-3',
  'Sos śmietanowy': 'item-4'
};

const canonicalItemKey = (id: string) => {
  if (id in knownItemNameKeys) return knownItemNameKeys[id];
  if (['item-1', 'item-2', 'item-3', 'item-4'].includes(id)) return id;
  if (id.endsWith('-1')) return 'item-1';
  if (id.endsWith('-2')) return 'item-2';
  if (id.endsWith('-3')) return 'item-3';
  if (id.endsWith('-4')) return 'item-4';
  return null;
};

export const translateMealName = (t: TFunction, meal: Meal) => {
  const key = knownMealNameKeys[meal.mealName] ?? (meal.id.startsWith('meal-') ? meal.id : null);
  return key ? t(`mockMeals.names.${key}`, { defaultValue: meal.mealName }) : meal.mealName;
};

export const translateMealItemName = (t: TFunction, item: MealItem) => {
  const key = canonicalItemKey(item.id) ?? knownItemNameKeys[item.name];
  return key ? t(`mockMeals.items.${key}`, { defaultValue: item.name }) : item.name;
};
