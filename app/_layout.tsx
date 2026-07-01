import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import '@/src/i18n';
import { useAppStore } from '@/src/store/app-store';

import { revenueCatService, mapCustomerInfoToSubscriptionState } from '@/src/services/payments/revenuecat-service';
import { getSupabaseClient, isSupabaseConfigured } from '@/src/lib/supabase';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import Purchases from 'react-native-purchases';

export default function RootLayout() {
  const initializeAuth = useAppStore((state) => state.initializeAuth);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  useEffect(() => {
    const init = async () => {
      // 1. Najpierw pobieramy profil z Supabase (JEDYNE źródło prawdy o subskrypcji)
      await initializeAuth();
      
      // 2. Następnie konfigurujemy RevenueCat i logujemy usera, żeby nie był anonimowy
      await revenueCatService.configure();
      const authUser = useAppStore.getState().authUser;
      if (authUser?.id) {
        await revenueCatService.login(authUser.id);
      }
      
      // 3. Nasłuchiwacz na zmiany – TYLKO podwyższa status, nigdy nie degraduje
      Purchases.addCustomerInfoUpdateListener((info) => {
        const currentUserId = useAppStore.getState().authUser?.id;
        const subState = mapCustomerInfoToSubscriptionState(info, currentUserId);
        if (subState) {
          // RevenueCat potwierdza premium → aktualizuj lokalny stan (zachowaj zużycie)
          const currentSub = useAppStore.getState().subscription;
          useAppStore.setState({ subscription: { ...subState, analysesUsed: currentSub.analysesUsed, usageMonth: currentSub.usageMonth } });
        }
        // Jeśli RC nie widzi entitlementu → NIE degradujemy!
        // Supabase jest źródłem prawdy. Degradacja tylko przez webhooks serwera.
      });
      
      // 4. Sprawdzenie RC – jeśli wygasło to zbijamy do free, jeśli aktywne to podwyższamy
      const currentUserIdLayout = useAppStore.getState().authUser?.id;
      const finalSubState = await revenueCatService.checkSubscriptionStatus(currentUserIdLayout);
      if (finalSubState) {
        const currentSub = useAppStore.getState().subscription;
        if (finalSubState.status === 'expired' && currentSub.tier === 'premium') {
          // Użytkownik stracił premium w RevenueCat (wygaśnięcie subskrypcji sandbox)
          const userId = useAppStore.getState().authUser?.id;
          if (userId && isSupabaseMode && getSupabaseClient()) {
            await subscriptionService.setSubscriptionTier(userId, 'free').catch(console.warn);
          }
          useAppStore.setState({ subscription: { ...finalSubState, analysesUsed: currentSub.analysesUsed, usageMonth: currentSub.usageMonth } });
        } else if (finalSubState.status === 'active') {
          // Podwyższamy na premium lub aktualizujemy
          useAppStore.setState({ subscription: { ...finalSubState, analysesUsed: currentSub.analysesUsed, usageMonth: currentSub.usageMonth } });
        }
      }
      // Jeśli RC nie widzi entitlementu → nic nie robimy, ufamy Supabase
    };
    
    void init();

    if (isSupabaseConfigured) {
      const supabase = getSupabaseClient();
      
      const handleDeepLink = async (url: string | null) => {
        if (!url) return;
        try {
          const parsed = Linking.parse(url);
          const code = parsed.queryParams?.code;
          if (code && typeof code === 'string') {
            await supabase.auth.exchangeCodeForSession(code);
            await useAppStore.getState().initializeAuth();
          }
          
          if (url.includes('access_token=')) {
            const hashMatch = url.split('#')[1];
            if (hashMatch) {
              const params = new URLSearchParams(hashMatch);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              if (accessToken && refreshToken) {
                await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
                await useAppStore.getState().initializeAuth();
                if (url.includes('type=recovery')) {
                  setTimeout(() => router.replace('/update-password'), 500);
                }
              }
            }
          }
        } catch (e) {
          console.error('Blad linku', e);
        }
      };

      Linking.getInitialURL().then(handleDeepLink);
      const urlSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          router.replace('/update-password');
        }
      });
      return () => {
        urlSub.remove();
        data.subscription.unsubscribe();
      };
    }
  }, [initializeAuth]);

  useEffect(() => {
    void setLanguage(language, false);
  }, [language, setLanguage]);

  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}><Stack.Screen name="index" /><Stack.Screen name="language" /><Stack.Screen name="onboarding" /><Stack.Screen name="login" /><Stack.Screen name="register" /><Stack.Screen name="profile-setup" /><Stack.Screen name="account-settings" /><Stack.Screen name="help-contact" /><Stack.Screen name="manual-meal" /><Stack.Screen name="auth/callback" /><Stack.Screen name="(tabs)" /><Stack.Screen name="analysis/[id]" /><Stack.Screen name="edit-meal/[id]" /><Stack.Screen name="subscription" /></Stack></>;
}
