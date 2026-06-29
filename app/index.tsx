import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { isSupabaseMode } from '@/src/config/env';
import { colors } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';

export default function Index() {
  const authStatus = useAppStore((state) => state.authStatus);
  const hasOnboarded = useAppStore((state) => state.hasOnboarded);
  const languageSelected = useAppStore((state) => state.languageSelected);

  if (!languageSelected) {
    return <Redirect href="/language" />;
  }

  if (isSupabaseMode && (authStatus === 'idle' || authStatus === 'loading')) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (isSupabaseMode && authStatus === 'authenticated') {
    return <Redirect href={hasOnboarded ? '/(tabs)/home' : '/profile-setup'} />;
  }

  if (isSupabaseMode && authStatus === 'unauthenticated') {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={hasOnboarded ? '/(tabs)/home' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }
});
