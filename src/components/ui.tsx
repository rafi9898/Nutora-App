import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type RefreshControlProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows } from '@/src/constants/theme';
import { translateMealName } from '@/src/features/meals/labels';
import type { Meal } from '@/src/types';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, scroll = true, style, refreshControl }: { children: ReactNode; scroll?: boolean; style?: ViewStyle; refreshControl?: ReactElement<RefreshControlProps> }) {
  const content = <View style={[styles.screenContent, style]}>{children}</View>;
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>{content}</ScrollView> : content}</SafeAreaView>;
}

export function Logo({ light = false }: { light?: boolean }) {
  return <View style={styles.logo}><View style={[styles.logoMark, light && { borderColor: '#fff' }]}><Ionicons name="leaf-outline" size={22} color={light ? '#fff' : colors.primary} /></View><Text style={[styles.logoText, light && { color: '#fff' }]}>Nut<Text style={[styles.logoAccent, light && { color: '#D9F2B8' }]}>ora</Text></Text></View>;
}

export function Button({ title, onPress, variant = 'primary', icon, disabled = false }: { title: string; onPress?: () => void; variant?: 'primary' | 'outline' | 'ghost'; icon?: IconName; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, styles[`button_${variant}`], pressed && styles.pressed, disabled && { opacity: .5 }]}>
    {icon && <Ionicons name={icon} size={20} color={variant === 'primary' ? '#fff' : colors.primary} />}
    <Text style={[styles.buttonText, variant !== 'primary' && { color: colors.primary }]}>{title}</Text>
  </Pressable>;
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.back}><Ionicons name="chevron-back" size={25} color={colors.text} /></Pressable>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>{title}</Text>{action && <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable>}</View>;
}

export function MacroCard({ label, value, goal, color, icon }: { label: string; value: number; goal: number; color: string; icon: IconName }) {
  const { t } = useTranslation();
  const progress = Math.min(value / goal, 1);
  return <View style={styles.macroCard}><View style={[styles.macroIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon} size={17} color={color} /></View><Text style={styles.macroLabel}>{label}</Text><Text style={styles.macroValue}>{value} g</Text><Text style={styles.macroGoal}>{t('common.of', 'z')} {goal} g</Text><View style={styles.track}><View style={[styles.fill, { backgroundColor: color, width: `${progress * 100}%` }]} /></View></View>;
}

export function MealRow({ meal, time, onPress, onDelete, compact = false }: { meal: Meal; time: string; onPress?: () => void; onDelete?: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.mealRow, compact && styles.mealRowCompact, pressed && styles.pressed]}>
    {meal.photoUrl ? <Image source={{ uri: meal.photoUrl }} style={styles.mealImage} /> : <View style={[styles.mealImage, styles.imageFallback]}><Ionicons name="restaurant" size={22} color={colors.primary} /></View>}
    <View style={styles.mealDetails}><Text style={styles.mealType}>{t(`mealTypes.${meal.mealType}`)}</Text><Text numberOfLines={compact ? 1 : 2} style={styles.mealName}>{translateMealName(t, meal)}</Text><Text style={styles.mealTime}>{time}</Text></View>
    <View style={styles.mealEnd}><Text style={styles.mealCalories}>{meal.estimatedCalories} kcal</Text>{onDelete ? <Pressable hitSlop={8} onPress={(event) => { event.stopPropagation(); onDelete(); }}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable> : <Ionicons name="chevron-forward" size={18} color="#9AA39A" />}</View>
  </Pressable>;
}

export function StatCard({ label, value, note, icon, color = colors.primary }: { label: string; value: string; note: string; icon: IconName; color?: string }) {
  return <View style={styles.statCard}><Text style={styles.statLabel} numberOfLines={1}>{label}</Text><Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text><View style={styles.statNote}><Ionicons name={icon} size={15} color={color} /><Text style={[styles.statNoteText, { color }]} numberOfLines={2}>{note}</Text></View></View>;
}

export function Pill({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.pill, selected && styles.pillSelected]}><Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text></Pressable>;
}

