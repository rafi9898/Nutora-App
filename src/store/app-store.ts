import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { createJSONStorage, persist } from 'zustand/middleware';
import { aiAnalysisMode, isSupabaseMode } from '@/src/config/env';
import { mockMeals, mockProfile } from '@/src/data/mock';
import { changeAppLanguage, getDeviceLanguage, type AppLanguage } from '@/src/i18n';
import { aiAnalysisService, authService, mealsService, profileService, storageService, subscriptionService, type SocialProvider } from '@/src/services/backend';
import { mockAiService } from '@/src/services/mock-ai-service';
import { revenueCatService } from '@/src/services/payments/revenuecat-service';
import type { PurchasesPackage } from 'react-native-purchases';
import type { Meal, MealNutritionInput, SubscriptionState, UserProfile } from '@/src/types';
import i18n from '@/src/i18n';
import { notificationsService } from '@/src/services/notifications-service';
import { supabase } from '@/src/lib/supabase';
import { detectUnitSystem, type UnitSystem } from '@/src/utils/units';

export const FREE_ANALYSIS_LIMIT = 5;
export const PREMIUM_ANALYSIS_LIMIT = 200;
const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const freeSubscriptionState = (overrides: Partial<SubscriptionState> = {}): SubscriptionState => ({
  tier: 'free',
  analysesUsed: 0,
  usageMonth: getCurrentMonth(),
  monthlyLimit: FREE_ANALYSIS_LIMIT,
  status: 'inactive',
  provider: 'manual',
  ...overrides
});

const preserveSubscriptionUsage = (subscription: SubscriptionState, current?: SubscriptionState | null): SubscriptionState => ({
  ...subscription,
  analysesUsed: current?.analysesUsed ?? subscription.analysesUsed,
  usageMonth: current?.usageMonth ?? subscription.usageMonth
});

const isFutureDate = (value?: string) => Boolean(value && new Date(value).getTime() > Date.now());

const isConfirmedPremium = (subscription?: SubscriptionState | null) => (
  subscription?.tier === 'premium' &&
  subscription.status === 'active' &&
  (!subscription.expiresAt || isFutureDate(subscription.expiresAt))
);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitForConfirmedPremium = async (
  userId: string,
  options: { syncRevenueCat?: boolean; attempts?: number; intervalMs?: number } = {}
) => {
  const attempts = options.attempts ?? 30;
  const intervalMs = options.intervalMs ?? 2000;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const subscription = options.syncRevenueCat
      ? await subscriptionService.syncRevenueCatSubscription({ confirmOnly: true }).catch((error) => {
        console.warn('RevenueCat confirm sync failed:', error);
        return subscriptionService.getSubscription(userId).catch(() => null);
      })
      : await subscriptionService.getSubscription(userId).catch(() => null);

    if (isConfirmedPremium(subscription)) return subscription;
    if (attempt < attempts - 1) await wait(intervalMs);
  }

  return null;
};

const translateError = (error: unknown, defaultMsg: string) => {
  if (!(error instanceof Error)) return defaultMsg;
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Nieprawidłowy adres e-mail lub hasło.';
  if (msg.includes('already exists') || msg.includes('user already registered')) return 'Konto z tym adresem e-mail już istnieje.';
  if (msg.includes('rate limit')) return 'Przekroczono limit zapytań. Spróbuj ponownie za chwilę.';
  if (msg.includes('network request failed')) return 'Błąd sieci. Sprawdź połączenie z internetem.';
  if (msg.includes('email link')) return 'Błędny lub przeterminowany link aktywacyjny.';
  return error.message;
};
const mockUser: Pick<User, 'id' | 'email'> = { id: mockProfile.userId, email: mockProfile.email };

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
type ResourceStatus = 'idle' | 'loading' | 'ready' | 'error';

const profileFromAuthUser = (user: User): UserProfile => ({
  id: user.id,
  userId: user.id,
  name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : user.email?.split('@')[0] || mockProfile.name,
  email: user.email || mockProfile.email,
  goal: 'lose_weight',
  activityLevel: 'medium',
  dailyCalorieGoal: 2000,
  proteinGoalG: 120,
  fatGoalG: 60,
  carbsGoalG: 220
});

export const createLocalId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const getLocalISODate = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeMealForUser = (meal: Meal, userId: string, photoUrl?: string): Meal => {
  const id = createLocalId();
  const timestamp = new Date().toISOString();

  return {
    ...meal,
    id,
    userId,
    photoUrl: photoUrl ?? meal.photoUrl,
    createdAt: timestamp,
    updatedAt: timestamp,
    items: meal.items.map((item) => ({ ...item, id: createLocalId(), mealId: id }))
  };
};

