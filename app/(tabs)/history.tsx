import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { DatePicker, EmptyState, MealRow, Pill, Screen, SectionTitle, Button } from '@/src/components/ui';
import { colors, radius, shadows } from '@/src/constants/theme';
import { sumNutrition } from '@/src/features/meals/selectors';
import { useAppStore } from '@/src/store/app-store';

type HistoryRange = 'today' | 'week' | 'month';

const isInRange = (date: Date, range: HistoryRange) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === 'week') {
    const weekday = start.getDay() || 7;
    start.setDate(start.getDate() - weekday + 1);
  }

  if (range === 'month') {
    start.setDate(1);
  }

  return date >= start && date <= now;
};

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [range, setRange] = useState<HistoryRange>('today');
  const [limit, setLimit] = useState(20);
  const meals = useAppStore((state) => state.meals);
  const mealsStatus = useAppStore((state) => state.mealsStatus);
  const mealsError = useAppStore((state) => state.mealsError);
  const deleteMeal = useAppStore((state) => state.deleteMeal);
  const loadMeals = useAppStore((state) => state.loadMeals);
  const isLoading = mealsStatus === 'loading';
  const visibleMeals = useMemo(
    () => meals.filter((meal) => isInRange(new Date(meal.createdAt), range)),
    [meals, range]
  );
  const summary = sumNutrition(visibleMeals);
  const displayedMeals = visibleMeals.slice(0, limit);

  const rangeLabels: Record<HistoryRange, string> = {
    today: t('history.today'),
    week: t('history.week'),
    month: t('history.month')
  };

  return <Screen refreshControl={<RefreshControl refreshing={isLoading} tintColor={colors.primary} colors={[colors.primary]} onRefresh={() => { void loadMeals(); }} />}>
    <View style={styles.header}>
      <View><Text style={styles.kicker}>{t('history.diary')}</Text><Text style={styles.title}>{t('history.title')}</Text><Text style={styles.sub}>{t('history.subtitle')}</Text></View>
      <Pressable onPress={() => { void loadMeals(); }} style={styles.refresh}><Ionicons name="refresh-outline" size={22} color={colors.primary} /></Pressable>
    </View>
    <View style={styles.pills}>
      {(Object.keys(rangeLabels) as HistoryRange[]).map((item) => <Pill key={item} label={rangeLabels[item]} selected={range === item} onPress={() => { setRange(item); setLimit(20); }} />)}
    </View>
    <View style={styles.rangeSummary}>
      <View>
        <Text style={styles.rangeLabel}>{rangeLabels[range].toUpperCase()}</Text>
        <Text style={styles.rangeValue}>{summary.calories} kcal</Text>
      </View>
      <View style={styles.rangeMeta}>
        <Text style={styles.rangeMetaText}>{t('history.mealsCount', { count: visibleMeals.length })}</Text>
        <Text style={styles.rangeMetaText}>{t('history.proteinCount', { protein: summary.protein })}</Text>
      </View>
    </View>
    <SectionTitle title={rangeLabels[range]} action={t('history.progress')} onAction={() => router.push('/progress')} />
    {isLoading && <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>{t('history.loading')}</Text></View>}
    {mealsError && <View style={styles.errorBox}><Ionicons name="warning-outline" size={18} color={colors.red} /><Text style={styles.errorText}>{mealsError}</Text></View>}
    {displayedMeals.length ? displayedMeals.map((meal) => <MealRow
      key={meal.id}
      meal={meal}
      time={new Date(meal.createdAt).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ' · ' + new Date(meal.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
      onPress={() => router.push(`/analysis/${meal.id}`)}
      onDelete={() => { void deleteMeal(meal.id); }}
    />) : !isLoading && <EmptyState icon="restaurant-outline" title={t('history.emptyTitle')} text={t('history.emptyText')} actionTitle={t('history.addMeal')} onAction={() => router.push('/(tabs)/camera')} />}
    {limit < visibleMeals.length && <View style={styles.loadMore}><Button variant="outline" title={t('history.loadMore', 'Wczytaj więcej')} onPress={() => setLimit(l => l + 20)} /></View>}
    <View style={styles.summary}><View style={styles.summaryIcon}><Ionicons name="sparkles" size={20} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.summaryTitle}>{t('history.summaryTitle')}</Text><Text style={styles.summaryText}>{t('history.summaryText')}</Text></View></View>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { paddingTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
  title: { fontSize: 29, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  sub: { color: colors.muted, marginTop: 4, fontSize: 13, fontWeight: '600' },
  refresh: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  pills: { marginTop: 24, flexDirection: 'row', backgroundColor: colors.surface, padding: 4, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, justifyContent: 'space-between', ...shadows.card },
  rangeSummary: { marginTop: 16, padding: 17, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadows.card },
  rangeLabel: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  rangeValue: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -1, marginTop: 4 },
  rangeMeta: { alignItems: 'flex-end', gap: 4 },
  rangeMetaText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  loading: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 18, alignItems: 'center', gap: 8, marginBottom: 10, ...shadows.card },
  loadingText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  errorBox: { flexDirection: 'row', gap: 8, borderRadius: radius.md, backgroundColor: '#FFF4F2', borderWidth: 1, borderColor: '#F7D4CE', padding: 12, marginBottom: 10 },
  errorText: { flex: 1, color: colors.red, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  summary: { marginTop: 15, flexDirection: 'row', gap: 11, padding: 16, borderRadius: radius.lg, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#D8EDCA' },
  summaryIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFFA8', alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  summaryText: { color: colors.muted, marginTop: 3, fontSize: 12, lineHeight: 17 },
  loadMore: { marginTop: 10, marginBottom: 5 }
});
