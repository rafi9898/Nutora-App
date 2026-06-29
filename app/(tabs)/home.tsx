import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRef, useCallback } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { DatePicker, EmptyState, MacroCard, MealRow, Screen, SectionTitle } from '@/src/components/ui';
import { colors, radius, shadows } from '@/src/constants/theme';
import { getCurrentStreak, getTodayMeals, sumNutrition } from '@/src/features/meals/selectors';
import { useAppStore, getLocalISODate } from '@/src/store/app-store';

function WaterGlass({ isFilled, index, onPress }: { isFilled: boolean, index: number, onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.25, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.glass, isFilled && styles.glassFilled, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name={isFilled ? "water" : "water-outline"} size={20} color={isFilled ? "#fff" : "#0EA5E9"} />
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { profile, meals, subscription, waterIntake, addWater, removeWater, language } = useAppStore();
  const todayMeals = getTodayMeals(meals);
  const nutrition = sumNutrition(todayMeals);
  const streak = getCurrentStreak(meals);
  const rawProgress = Math.round((nutrition.calories / profile.dailyCalorieGoal) * 100);
  const progress = Math.min(rawProgress, 100);
  const remaining = Math.max(profile.dailyCalorieGoal - nutrition.calories, 0);

  let themeColor: string = colors.primary;
  let bgOuter = '#F1F9E8';
  let borderOuter = '#DCEFD1';
  let bgInner = '#EEF7E8';
  let ringBg = '#DDEAD2';

  if (rawProgress >= 110 || rawProgress < 50) {
    themeColor = colors.red;
    bgOuter = '#FEF6F6';
    borderOuter = '#FCEAEA';
    bgInner = '#FBEFEF';
    ringBg = '#F5D3D3';
  } else if (rawProgress > 100 || rawProgress < 80) {
    themeColor = colors.orange;
    bgOuter = '#FFFAF5';
    borderOuter = '#FDF0E1';
    bgInner = '#FFF5EB';
    ringBg = '#FDE2C9';
  }

  return <Screen>
    <View style={styles.header}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.kicker}>{t('home.kicker')}</Text>
        <Text style={styles.hello} numberOfLines={1} ellipsizeMode="tail">{t('home.hello', { name: profile.name })}</Text>
        <Text style={styles.date}>{t('home.summary')}</Text>
      </View>
      <View style={{ gap: 8, alignItems: 'flex-end' }}>
        <Pressable onPress={() => router.push('/subscription')} style={styles.planBadge}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.planText}>{subscription.tier === 'premium' ? 'Premium' : 'Free'}</Text>
        </Pressable>
        {streak > 0 && (
          <View style={[styles.planBadge, { borderColor: '#FFE4E1', backgroundColor: '#FFF0F5' }]}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
            <Text style={[styles.planText, { color: '#E14D2A' }]}>{t('home.streakDays', { count: streak })}</Text>
          </View>
        )}
      </View>
    </View>

    <View style={[styles.goalCard, { backgroundColor: bgOuter, borderColor: borderOuter }]}>
      <View style={styles.goalCopy}>
        <Text style={styles.goalLabel}>{t('home.todayGoal')}</Text>
        <Text style={styles.goalTarget}>{profile.dailyCalorieGoal} kcal</Text>
        <Text style={[styles.eaten, { color: themeColor }]}><Text style={styles.eatenNumber}>{nutrition.calories}</Text> kcal</Text>
        <Text style={styles.eatenLabel}>{t('home.eatenRemaining', { remaining })}</Text>
      </View>
      <View style={{ width: 108, height: 108, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={108} height={108} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={54} cy={54} r={49.5}
            stroke={ringBg} strokeWidth={9} fill={bgInner}
          />
          <Circle
            cx={54} cy={54} r={49.5}
            stroke={themeColor} strokeWidth={9} fill="transparent"
            strokeDasharray={49.5 * 2 * Math.PI}
            strokeDashoffset={(49.5 * 2 * Math.PI) * (1 - (progress / 100))}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.ringInner}>
          <View style={styles.ringCopy}>
            <Text style={[styles.ringNumber, { color: themeColor }]}>{rawProgress}%</Text>
            <Text style={styles.ringText}>{t('home.goal')}</Text>
          </View>
        </View>
      </View>
    </View>

    <Pressable onPress={() => router.push('/(tabs)/camera')} style={({ pressed }) => [styles.cameraButton, pressed && { opacity: .86, transform: [{ scale: .99 }] }]}>
      <View style={styles.cameraIcon}><Ionicons name="camera-outline" size={23} color="#fff" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cameraText}>{t('home.takePhoto')}</Text>
        <Text style={styles.cameraSub}>{t('home.aiSubtitle')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </Pressable>

    <View style={styles.macros}>
      <MacroCard label={t('home.protein')} value={nutrition.protein} goal={profile.proteinGoalG} color={colors.primary} icon="leaf-outline" />
      <MacroCard label={t('home.fat')} value={nutrition.fat} goal={profile.fatGoalG} color={colors.orange} icon="flame-outline" />
      <MacroCard label={t('home.carbs')} value={nutrition.carbs} goal={profile.carbsGoalG} color={colors.blue} icon="restaurant-outline" />
    </View>

    <View style={styles.waterCard}>
      <View style={styles.waterHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="water" size={18} color="#0EA5E9" />
          <Text style={styles.waterTitle}>{t('home.hydration')}</Text>
        </View>
        <Text style={styles.waterCount}>{waterIntake.date === getLocalISODate() ? waterIntake.glasses : 0} / 8</Text>
      </View>
      <View style={styles.waterGlasses}>
        {Array.from({ length: 8 }).map((_, i) => {
          const isFilled = (waterIntake.date === getLocalISODate() ? waterIntake.glasses : 0) > i;
          return <WaterGlass key={i} index={i} isFilled={isFilled} onPress={isFilled ? removeWater : addWater} />;
        })}
      </View>
    </View>

    <SectionTitle title={t('home.recentMeals')} action={t('home.seeAll')} onAction={() => router.push('/(tabs)/history')} />
    {todayMeals.length ? todayMeals.slice(0, 3).map((meal) => <MealRow key={meal.id} meal={meal} time={new Date(meal.createdAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })} onPress={() => router.push(`/analysis/${meal.id}`)} />) : <EmptyState icon="restaurant-outline" title={t('home.emptyTitle')} text={t('home.emptyText')} actionTitle={t('home.addMeal')} onAction={() => router.push('/(tabs)/camera')} />}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, marginBottom: 22 },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
  hello: { color: colors.text, fontSize: 29, fontWeight: '900', letterSpacing: -1 },
  date: { color: colors.muted, marginTop: 4, fontSize: 13, fontWeight: '600' },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 36, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  planText: { color: colors.primary, fontWeight: '900', fontSize: 12 },
  goalCard: { minHeight: 158, borderRadius: radius.xl, padding: 22, backgroundColor: '#F1F9E8', borderWidth: 1, borderColor: '#DCEFD1', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', ...shadows.card },
  goalCopy: { flex: 1, paddingRight: 8 },
  goalLabel: { fontSize: 12, color: colors.text, fontWeight: '800' },
  goalTarget: { color: colors.muted, fontSize: 12, marginTop: 4, fontWeight: '600' },
  eaten: { color: colors.primary, marginTop: 19, fontWeight: '800' },
  eatenNumber: { fontSize: 34, fontWeight: '900', letterSpacing: -1.1 },
  eatenLabel: { fontSize: 12, color: colors.muted, marginTop: 2, fontWeight: '600' },
  ringInner: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  ringCopy: { alignItems: 'center' },
  ringNumber: { color: colors.primary, fontSize: 21, fontWeight: '900', letterSpacing: -.4 },
  ringText: { fontSize: 10, color: colors.muted, fontWeight: '700' },
  cameraButton: { marginTop: 16, minHeight: 66, borderRadius: radius.lg, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 13, paddingHorizontal: 15, ...shadows.button },
  cameraIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF26', alignItems: 'center', justifyContent: 'center' },
  cameraText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  cameraSub: { color: '#DFF4CF', fontWeight: '600', fontSize: 11, marginTop: 2 },
  macros: { flexDirection: 'row', gap: 9, marginTop: 17 },
  waterCard: { marginTop: 17, padding: 18, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  waterTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  waterCount: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  waterGlasses: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glass: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F9FF', borderWidth: 1.5, borderColor: '#BAE6FD', alignItems: 'center', justifyContent: 'center' },
  glassFilled: { backgroundColor: '#38BDF8', borderColor: '#0EA5E9' }
});
