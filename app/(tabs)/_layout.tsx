import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { isSupabaseMode } from '@/src/config/env';
import { colors } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ outline, active, color, focused }: { outline: 'home-outline' | 'add-circle-outline' | 'bar-chart-outline' | 'person-outline'; active: 'home' | 'add-circle' | 'bar-chart' | 'person'; color: string; focused: boolean }) {
  return <Ionicons name={focused ? active : outline} size={24} color={color} />;
}

function HomeIcon(props: { color: string; focused: boolean }) { return <TabIcon outline="home-outline" active="home" {...props} />; }
function AddIcon(props: { color: string; focused: boolean }) { return <TabIcon outline="add-circle-outline" active="add-circle" {...props} />; }
function HistoryIcon(props: { color: string; focused: boolean }) { return <TabIcon outline="bar-chart-outline" active="bar-chart" {...props} />; }
function ProfileIcon(props: { color: string; focused: boolean }) { return <TabIcon outline="person-outline" active="person" {...props} />; }

export default function TabsLayout() {
  const { t } = useTranslation();
  const authStatus = useAppStore((state) => state.authStatus);
  const language = useAppStore((state) => state.language);
  const insets = useSafeAreaInsets();

  if (isSupabaseMode && (authStatus === 'idle' || authStatus === 'loading')) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (isSupabaseMode && authStatus !== 'authenticated') {
    return <Redirect href="/" />;
  }

  return <Tabs key={language} screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: '#7B837B', tabBarStyle: { height: 60 + insets.bottom, paddingBottom: insets.bottom > 0 ? insets.bottom : 12, paddingTop: 8, borderTopColor: colors.line, backgroundColor: '#fff' }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' } }}>
    <Tabs.Screen name="home" options={{ title: t('tabs.home'), tabBarLabel: t('tabs.home'), tabBarIcon: HomeIcon }} />
    <Tabs.Screen name="camera" options={{ title: t('tabs.add'), tabBarLabel: t('tabs.add'), tabBarIcon: AddIcon }} />
    <Tabs.Screen name="history" options={{ title: t('tabs.history'), tabBarLabel: t('tabs.history'), tabBarIcon: HistoryIcon }} />
    <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarLabel: t('tabs.profile'), tabBarIcon: ProfileIcon }} />
  </Tabs>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }
});
