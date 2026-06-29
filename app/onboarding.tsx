import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Logo, Screen } from '@/src/components/ui';
import { colors, radius, shadows } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const setHasOnboarded = useAppStore((state) => state.setHasOnboarded);

  const begin = () => {
    setHasOnboarded(true);
    router.push('/register');
  };

  return <Screen scroll={false} style={styles.wrap}>
    <View style={styles.header}>
      <Logo />
      <View style={styles.badge}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
        <Text style={styles.badgeText}>AI nutrition coach</Text>
      </View>
    </View>

    <View style={styles.copy}>
      <Text style={styles.title}>{t('onboarding.title')}</Text>
      <Text style={styles.description}>{t('onboarding.description')}</Text>
    </View>

    <View style={styles.hero}>
      <View style={styles.glow} />
      <View style={styles.mealCard}>
        <View style={styles.mealTop}>
          <View style={styles.plate}>
            <Text style={styles.plateEmoji}>🥗</Text>
          </View>
          <View style={styles.mealText}>
            <Text style={styles.mealKicker}>{t('onboarding.heroKicker')}</Text>
            <Text style={styles.mealName}>Lunch bowl</Text>
          </View>
          <View style={styles.score}>
            <Text style={styles.scoreText}>92%</Text>
          </View>
        </View>

        <View style={styles.calorieRow}>
          <View>
            <Text style={styles.calorieValue}>684</Text>
            <Text style={styles.calorieLabel}>{t('onboarding.estimatedCalories')}</Text>
          </View>
          <View style={styles.ring}>
            <View style={styles.ringInner}>
              <Ionicons name="leaf" size={18} color={colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.macros}>
          <MacroPreview label={t('onboarding.protein')} value="45 g" color={colors.primary} />
          <MacroPreview label={t('onboarding.carbs')} value="74 g" color={colors.blue} />
          <MacroPreview label={t('onboarding.fat')} value="18 g" color={colors.orange} />
        </View>
      </View>
      <View style={[styles.floatCard, styles.floatLeft]}>
        <Ionicons name="trending-up" size={16} color={colors.primary} />
        <Text style={styles.floatText}>{t('onboarding.dailyGoal')}</Text>
      </View>
      <View style={[styles.floatCard, styles.floatRight]}>
        <Text style={styles.floatEmoji}>⚡</Text>
        <Text style={styles.floatText}>{t('onboarding.fastAnalysis')}</Text>
      </View>
    </View>

    <View style={styles.bottom}>
      <Text style={styles.heroCaption}>{t('onboarding.caption')}</Text>
      <View style={styles.actions}>
        <Button title={t('onboarding.start')} onPress={begin} />
        <Button title={t('onboarding.login')} variant="ghost" onPress={() => router.push('/login')} />
      </View>
    </View>
  </Screen>;
}

function MacroPreview({ label, value, color }: { label: string; value: string; color: string }) {
  return <View style={styles.macro}>
    <View style={[styles.macroDot, { backgroundColor: color }]} />
    <Text style={styles.macroLabel}>{label}</Text>
    <Text style={styles.macroValue}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'space-between', paddingTop: 26, paddingBottom: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#D9EDCD' },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  copy: { alignItems: 'center', marginTop: 24 },
  title: { fontSize: 39, lineHeight: 45, fontWeight: '900', color: colors.text, textAlign: 'center', letterSpacing: -1.5 },
  description: { color: colors.muted, textAlign: 'center', fontSize: 16, lineHeight: 23, marginTop: 16, fontWeight: '500' },
  hero: { minHeight: 322, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  glow: { position: 'absolute', width: 286, height: 286, borderRadius: 143, backgroundColor: '#DFF2D0', opacity: .72 },
  mealCard: { width: '88%', borderRadius: 32, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 18, ...shadows.card },
  mealTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plate: { width: 64, height: 64, borderRadius: 24, backgroundColor: '#F5FAEF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E3EFD8' },
  plateEmoji: { fontSize: 34 },
  mealText: { flex: 1 },
  mealKicker: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  mealName: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -.5, marginTop: 4 },
  score: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  calorieRow: { marginTop: 21, padding: 16, borderRadius: radius.lg, backgroundColor: colors.backgroundAlt, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calorieValue: { color: colors.text, fontSize: 42, lineHeight: 44, fontWeight: '900', letterSpacing: -1.4 },
  calorieLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  ring: { width: 72, height: 72, borderRadius: 36, borderWidth: 10, borderColor: colors.primary, borderLeftColor: '#CFE9BE', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-20deg' }] },
  ringInner: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '20deg' }] },
  macros: { flexDirection: 'row', gap: 8, marginTop: 12 },
  macro: { flex: 1, minWidth: 0, borderRadius: 16, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line, padding: 10 },
  macroDot: { width: 7, height: 7, borderRadius: 4 },
  macroLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 7 },
  macroValue: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 2 },
  floatCard: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: '#FFFFFFE8', borderWidth: 1, borderColor: colors.line, ...shadows.card },
  floatLeft: { left: 2, bottom: 44 },
  floatRight: { right: 0, top: 42 },
  floatEmoji: { fontSize: 14 },
  floatText: { color: colors.text, fontSize: 11, fontWeight: '900' },
  bottom: { gap: 26 },
  heroCaption: { color: colors.primary, fontWeight: '800', textAlign: 'center', fontSize: 14 },
  actions: { gap: 9 }
});
