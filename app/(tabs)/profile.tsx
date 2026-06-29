import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Screen } from '@/src/components/ui';
import { isSupabaseMode } from '@/src/config/env';
import { colors, radius } from '@/src/constants/theme';
import { getLanguageMeta, SUPPORTED_LANGUAGES } from '@/src/i18n';
import { useAppStore } from '@/src/store/app-store';
import { weightFromKg, weightUnit } from '@/src/utils/units';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [languagesExpanded, setLanguagesExpanded] = useState(false);
  const profile = useAppStore((state) => state.profile);
  const weightLogs = useAppStore((state) => state.weightLogs);
  const subscription = useAppStore((state) => state.subscription);
  const logout = useAppStore((state) => state.logout);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const unitSystem = useAppStore((state) => state.unitSystem);
  const wUnit = weightUnit(unitSystem);
  const rows = [
    { label: t('profile.myGoals'), icon: 'flag-outline', route: '/profile-setup' },
    { label: t('profile.progressStats'), icon: 'bar-chart-outline', route: '/progress' },
    { label: t('profile.accountSettings'), icon: 'settings-outline', route: '/account-settings' },
    { label: t('profile.help'), icon: 'help-circle-outline', route: '/help-contact' }
  ] as const;

  const signOut = async () => {
    await logout();
    router.replace('/');
  };

  return <Screen>
    <Text style={styles.title}>{t('profile.title')}</Text>
    <View style={styles.profileCard}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{profile.name[0]}</Text></View>
      <View style={styles.profileCopy}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        <Text style={styles.mode}>{isSupabaseMode ? t('profile.supabaseAccount') : t('profile.demoMode')}</Text>
      </View>
      <Pressable onPress={() => router.push('/profile-setup')}><Ionicons name="create-outline" size={21} color={colors.primary} /></Pressable>
    </View>
    <Text style={styles.section}>{t('profile.goals')}</Text>
    <View style={styles.goals}>
      <Goal icon="flame-outline" label={t('profile.dailyGoal')} value={`${profile.dailyCalorieGoal} ${t('common.kcal')}`} />
      <View style={styles.goalSeparator} />
      <Pressable onPress={() => router.push('/weight-tracker' as never)} style={{ flex: 1 }}>
        <Goal icon="scale-outline" label={t('profile.currentWeight')} value={`${weightLogs.length ? weightFromKg(weightLogs[weightLogs.length - 1].weightKg, unitSystem) : (profile.weightKg ? weightFromKg(profile.weightKg, unitSystem) : '-')} ${wUnit}`} />
      </Pressable>
    </View>
    <Text style={styles.section}>{t('profile.subscription')}</Text>
    <Pressable onPress={() => router.push('/subscription')} style={styles.premium}>
      <View style={styles.premiumIcon}><Ionicons name="sparkles" size={21} color="#fff" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.premiumTitle}>Nutora {subscription.tier === 'premium' ? t('profile.premiumPlan') : t('profile.freePlan')}</Text>
        <Text style={styles.premiumText}>{subscription.tier === 'premium' ? (subscription.expiresAt ? `${t('profile.unlimitedActive')} (do: ${new Date(subscription.expiresAt).toLocaleDateString('pl-PL')})` : t('profile.unlimitedActive')) : t('profile.monthlyUsage', { used: subscription.analysesUsed, limit: subscription.monthlyLimit ?? 5 })}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </Pressable>
    <Text style={styles.section}>{t('profile.language')}</Text>
    <Text style={styles.languageHint}>{t('profile.languageHint')}</Text>
    <View style={styles.languageList}>
      <LanguageRow item={getLanguageMeta(language)} selected onPress={() => setLanguagesExpanded((value) => !value)} />
      <Pressable onPress={() => setLanguagesExpanded((value) => !value)} style={styles.languageToggle}>
        <Text style={styles.languageToggleText}>{languagesExpanded ? t('language.hideList') : t('language.chooseOther')}</Text>
        <Ionicons name={languagesExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
      </Pressable>
      {languagesExpanded && SUPPORTED_LANGUAGES.filter((item) => item.code !== language).map((item) => (
        <LanguageRow key={item.code} item={item} onPress={() => { void setLanguage(item.code); setLanguagesExpanded(false); }} />
      ))}
    </View>
    <Text style={styles.section}>{t('profile.account')}</Text>
    <View style={styles.list}>{rows.map((row) => <Pressable key={row.label} onPress={() => row.route && router.push(row.route)} style={styles.listRow}>
      <View style={styles.listIcon}><Ionicons name={row.icon} size={20} color={colors.primary} /></View>
      <Text style={styles.listLabel}>{row.label}</Text>
      <Ionicons name="chevron-forward" size={19} color="#A5ADA4" />
    </Pressable>)}</View>
    <Button title={t('profile.logout')} variant="ghost" onPress={signOut} />
    <Text 
      onPress={() => {
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
          AsyncStorage.clear().then(() => {
            alert('Pamięć wyczyszczona! Zresetuj aplikację (np. wpisz "r" w konsoli) aby przejść ponownie przez ekrany powitalne.');
          });
        });
      }} 
      style={{ color: 'red', textAlign: 'center', marginTop: 20, marginBottom: 40, fontWeight: 'bold' }}
    >
      🧹 WYCZYŚĆ DANE I CACHE (DEV)
    </Text>
  </Screen>;
}