type AppState = {
  authStatus: AuthStatus;
  authUser: Pick<User, 'id' | 'email'> | null;
  authError: string | null;
  mealsStatus: ResourceStatus;
  mealsError: string | null;
  subscriptionStatus: ResourceStatus;
  subscriptionError: string | null;
  language: AppLanguage;
  languageSelected: boolean;
  unitSystem: UnitSystem;
  notificationsEnabled: boolean;
  profile: UserProfile;
  meals: Meal[];
  analysisDraft: Meal | null;
  subscription: SubscriptionState;
  hasOnboarded: boolean;
  initializeAuth: () => Promise<void>;
  registerWithEmail: (input: { name: string; email: string; password: string }) => Promise<boolean>;
  loginWithEmail: (input: { email: string; password: string }) => Promise<boolean>;
  loginWithProvider: (provider: SocialProvider) => Promise<boolean>;
  logout: () => Promise<void>;
  loadMeals: () => Promise<void>;
  fetchMeals: () => Promise<void>;
  resetData: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  loadSubscription: () => Promise<void>;
  refreshBackendData: () => Promise<void>;
  waterIntake: { date: string; glasses: number };
  currentDate: string;
  weightLogs: { id: string; date: string; weightKg: number }[];
  setLanguage: (language: AppLanguage, markSelected?: boolean) => Promise<void>;
  setUnitSystem: (system: UnitSystem) => void;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  setHasOnboarded: (value: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  setCurrentDate: (date: string) => void;
  addWater: () => void;
  removeWater: () => void;
  logWeight: (weight: number) => void;
  deleteWeightLog: (id: string) => void;
  saveMeal: (meal: Meal) => Promise<Meal | null>;
  updateMeal: (meal: Meal) => Promise<Meal | null>;
  updateMealNutrition: (id: string, nutrition: MealNutritionInput, portion: number) => Promise<Meal | null>;
  deleteMeal: (id: string) => Promise<void>;
  analyzePhoto: (photoUri?: string) => Promise<Meal | null>;
  analyzeText: (text: string) => Promise<Meal | null>;
  setAnalysisDraft: (meal: Meal) => void;
  saveAnalysisDraft: () => Promise<Meal | null>;
  clearAnalysisDraft: () => void;
  setSubscriptionTier: (tier: SubscriptionState['tier']) => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  purchasePremium: (plan?: 'monthly' | 'yearly') => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  hasAnalysisAvailable: () => boolean;
  getAnalysesUsed: () => number;
  clearAuthError: () => void;
};

export const useAppStore = create<AppState>()(persist((set, get) => ({
  authStatus: isSupabaseMode ? 'idle' : 'authenticated',
  authUser: isSupabaseMode ? null : mockUser,
  authError: null,
  mealsStatus: 'ready',
  mealsError: null,
  subscriptionStatus: 'ready',
  subscriptionError: null,
  language: getDeviceLanguage(),
  languageSelected: false,
  unitSystem: detectUnitSystem(),
  notificationsEnabled: true,
  waterIntake: { date: getLocalISODate(), glasses: 0 },
  currentDate: new Date().toISOString().slice(0, 10),
  weightLogs: [],
  profile: isSupabaseMode ? {
    id: '',
    userId: '',
    name: '',
    email: '',
    goal: 'lose_weight',
    activityLevel: 'medium',
    dailyCalorieGoal: 2000,
    proteinGoalG: 120,
    fatGoalG: 60,
    carbsGoalG: 220
  } : mockProfile,
  meals: mockMeals,
  analysisDraft: null,
  subscription: freeSubscriptionState({ provider: isSupabaseMode ? 'manual' : 'demo' }),
  hasOnboarded: false,
  initializeAuth: async () => {
    if (!isSupabaseMode) {
      set({ authStatus: 'authenticated', authUser: mockUser, authError: null });
      return;
    }

    set({ authStatus: 'loading', authError: null });

    try {
      const user = await authService.getCurrentUser();

      if (!user) {
        set({ authStatus: 'unauthenticated', authUser: null, subscription: freeSubscriptionState(), subscriptionStatus: 'ready', subscriptionError: null });
        return;
      }

      const backendProfile = await profileService.getProfile(user.id).catch(() => null);
      const backendMeals = await mealsService.getMeals(user.id).catch(() => null);
      const backendSubscription = await subscriptionService.getSubscription(user.id).catch(() => null);

      set({
        authStatus: 'authenticated',
        authUser: { id: user.id, email: user.email },
        profile: backendProfile ?? profileFromAuthUser(user),
        meals: backendMeals ?? [],
        mealsStatus: backendMeals ? 'ready' : 'error',
        mealsError: backendMeals ? null : 'Nie udało się pobrać historii posiłków.',
        subscription: backendSubscription ?? freeSubscriptionState(),
        subscriptionStatus: 'ready',
        subscriptionError: null,
        hasOnboarded: Boolean(backendProfile?.age),
        authError: null
      });
      try { await revenueCatService.login(user.id, user.email); } catch(e) { console.warn('RC error:', e); }
    } catch (error) {
      set({
        authStatus: 'unauthenticated',
        authUser: null,
        authError: translateError(error, 'Nie udało się pobrać sesji.')
      });
    }
  },
  registerWithEmail: async ({ name, email, password }) => {
    if (!isSupabaseMode) {
      set((state) => ({
        authStatus: 'authenticated',
        authUser: { id: state.profile.userId, email },
        profile: { ...state.profile, name, email },
        hasOnboarded: true,
        authError: null
      }));
      return true;
    }

    set({ authStatus: 'loading', authError: null });

    try {
      const user = await authService.register({ name, email, password });

      if (!user) {
        set({ authStatus: 'unauthenticated', authError: 'Sprawdź skrzynkę e-mail, aby potwierdzić konto.' });
        return false;
      }

      set({
        authStatus: 'authenticated',
        authUser: { id: user.id, email: user.email },
        profile: profileFromAuthUser(user),
        meals: [],
        mealsStatus: 'ready',
        subscription: freeSubscriptionState(),
        subscriptionStatus: 'ready',
        hasOnboarded: true,
        authError: null
      });

      try { await revenueCatService.login(user.id, user.email); } catch(e) { console.warn('RC error:', e); }

      // Force refresh RevenueCat status to ensure UI is in sync
      const rcState = await revenueCatService.checkSubscriptionStatus(user.id);
      if (rcState) {
        if (rcState.status === 'active' && !isSupabaseMode) {
          set({ subscription: { ...rcState, analysesUsed: get().subscription.analysesUsed, usageMonth: get().subscription.usageMonth } });
        } else if (rcState.status === 'expired' && get().subscription.tier === 'premium') {
          const currentSub = get().subscription;
          if (isSupabaseMode && supabase) {
            await subscriptionService.setSubscriptionTier(user.id, 'free').catch(console.warn);
          }
          set({ subscription: { ...rcState, analysesUsed: currentSub.analysesUsed, usageMonth: currentSub.usageMonth } });
        }
      }

      return true;
    } catch (error) {
      set({
        authStatus: 'unauthenticated',
        authError: translateError(error, 'Nie udało się utworzyć konta.')
      });
      return false;
    }
  },
  loginWithEmail: async ({ email, password }) => {
    if (!isSupabaseMode) {
      set((state) => ({
        authStatus: 'authenticated',
        authUser: { id: state.profile.userId, email },
        profile: { ...state.profile, email },
        hasOnboarded: true,
        authError: null
      }));
      return true;
    }

    set({ authStatus: 'loading', authError: null });

    try {
      const user = await authService.login({ email, password });
      const backendProfile = user ? await profileService.getProfile(user.id).catch(() => null) : null;
      const backendMeals = user ? await mealsService.getMeals(user.id).catch(() => null) : null;
      const backendSubscription = user ? await subscriptionService.getSubscription(user.id).catch(() => null) : null;

      set({
        authStatus: user ? 'authenticated' : 'unauthenticated',
        authUser: user ? { id: user.id, email: user.email } : null,
        profile: user ? backendProfile ?? profileFromAuthUser(user) : get().profile,
        meals: user ? backendMeals ?? [] : get().meals,
        mealsStatus: user ? backendMeals ? 'ready' : 'error' : get().mealsStatus,
        mealsError: user && !backendMeals ? 'Nie udało się pobrać historii posiłków.' : null,
        subscription: backendSubscription ?? freeSubscriptionState(),
        subscriptionStatus: 'ready',
        subscriptionError: null,
        authError: null
      });

      if (user) {
        try { await revenueCatService.login(user.id, user.email); } catch(e) { console.warn('RC error:', e); }
        // Force refresh RevenueCat status to ensure UI is in sync
        const rcState = await revenueCatService.checkSubscriptionStatus(user.id);
        if (rcState) {
          if (rcState.status === 'active' && !isSupabaseMode) {
            set({ subscription: { ...rcState, analysesUsed: get().subscription.analysesUsed, usageMonth: get().subscription.usageMonth } });
          } else if (rcState.status === 'expired' && get().subscription.tier === 'premium') {
            const currentSub = get().subscription;
            if (isSupabaseMode && supabase) {
              await subscriptionService.setSubscriptionTier(user.id, 'free').catch(console.warn);
            }
            set({ subscription: { ...rcState, analysesUsed: currentSub.analysesUsed, usageMonth: currentSub.usageMonth } });
          }
        }
      }

      return Boolean(user);
    } catch (error) {
      set({
        authStatus: 'unauthenticated',
        authError: translateError(error, 'Nie udało się zalogować.')
      });
      return false;
    }
  },
  loginWithProvider: async (provider) => {
    if (!isSupabaseMode) {
      set({ authStatus: 'authenticated', authUser: mockUser, hasOnboarded: true, authError: null });
      return true;
    }

    set({ authStatus: 'loading', authError: null });

    try {
      const user = await authService.loginWithProvider(provider);

      if (!user) {
        set({ authStatus: 'unauthenticated' });
        return false;
      }

      const backendProfile = await profileService.getProfile(user.id).catch(() => null);
      const backendMeals = await mealsService.getMeals(user.id).catch(() => null);
      const backendSubscription = await subscriptionService.getSubscription(user.id).catch(() => null);

      set({
        authStatus: 'authenticated',
        authUser: { id: user.id, email: user.email },
        profile: backendProfile ?? profileFromAuthUser(user),
        meals: backendMeals ?? [],
        mealsStatus: backendMeals ? 'ready' : 'error',
        mealsError: backendMeals ? null : 'Nie udało się pobrać historii posiłków.',
        subscription: backendSubscription ?? freeSubscriptionState(),
        subscriptionStatus: 'ready',
        subscriptionError: null,
        hasOnboarded: Boolean(backendProfile?.age),
        authError: null
      });

      try { await revenueCatService.login(user.id, user.email); } catch(e) { console.warn('RC error:', e); }

      // Force refresh RevenueCat status to ensure UI is in sync
      const rcState = await revenueCatService.checkSubscriptionStatus(user.id);
      if (rcState) {
        if (rcState.status === 'active' && !isSupabaseMode) {
          set({ subscription: { ...rcState, analysesUsed: get().subscription.analysesUsed, usageMonth: get().subscription.usageMonth } });
        } else if (rcState.status === 'expired' && get().subscription.tier === 'premium') {
          const currentSub = get().subscription;
          if (isSupabaseMode && supabase) {
            await subscriptionService.setSubscriptionTier(user.id, 'free').catch(console.warn);
          }
          set({ subscription: { ...rcState, analysesUsed: currentSub.analysesUsed, usageMonth: currentSub.usageMonth } });
        }
      }

      return true;
    } catch (error) {
      set({
        authStatus: 'unauthenticated',
        authError: translateError(error, `Nie udało się zalogować przez ${provider}.`)
      });
      return false;
    }
  },
  logout: async () => {
    set({
      authStatus: 'unauthenticated',
      authError: null
    });

    if (isSupabaseMode && supabase) {
      try {
        await authService.logout();
        await revenueCatService.logout();
      } catch (error) {
        set({ authError: translateError(error, 'Nie udało się wylogować.') });
      }
    }

    set({
      authStatus: isSupabaseMode ? 'unauthenticated' : 'authenticated',
      authUser: isSupabaseMode ? null : mockUser,
      meals: isSupabaseMode ? [] : mockMeals,
      mealsStatus: 'ready',
      mealsError: null,
      subscription: freeSubscriptionState({ provider: isSupabaseMode ? 'manual' : 'demo' }),
      subscriptionStatus: 'ready',
      subscriptionError: null,
      analysisDraft: null,
      authError: null
    });
  },
  loadMeals: async () => {},
  fetchMeals: async () => {
    if (!isSupabaseMode) {
      set({ mealsStatus: 'ready', mealsError: null });
      return;
    }

    const userId = get().authUser?.id;

    if (!userId) {
      set({ meals: [], mealsStatus: 'ready', mealsError: null });
      return;
    }

    set({ mealsStatus: 'loading', mealsError: null });

    try {
      const meals = await mealsService.getMeals(userId);
      set({ meals, mealsStatus: 'ready', mealsError: null });
    } catch (error) {
      set({
        mealsStatus: 'error',
        mealsError: error instanceof Error ? error.message : 'Nie udało się pobrać historii posiłków.'
      });
    }
  },
  loadSubscription: async () => {
    if (!isSupabaseMode) return;

    const userId = get().authUser?.id;
    if (!userId) return;

    set({ subscriptionStatus: 'loading', subscriptionError: null });

    try {
      const subscription = await subscriptionService.getSubscription(userId);
      set({ subscription: subscription ?? freeSubscriptionState(), subscriptionStatus: 'ready', subscriptionError: null });
    } catch (error) {
      set({
        subscription: freeSubscriptionState(),
        subscriptionStatus: 'error',
        subscriptionError: error instanceof Error ? error.message : 'Nie udało się pobrać subskrypcji.'
      });
    }
  },
  refreshBackendData: async () => {
    if (!isSupabaseMode) return;

    await Promise.all([get().loadMeals(), get().loadSubscription()]);
  },
  setLanguage: async (language, markSelected = true) => {
    await changeAppLanguage(language);
    set((state) => {
      const metricLangs = ['pl', 'de', 'es', 'fr', 'it', 'pt', 'uk'];
      const imperialLangs = ['en']; // 'en' might be ambiguous (UK/US vs AU/CA) but let's leave it as is or base it on region.
      // If user explicitly picks a language that is almost exclusively metric, force metric.
      const newUnitSystem = metricLangs.includes(language) ? 'metric' : state.unitSystem;
      return { language, languageSelected: markSelected ? true : state.languageSelected, unitSystem: newUnitSystem };
    });
  },
  setUnitSystem: (system) => set({ unitSystem: system }),
  toggleNotifications: async (enabled) => {
    if (enabled) {
      const success = await notificationsService.scheduleDailyReminders();
      if (success) set({ notificationsEnabled: true });
    } else {
      await notificationsService.cancelAllReminders();
      set({ notificationsEnabled: false });
    }
  },
  setHasOnboarded: (value) => set({ hasOnboarded: value }),

  addWater: () => {
    set((state) => {
      const today = getLocalISODate();
      const isToday = state.waterIntake.date === today;
      return {
        waterIntake: {
          date: today,
          glasses: isToday ? Math.min(state.waterIntake.glasses + 1, 10) : 1
        }
      };
    });
  },

  removeWater: () => {
    set((state) => {
      const today = getLocalISODate();
      const isToday = state.waterIntake.date === today;
      return {
        waterIntake: {
          date: today,
          glasses: isToday ? Math.max(state.waterIntake.glasses - 1, 0) : 0
        }
      };
    });
  },

  setCurrentDate: (date) => set({ currentDate: date }),

  logWeight: (weight) => {
    const today = new Date().toISOString().slice(0, 10);
    const id = Date.now().toString();
    set((state) => {
      // Remove any existing log for today to keep 1 log per day
      const filtered = state.weightLogs.filter((log) => log.date !== today);
      return {
        weightLogs: [...filtered, { id, date: today, weightKg: weight }].sort((a, b) => a.date.localeCompare(b.date))
      };
    });
  },

  deleteWeightLog: (id) => {
    set((state) => ({ weightLogs: state.weightLogs.filter((log) => log.id !== id) }));
  },

  updateProfile: async (updates) => {
    set((state) => ({ profile: { ...state.profile, ...updates } as UserProfile }));

    if (!isSupabaseMode) return true;

    try {
      const savedProfile = await profileService.saveProfile(updates as UserProfile);
      set({ profile: savedProfile, authError: null });
      return true;
    } catch (error) {
      set({ authError: error instanceof Error ? error.message : 'Nie udało się zapisać profilu.' });
      return false;
    }
  },
  saveMeal: async (meal) => {
    if (!isSupabaseMode) {
      set((state) => ({ meals: [meal, ...state.meals] }));
      return meal;
    }

    try {
      const savedMeal = await mealsService.saveMeal(meal);
      set((state) => ({ meals: [savedMeal, ...state.meals.filter((item) => item.id !== savedMeal.id)], mealsError: null, mealsStatus: 'ready' }));
      return savedMeal;
    } catch (error) {
      set({ mealsStatus: 'error', mealsError: error instanceof Error ? error.message : 'Nie udało się zapisać posiłku.' });
      return null;
    }
  },
  updateMeal: async (meal) => {
    if (!isSupabaseMode) {
      set((state) => ({
        meals: state.meals.map((item) => item.id === meal.id ? meal : item),
        analysisDraft: state.analysisDraft?.id === meal.id ? meal : state.analysisDraft
      }));
      return meal;
    }

    if (!get().meals.some((item) => item.id === meal.id)) {
      set((state) => ({ analysisDraft: state.analysisDraft?.id === meal.id ? meal : state.analysisDraft }));
      return meal;
    }

    try {
      const savedMeal = await mealsService.updateMeal(meal);
      set((state) => ({
        meals: state.meals.map((item) => item.id === savedMeal.id ? savedMeal : item),
        analysisDraft: state.analysisDraft?.id === savedMeal.id ? savedMeal : state.analysisDraft,
        mealsError: null,
        mealsStatus: 'ready'
      }));
      return savedMeal;
    } catch (error) {
      set({ mealsStatus: 'error', mealsError: error instanceof Error ? error.message : 'Nie udało się zaktualizować posiłku.' });
      return null;
    }
  },
  updateMealNutrition: async (id, nutrition, portion) => {
    const state = get();
    const update = (meal: Meal) => meal.id === id ? { ...meal, ...nutrition, updatedAt: new Date().toISOString(), items: meal.items.map((item) => ({
      ...item,
      estimatedWeightG: item.estimatedWeightG ? Math.round(item.estimatedWeightG * portion) : undefined,
      estimatedCalories: Math.round(item.estimatedCalories * portion),
      proteinG: Math.round(item.proteinG * portion),
      fatG: Math.round(item.fatG * portion),
      carbsG: Math.round(item.carbsG * portion)
    })) } : meal;
    const currentMeal = state.meals.find((meal) => meal.id === id) ?? (state.analysisDraft?.id === id ? state.analysisDraft : null);
    if (!currentMeal) return null;
    const updatedMeal = update(currentMeal);

    set((current) => ({
      meals: current.meals.map(update),
      analysisDraft: current.analysisDraft ? update(current.analysisDraft) : null
    }));

    if (isSupabaseMode && state.meals.some((meal) => meal.id === id)) {
      return get().updateMeal(updatedMeal);
    }

    return updatedMeal;
  },
  deleteMeal: async (id) => {
    const previousMeals = get().meals;
    set((state) => ({ meals: state.meals.filter((meal) => meal.id !== id) }));

    if (!isSupabaseMode) return;

    try {
      await mealsService.deleteMeal(id);
      set({ mealsError: null, mealsStatus: 'ready' });
    } catch (error) {
      set({
        meals: previousMeals,
        mealsStatus: 'error',
        mealsError: error instanceof Error ? error.message : 'Nie udało się usunąć posiłku.'
      });
    }
  },
  analyzePhoto: async (photoUri) => {
    const state = get();
    const currentMonth = getCurrentMonth();
    const currentUsage = state.subscription.usageMonth === currentMonth ? state.subscription.analysesUsed : 0;
    const monthlyLimit = state.subscription.monthlyLimit ?? (state.subscription.tier === 'premium' ? PREMIUM_ANALYSIS_LIMIT : FREE_ANALYSIS_LIMIT);
    if (currentUsage >= monthlyLimit) return null;
    const userId = state.authUser?.id ?? state.profile.userId;
    let uploadedPhotoUrl = photoUri;

    if ((aiAnalysisMode === 'supabase' || aiAnalysisMode === 'edge') && photoUri && userId) {
      if (isSupabaseMode && supabase) {
        uploadedPhotoUrl = await storageService.uploadMealPhoto(userId, photoUri);
      } else {
        const FileSystem = require('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: FileSystem.EncodingType.Base64 });
        uploadedPhotoUrl = `data:image/jpeg;base64,${base64}`;
      }
    }

    let analysis: Meal;

    try {
      analysis = (aiAnalysisMode === 'supabase' || aiAnalysisMode === 'edge')
        ? await aiAnalysisService.analyzeMealPhoto({ photoUri: photoUri ?? '', photoUrl: uploadedPhotoUrl, userId, locale: state.language })
        : await mockAiService.analyze(photoUri, state.language);
    } catch (error) {
      if (error instanceof Error && error.message === 'limit_exceeded') {
        await get().loadSubscription();
        return null;
      }

      throw error;
    }

    const draft = isSupabaseMode ? normalizeMealForUser(analysis, userId, uploadedPhotoUrl) : analysis;
    const backendSubscription = isSupabaseMode ? await subscriptionService.getSubscription(userId).catch(() => null) : null;

    set({
      analysisDraft: draft,
      subscription: backendSubscription ?? freeSubscriptionState({ analysesUsed: currentUsage + 1, usageMonth: currentMonth })
    });
    return draft;
  },
  analyzeText: async (text) => {
    const state = get();
    const currentMonth = getCurrentMonth();
    const currentUsage = state.subscription.usageMonth === currentMonth ? state.subscription.analysesUsed : 0;
    const monthlyLimit = state.subscription.monthlyLimit ?? FREE_ANALYSIS_LIMIT;
    if (state.subscription.tier === 'free' && currentUsage >= monthlyLimit) {
      throw new Error('limit_exceeded');
    }
    const userId = state.authUser?.id ?? state.profile.userId;

    let result: Meal;

    try {
      result = (aiAnalysisMode === 'supabase' || aiAnalysisMode === 'edge')
        ? await aiAnalysisService.analyzeMealText({ text, userId, locale: state.language })
        : await mockAiService.analyzeText(text, state.language);
    } catch (error) {
      if (error instanceof Error && error.message === 'limit_exceeded') {
        await get().loadSubscription();
        throw error;
      }
      throw error;
    }

    const backendSubscription = isSupabaseMode ? await subscriptionService.getSubscription(userId).catch(() => null) : null;

    set({
      subscription: backendSubscription ?? freeSubscriptionState({ analysesUsed: state.subscription.tier === 'free' ? currentUsage + 1 : currentUsage, usageMonth: currentMonth })
    });

    return result;
  },
  setAnalysisDraft: (meal) => set({ analysisDraft: meal }),
  saveAnalysisDraft: async () => {
    const draft = get().analysisDraft;
    if (!draft) return null;
    const savedMeal = await get().saveMeal(draft);
    if (savedMeal) set({ analysisDraft: null });
    return savedMeal;
  },
  clearAnalysisDraft: () => set({ analysisDraft: null }),
  setSubscriptionTier: async (tier) => {
    const userId = get().authUser?.id ?? get().profile.userId;

    if (!isSupabaseMode) {
      set((state) => ({ subscription: { ...state.subscription, tier, monthlyLimit: tier === 'premium' ? PREMIUM_ANALYSIS_LIMIT : FREE_ANALYSIS_LIMIT, status: tier === 'premium' ? 'active' : 'inactive', provider: 'demo' } }));
      return;
    }

    set({ subscriptionStatus: 'loading', subscriptionError: null });

    try {
      const subscription = await subscriptionService.setSubscriptionTier(userId, tier);
      set({ subscription, subscriptionStatus: 'ready', subscriptionError: null });
    } catch (error) {
      set({ subscriptionStatus: 'error', subscriptionError: error instanceof Error ? error.message : 'Nie udało się zmienić subskrypcji.' });
    }
  },
  purchasePackage: async (pkg) => {
    set({ subscriptionStatus: 'loading', subscriptionError: null });
    const authUserId = get().authUser?.id;
    if (isSupabaseMode && !authUserId) {
      set({ subscriptionStatus: 'error', subscriptionError: 'Zaloguj się, aby zarządzać subskrypcją.' });
      return false;
    }

    const currentUserId = authUserId ?? get().profile.userId;
    const result = await revenueCatService.purchasePackage(pkg, currentUserId);

    if (!result.success || !result.subscription) {
      set({ subscriptionStatus: 'error', subscriptionError: result.error ?? 'Nie udało się aktywować subskrypcji.' });
      return false;
    }

    if (isSupabaseMode && supabase) {
      const existingSub = await waitForConfirmedPremium(currentUserId, { syncRevenueCat: true });
      if (!existingSub) {
        set({
          subscription: freeSubscriptionState(),
          subscriptionStatus: 'error',
          subscriptionError: 'Płatność przeszła, ale RevenueCat jeszcze nie potwierdził jej w bazie. Otwórz ten ekran za chwilę albo użyj Przywróć zakup.'
        });
        return false;
      }

      // Premium w bazie nadaje wyłącznie RevenueCat webhook. Klient aktualizuje tylko lokalny UI.
      set({ subscription: preserveSubscriptionUsage(result.subscription, existingSub), subscriptionStatus: 'ready', subscriptionError: null });
      return true;
    }

    set({ subscription: result.subscription, subscriptionStatus: 'ready', subscriptionError: null });
    return true;
  },
  purchasePremium: async (plan = 'monthly') => {
    set({ subscriptionStatus: 'loading', subscriptionError: null });
    const authUserId = get().authUser?.id;
    if (isSupabaseMode && !authUserId) {
      set({ subscriptionStatus: 'error', subscriptionError: 'Zaloguj się, aby zarządzać subskrypcją.' });
      return false;
    }

    const currentUserId = authUserId ?? get().profile.userId;
    const result = await revenueCatService.purchasePremium(plan, currentUserId);

    if (!result.success || !result.subscription) {
      set({ subscriptionStatus: 'error', subscriptionError: result.message ?? result.error ?? 'Nie udało się aktywować Premium.' });
      return false;
    }

    if (isSupabaseMode && supabase) {
      const existingSub = await waitForConfirmedPremium(currentUserId, { syncRevenueCat: true });
      if (!existingSub) {
        set({
          subscription: freeSubscriptionState(),
          subscriptionStatus: 'error',
          subscriptionError: 'Płatność przeszła, ale RevenueCat jeszcze nie potwierdził jej w bazie. Otwórz ten ekran za chwilę albo użyj Przywróć zakup.'
        });
        return false;
      }

      // Premium w bazie nadaje wyłącznie RevenueCat webhook. Klient aktualizuje tylko lokalny UI.
      set({ subscription: preserveSubscriptionUsage(result.subscription, existingSub), subscriptionStatus: 'ready', subscriptionError: null });
      return true;
    }

    set({ subscription: result.subscription, subscriptionStatus: 'ready', subscriptionError: null });
    return true;
  },
  restorePurchases: async () => {
    set({ subscriptionStatus: 'loading', subscriptionError: null });
    const authUserId = get().authUser?.id;
    if (isSupabaseMode && !authUserId) {
      set({ subscriptionStatus: 'error', subscriptionError: 'Zaloguj się, aby przywrócić subskrypcję.' });
      return false;
    }

    const currentUserId = authUserId ?? get().profile.userId;
    const result = await revenueCatService.restorePurchases(currentUserId);

    if (result.subscription?.status === 'expired') {
      if (isSupabaseMode && supabase) {
        await subscriptionService.setSubscriptionTier(currentUserId, 'free').catch(() => null);
      }
      set({ 
        subscription: { ...get().subscription, tier: 'free', status: 'inactive' },
        subscriptionStatus: 'error', 
        subscriptionError: result.error ?? 'Twoja subskrypcja wygasła.' 
      });
      return false;
    }

    if (!result.success || !result.subscription) {
      set({ subscriptionStatus: 'error', subscriptionError: result.error ?? result.message ?? 'Nie udało się przywrócić zakupów.' });
      return false;
    }

    if (isSupabaseMode && supabase) {
      // Pobieramy istniejącą subskrypcję, żeby zachować analyses_used i usage_month
      const existingSub = await waitForConfirmedPremium(currentUserId, { syncRevenueCat: true, attempts: 15, intervalMs: 2000 });
      if (!existingSub) {
        set({
          subscription: freeSubscriptionState(),
          subscriptionStatus: 'error',
          subscriptionError: 'Ta subskrypcja nie jest przypisana do tego konta.'
        });
        return false;
      }

      // Premium w bazie nadaje wyłącznie RevenueCat webhook. Klient aktualizuje tylko lokalny UI.
      set({ subscription: preserveSubscriptionUsage(result.subscription, existingSub), subscriptionStatus: 'ready', subscriptionError: null });
      return true;
    }

    set({ subscription: result.subscription, subscriptionStatus: 'ready', subscriptionError: null });
    return true;
  },
  hasAnalysisAvailable: () => {
    const state = get();
    const limit = state.subscription.tier === 'premium' ? PREMIUM_ANALYSIS_LIMIT : FREE_ANALYSIS_LIMIT;
    return state.subscription.usageMonth !== getCurrentMonth() || state.subscription.analysesUsed < (state.subscription.monthlyLimit ?? limit);
  },
  getAnalysesUsed: () => {
    const state = get();
    return state.subscription.usageMonth === getCurrentMonth() ? state.subscription.analysesUsed : 0;
  },
  clearAuthError: () => set({ authError: null }),

  resetData: async () => {
    try {
      const { authUser } = get();
      if (!authUser) return false;

      if (isSupabaseMode && supabase) {
        const { error } = await supabase.from('meals').delete().eq('user_id', authUser.id);
        if (error) throw error;
      }

      set({ meals: [], analysisDraft: null });
      return true;
    } catch (err) {
      console.error('Error resetting data:', err);
      return false;
    }
  },

  deleteAccount: async () => {
    try {
      const { authUser, logout } = get();
      if (!authUser) return false;

      if (isSupabaseMode && supabase) {
        const { error } = await supabase.rpc('delete_user');
        if (error) {
          console.error('Błąd usuwania konta:', error);
          return false;
        }
      }

      await logout();
      return true;
    } catch (err) {
      console.error('Error deleting account:', err);
      return false;
    }
  }
}), {
  name: 'nutora-app',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    language: state.language,
    languageSelected: state.languageSelected,
    unitSystem: state.unitSystem,
    notificationsEnabled: state.notificationsEnabled,
    hasOnboarded: state.hasOnboarded,
    profile: state.profile,
    subscription: state.subscription,
    waterIntake: state.waterIntake,
    weightLogs: state.weightLogs
  })
}));
