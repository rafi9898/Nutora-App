import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getSupabaseClient } from '@/src/lib/supabase';

export default function AuthCallbackScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) {
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        
        // 1. PKCE flow (code w zapytaniu, nowy standard Supabase)
        const parsedUrl = Linking.parse(url);
        const code = parsedUrl.queryParams?.code;
        if (code && typeof code === 'string') {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            const { useAppStore } = require('@/src/store/app-store');
            await useAppStore.getState().initializeAuth();
          }
        }
        
        // 2. Starszy Implicit flow (hash we fragmencie)
        if (url.includes('access_token=')) {
          const hashMatch = url.split('#')[1];
          if (hashMatch) {
            const params = new URLSearchParams(hashMatch);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              const { useAppStore } = require('@/src/store/app-store');
              await useAppStore.getState().initializeAuth();
              
              if (url.includes('type=recovery')) {
                setTimeout(() => router.replace('/update-password'), 500);
                return;
              }
            }
          }
        }
      } catch (e) {
        console.error('Błąd parsowania linku odzyskiwania', e);
      }
      
      setLoading(false);
    };

    Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href="/(tabs)/home" />;
}
