import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackButton, EmptyState, MealRow, Pill, Screen, SectionTitle, StatCard } from '@/src/components/ui';
import { colors, radius } from '@/src/constants/theme';
import { sumNutrition } from '@/src/features/meals/selectors';
import { useAppStore } from '@/src/store/app-store';
import type { Meal } from '@/src/types';

type ProgressRange = 'week' | 'month' | 'year';

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addUnits = (date: Date, range: ProgressRange, amount: number) => {
  const copy = new Date(date);
  if (range === 'week') copy.setDate(copy.getDate() + amount * 7);
  if (range === 'month') copy.setMonth(copy.getMonth() + amount);
  if (range === 'year') copy.setFullYear(copy.getFullYear() + amount);
  return copy;
};

const getRangeStart = (reference: Date, range: ProgressRange) => {
  const start = startOfDay(reference);
  if (range === 'week') {
    const weekday = start.getDay() || 7;
    start.setDate(start.getDate() - weekday + 1);
  }
  if (range === 'month') start.setDate(1);
  if (range === 'year') {
    start.setMonth(0);
    start.setDate(1);
  }
  return start;
};

const getRangeEnd = (start: Date, range: ProgressRange) => {
  const end = new Date(start);
  if (range === 'week') end.setDate(end.getDate() + 7);
  if (range === 'month') end.setMonth(end.getMonth() + 1);
  if (range === 'year') end.setFullYear(end.getFullYear() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return end;
};

const isInRange = (meal: Meal, start: Date, end: Date) => {
  const date = new Date(meal.createdAt);
  return date >= start && date <= end;
};

const formatRangeLabel = (start: Date, end: Date, range: ProgressRange, locale: string) => {
  if (range === 'week') {
    return `${start.toLocaleDateString(locale, { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString(locale, { day: '2-digit', month: 'short' })}`;
  }
  if (range === 'month') return start.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return start.toLocaleDateString(locale, { year: 'numeric' });
};

const buildBuckets = (meals: Meal[], range: ProgressRange, start: Date, locale: string) => {
  if (range === 'week') {
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      const end = startOfDay(date);
      end.setDate(end.getDate() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);
      return {
        key: date.toISOString(),
        label: date.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 3),
        calories: sumNutrition(meals.filter((meal) => isInRange(meal, date, end))).calories
      };
    });
  }

  if (range === 'month') {
    return Array.from({ length: 5 }, (_, offset) => {
      const from = new Date(start);
      from.setDate(1 + offset * 7);
      const to = new Date(start);
      to.setDate(Math.min(7 + offset * 7, new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()));
      to.setHours(23, 59, 59, 999);
      return {
        key: `${start.toISOString()}-${offset}`,
        label: `${offset + 1}`,
        calories: sumNutrition(meals.filter((meal) => isInRange(meal, from, to))).calories
      };
    });
  }

  return Array.from({ length: 12 }, (_, offset) => {
    const from = new Date(start.getFullYear(), offset, 1);
    const to = new Date(start.getFullYear(), offset + 1, 0, 23, 59, 59, 999);
    return {
      key: from.toISOString(),
      label: from.toLocaleDateString(locale, { month: 'short' }).slice(0, 3),
      calories: sumNutrition(meals.filter((meal) => isInRange(meal, from, to))).calories
    };
  });
};