function Goal({ icon, label, value }: { icon: 'flame-outline' | 'scale-outline'; label: string; value: string }) {
  return <View style={styles.goal}><Ionicons name={icon} size={19} color={colors.primary} /><Text style={styles.goalLabel}>{label}</Text><Text style={styles.goalValue}>{value}</Text></View>;
}

function LanguageRow({ item, selected = false, onPress }: { item: ReturnType<typeof getLanguageMeta>; selected?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.languageRow, selected && styles.languageRowSelected]}>
    <Text style={styles.languageFlag}>{item.flag}</Text>
    <View style={{ flex: 1 }}>
      <Text style={[styles.languageName, selected && styles.languageNameSelected]}>{item.nativeName}</Text>
      <Text style={styles.languageSub}>{item.englishName}</Text>
    </View>
    {selected ? <Ionicons name="checkmark-circle" size={21} color={colors.primary} /> : <Ionicons name="chevron-forward" size={18} color="#A5ADA4" />}
  </Pressable>;
}

const styles = StyleSheet.create({
  title: { paddingTop: 18, color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -.8 },
  profileCard: { marginTop: 22, padding: 16, borderRadius: radius.lg, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.primary, fontSize: 23, fontWeight: '800' },
  profileCopy: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  email: { fontSize: 12, color: colors.muted, marginTop: 3 },
  mode: { fontSize: 11, color: colors.primary, marginTop: 4, fontWeight: '700' },
  section: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 26, marginBottom: 10 },
  goals: { flexDirection: 'row', alignItems: 'stretch', padding: 15, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  goal: { flex: 1, gap: 5 },
  goalLabel: { color: colors.muted, fontSize: 11, marginTop: 1 },
  goalValue: { color: colors.text, fontSize: 17, fontWeight: '800' },
  goalSeparator: { width: 1, backgroundColor: colors.line, marginHorizontal: 12 },
  premium: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.md, backgroundColor: colors.primary },
  premiumIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF27', alignItems: 'center', justifyContent: 'center' },
  premiumTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  premiumText: { color: '#E0F6C9', fontSize: 11, marginTop: 3 },
  languageHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: -4, marginBottom: 10 },
  languageList: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  languageRow: { minHeight: 54, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
  languageRowSelected: { backgroundColor: '#F4FAEF' },
  languageToggle: { minHeight: 44, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderBottomWidth: 1, borderBottomColor: colors.line },
  languageToggleText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  languageFlag: { fontSize: 22 },
  languageName: { color: colors.text, fontSize: 14, fontWeight: '900' },
  languageNameSelected: { color: colors.primary },
  languageSub: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  listRow: { paddingVertical: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  listIcon: { width: 33, height: 33, backgroundColor: colors.primarySoft, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  listLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' }
});
