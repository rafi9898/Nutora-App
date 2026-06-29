import type { Meal } from '@/src/types';

export const isSameDay = (first: Date, second: Date) => first.toDateString() === second.toDateString();

export const getTodayMeals = (meals: Meal[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return meals.filter((meal) => {
    const mealDate = new Date(meal.createdAt);
    return mealDate >= today && mealDate < tomorrow;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getMealsForDate = (meals: Meal[], dateStr: string) => {
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  return meals.filter((meal) => {
    const mealDate = new Date(meal.createdAt);
    return mealDate >= targetDate && mealDate < nextDate;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const sumNutrition = (meals: Meal[]) => meals.reduce((total, meal) => ({
  calories: total.calories + meal.estimatedCalories,
  protein: total.protein + meal.proteinG,
  fat: total.fat + meal.fatG,
  carbs: total.carbs + meal.carbsG
}), { calories: 0, protein: 0, fat: 0, carbs: 0 });

export const getWeekCalories = (meals: Meal[], reference = new Date()) => {
  const start = new Date(reference);
  const weekday = start.getDay() || 7;
  start.setDate(start.getDate() - weekday + 1);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    return { date: day, calories: sumNutrition(meals.filter((meal) => isSameDay(new Date(meal.createdAt), day))).calories };
  });
};

export const getCurrentStreak = (meals: Meal[], today = new Date()) => {
  if (!meals.length) return 0;

  const uniqueDates = Array.from(new Set(
    meals.map(m => {
      const d = new Date(m.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  )).sort((a, b) => b - a);

  if (uniqueDates.length === 0) return 0;

  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const yesterdayMidnight = new Date(todayMidnight);
  yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

  let streak = 0;
  let currentDate = todayMidnight.getTime();

  if (uniqueDates[0] !== todayMidnight.getTime() && uniqueDates[0] !== yesterdayMidnight.getTime()) {
    return 0;
  }

  if (uniqueDates[0] === yesterdayMidnight.getTime()) {
    currentDate = yesterdayMidnight.getTime();
  }

  for (const dateTime of uniqueDates) {
    if (dateTime === currentDate) {
      streak++;
      const prevDay = new Date(currentDate);
      prevDay.setDate(prevDay.getDate() - 1);
      currentDate = prevDay.getTime();
    } else {
      break;
    }
  }

  return streak;
};