export default function ProgressScreen() {
  const { t, i18n } = useTranslation();
  const meals = useAppStore((state) => state.meals);
  const profile = useAppStore((state) => state.profile);
  const [range, setRange] = useState<ProgressRange>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const locale = i18n.language === 'pl' ? 'pl-PL' : i18n.language;

  const data = useMemo(() => {
    const start = getRangeStart(referenceDate, range);
    const end = getRangeEnd(start, range);
    const rangeMeals = meals
      .filter((meal) => isInRange(meal, start, end))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const buckets = buildBuckets(rangeMeals, range, start, locale);
    return { start, end, rangeMeals, buckets };
  }, [locale, meals, range, referenceDate]);

  const total = sumNutrition(data.rangeMeals).calories;
  const activeBuckets = data.buckets.filter((bucket) => bucket.calories > 0);
  const average = activeBuckets.length ? Math.round(activeBuckets.reduce((sum, bucket) => sum + bucket.calories, 0) / activeBuckets.length) : 0;
  const bestBucket = data.buckets.reduce((best, bucket) => bucket.calories > best.calories ? bucket : best, data.buckets[0]);
  const maximum = Math.max(profile.dailyCalorieGoal, ...data.buckets.map((bucket) => bucket.calories), 1);

  const changeRange = (nextRange: ProgressRange) => {
    setRange(nextRange);
    setReferenceDate(new Date());
  };

  return <Screen>
    <View style={styles.header}>
      <BackButton onPress={() => router.back()} />
      <Text style={styles.title}>{t('progress.title')}</Text>
      <Pressable onPress={() => setShowPicker(true)} hitSlop={12}>
        <Ionicons name="calendar-outline" size={22} color={colors.text} />
      </Pressable>
    </View>

    <View style={styles.segment}>
      <Pill label={t('progress.week')} selected={range === 'week'} onPress={() => changeRange('week')} />
      <Pill label={t('progress.month')} selected={range === 'month'} onPress={() => changeRange('month')} />
      <Pill label={t('progress.year')} selected={range === 'year'} onPress={() => changeRange('year')} />
    </View>

    <View style={styles.range}>
      <Pressable hitSlop={12} onPress={() => setReferenceDate((date) => addUnits(date, range, -1))} style={styles.rangeButton}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>
      <Pressable onPress={() => setShowPicker(true)} style={styles.rangeCopy}>
        <Text style={styles.rangeText}>{formatRangeLabel(data.start, data.end, range, locale)}</Text>
        <Text style={styles.rangeSub}>{t(`progress.rangeLabels.${range}`)}</Text>
      </Pressable>
      <Pressable hitSlop={12} onPress={() => setReferenceDate((date) => addUnits(date, range, 1))} style={styles.rangeButton}>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>
    </View>

    {showPicker && (
      <DateTimePicker
        value={referenceDate}
        mode="date"
        display="default"
        onChange={(event, date) => {
          setShowPicker(false);
          if (date) setReferenceDate(date);
        }}
      />
    )}

    <View style={styles.chart}>
      <View style={styles.target}><Text style={styles.targetText}>{t('progress.target', { goal: profile.dailyCalorieGoal })}</Text></View>
      <View style={styles.bars}>
        {data.buckets.map((bucket) => <View key={bucket.key} style={styles.barWrap}>
          <Text style={styles.barValue}>{bucket.calories || ''}</Text>
          <View style={[styles.bar, {
            height: `${Math.max((bucket.calories / maximum) * 100, bucket.calories ? 4 : 0)}%`,
            backgroundColor: bucket.calories >= profile.dailyCalorieGoal ? colors.primary : '#B8DC8F'
          }]} />
          <Text style={styles.barLabel}>{bucket.label}</Text>
        </View>)}
      </View>
    </View>

    <View style={styles.stats}>
      <StatCard label={t('progress.averageDaily')} value={`${average} ${t('common.kcal')}`} note={t('progress.activeDays', { count: activeBuckets.length })} icon="trending-up" />
      <StatCard label={t('progress.bestDay')} value={`${bestBucket.calories} ${t('common.kcal')}`} note={bestBucket.label} icon="trophy-outline" color={colors.orange} />
      <StatCard label={t('progress.meals')} value={`${data.rangeMeals.length}`} note={t('progress.total', { total })} icon="flame" color={colors.orange} />
    </View>

    <SectionTitle title={t('progress.mealHistory')} action={t('progress.seeAll')} onAction={() => router.push('/(tabs)/history')} />
    {data.rangeMeals.length ? data.rangeMeals.slice(0, 4).map((meal) => (
      <MealRow
        key={meal.id}
        meal={meal}
        compact
        time={new Date(meal.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
        onPress={() => router.push(`/analysis/${meal.id}`)}
      />
    )) : <EmptyState icon="bar-chart-outline" title={t('progress.emptyTitle')} text={t('progress.emptyText')} actionTitle={t('history.addMeal')} onAction={() => router.push('/(tabs)/camera')} />}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  segment: { marginTop: 18, backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-between' },
  range: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 21, gap: 12 },
  rangeButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  rangeCopy: { flex: 1, alignItems: 'center' },
  rangeText: { color: colors.text, fontWeight: '900', fontSize: 15, textTransform: 'capitalize' },
  rangeSub: { color: colors.muted, fontWeight: '700', fontSize: 11, marginTop: 3 },
  chart: { height: 255, marginTop: 13, borderBottomWidth: 1, borderBottomColor: colors.line, position: 'relative', paddingTop: 33 },
  target: { borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, position: 'absolute', top: 54, left: 0, right: 0, alignItems: 'flex-end' },
  targetText: { color: colors.primary, backgroundColor: colors.background, fontSize: 10, fontWeight: '700', paddingLeft: 5, marginTop: -17 },
  bars: { height: 210, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  barWrap: { height: '100%', flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  bar: { width: 18, borderRadius: 9 },
  barValue: { fontSize: 9, color: colors.text, fontWeight: '700' },
  barLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 22 }
});