export function EmptyState({ icon, title, text, actionTitle, onAction }: { icon: IconName; title: string; text: string; actionTitle?: string; onAction?: () => void }) {
  return <View style={styles.emptyState}>
    <View style={styles.emptyIcon}><Ionicons name={icon} size={30} color={colors.primary} /></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyText}>{text}</Text>
    {actionTitle && <Pressable onPress={onAction} style={styles.emptyAction}><Text style={styles.emptyActionText}>{actionTitle}</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, scroll: { flexGrow: 1 }, screenContent: { flex: 1, paddingHorizontal: 20, paddingBottom: 34 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 9 }, logoMark: { width: 42, height: 34, borderWidth: 2.4, borderColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFC7' }, logoText: { fontSize: 21, fontWeight: '800', color: colors.text, letterSpacing: -.6 }, logoAccent: { color: colors.primary },
  button: { minHeight: 56, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 22 }, button_primary: { backgroundColor: colors.primary, ...shadows.button }, button_outline: { borderWidth: 1.4, borderColor: '#BFE0B2', backgroundColor: colors.surface }, button_ghost: { backgroundColor: 'transparent' }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -.15 }, pressed: { opacity: .82, transform: [{ scale: .985 }] },
  back: { width: 42, height: 42, alignItems: 'flex-start', justifyContent: 'center' }, sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 13 }, sectionHeading: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -.35 }, sectionAction: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  macroCard: { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 12, borderRadius: radius.md, ...shadows.card }, macroIcon: { width: 29, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, macroLabel: { fontSize: 10, fontWeight: '800', color: colors.muted }, macroValue: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2, letterSpacing: -.35 }, macroGoal: { fontSize: 10, color: colors.muted, marginTop: 2 }, track: { height: 5, backgroundColor: '#E8ECE5', borderRadius: 99, marginTop: 10, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 99 },
  mealRow: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 10, marginBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 11, ...shadows.card }, mealRowCompact: { marginBottom: 8, borderRadius: radius.md }, mealImage: { width: 58, height: 58, borderRadius: 16, backgroundColor: colors.primarySoft }, imageFallback: { alignItems: 'center', justifyContent: 'center' }, mealDetails: { flex: 1, minWidth: 0 }, mealType: { fontSize: 11, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: .4 }, mealName: { fontSize: 13, color: colors.text, marginTop: 3, lineHeight: 17, fontWeight: '700' }, mealTime: { fontSize: 11, color: '#97A096', marginTop: 3 }, mealEnd: { alignItems: 'flex-end', gap: 8 }, mealCalories: { fontSize: 14, color: colors.text, fontWeight: '800' },
  statCard: { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 13, ...shadows.card }, statLabel: { fontSize: 10, color: colors.muted, fontWeight: '800' }, statValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 9, letterSpacing: -.4 }, statNote: { flexDirection: 'row', gap: 3, marginTop: 9, alignItems: 'center' }, statNoteText: { fontSize: 10, fontWeight: '700', flexShrink: 1 },
  pill: { paddingHorizontal: 17, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, pillSelected: { backgroundColor: colors.primary }, pillText: { fontSize: 13, fontWeight: '700', color: colors.muted }, pillTextSelected: { color: '#fff' },
  emptyState: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 28, alignItems: 'center', ...shadows.card }, emptyIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 12 }, emptyText: { color: colors.muted, fontSize: 12, marginTop: 5, textAlign: 'center', lineHeight: 17 }, emptyAction: { marginTop: 15, paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.primarySoft }, emptyActionText: { color: colors.primary, fontWeight: '800', fontSize: 12 }
});
interface DatePickerProps {
  dateStr: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
}

export function DatePicker({ dateStr, onChange }: DatePickerProps) {
  const { t } = useTranslation();
  
  const dateObj = new Date(dateStr);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = dateStr === todayStr;

  const getLabel = () => {
    if (isToday) return t('calendar.today', 'Dzisiaj');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().slice(0, 10)) return t('calendar.yesterday', 'Wczoraj');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().slice(0, 10)) return t('calendar.tomorrow', 'Jutro');
    
    return dateObj.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  };

  const changeDate = (days: number) => {
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + days);
    onChange(nextDate.toISOString().slice(0, 10));
  };

  return (
    <View style={dpStyles.container}>
      <Pressable onPress={() => changeDate(-1)} style={dpStyles.btn}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>
      <View style={dpStyles.labelWrap}>
        <Ionicons name="calendar-outline" size={16} color={isToday ? colors.primary : colors.muted} />
        <Text style={[dpStyles.label, isToday && dpStyles.labelToday]}>{getLabel()}</Text>
      </View>
      <Pressable onPress={() => changeDate(1)} style={dpStyles.btn}>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const dpStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 4, height: 42, width: 160 },
  btn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.primarySoft },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '800', color: colors.text },
  labelToday: { color: colors.primary }
});
