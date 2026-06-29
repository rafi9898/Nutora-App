import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BackButton, Button, MacroCard, Screen, SectionTitle } from '@/src/components/ui';
import { colors, radius } from '@/src/constants/theme';
import { mockMeals } from '@/src/data/mock';
import { translateMealItemName } from '@/src/features/meals/labels';
import { useAppStore } from '@/src/store/app-store';

export default function AnalysisScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meals = useAppStore((state) => state.meals);
  const draft = useAppStore((state) => state.analysisDraft);
  const saveAnalysisDraft = useAppStore((state) => state.saveAnalysisDraft);
  const mealsError = useAppStore((state) => state.mealsError);
  const [saving, setSaving] = useState(false);
  const meal = meals.find((item) => item.id === id) ?? (draft?.id === id ? draft : mockMeals[1]);
  const isDraft = draft?.id === meal.id;
  const items = meal.items || [];
  const save = async () => {
    if (isDraft) {
      setSaving(true);
      const savedMeal = await saveAnalysisDraft();
      setSaving(false);
      if (!savedMeal) return;
    }
    router.replace('/(tabs)/history');
  };
  return <Screen><View style={styles.nav}><BackButton onPress={() => router.back()} /><Text style={styles.navTitle}>{t('analysis.title')}</Text><View style={{ width: 42 }} /></View>{meal.photoUrl ? <Image source={{ uri: meal.photoUrl }} style={styles.photo} /> : <View style={[styles.photo, styles.photoFallback]}><Ionicons name="restaurant-outline" size={64} color={colors.primary} /></View>}<View style={styles.calorieCard}><Text style={styles.calories}>{meal.estimatedCalories} <Text style={styles.kcal}>{t('common.kcal')}</Text></Text><Text style={styles.estimate}>{t('analysis.estimatedValue')} <Ionicons name="information-circle-outline" size={14} color={colors.muted} /></Text></View>{items.length > 0 && <><SectionTitle title={t('analysis.ingredients')} /><View style={styles.ingredients}>{items.map((item, index) => <View key={item.id} style={styles.ingredient}><View style={styles.itemDot}><Text>{['🥑', '🍗', '🍚', '🥦', '🧀', '🍓', '🥚', '🥪', '🥣', '🍎', '🥩', '🍞'][index % 12]}</Text></View><Text style={styles.itemName}>{translateMealItemName(t, item)}</Text><Text style={styles.itemCalories}>{item.estimatedCalories} {t('common.kcal')}</Text></View>)}</View></>}<SectionTitle title={t('analysis.macros')} /><View style={styles.macros}><MacroCard label={t('analysis.protein')} value={meal.proteinG} goal={165} color={colors.primary} icon="leaf-outline" /><MacroCard label={t('analysis.fat')} value={meal.fatG} goal={73} color={colors.orange} icon="flame-outline" /><MacroCard label={t('analysis.carbs')} value={meal.carbsG} goal={275} color={colors.blue} icon="water-outline" /></View><View style={styles.info}><Ionicons name="information-circle-outline" size={16} color={colors.muted} /><Text style={styles.infoText}>{t('analysis.info')}</Text></View>{mealsError && <Text style={styles.error}>{mealsError}</Text>}<View style={styles.actions}><Button title={saving ? t('analysis.saving') : isDraft ? t('analysis.saveMeal') : t('analysis.backToHistory')} onPress={save} disabled={saving} /><Button title={t('analysis.editPortion')} variant="outline" onPress={() => router.push(`/edit-meal/${meal.id}` as never)} disabled={saving} /></View></Screen>;
}
const styles = StyleSheet.create({ nav: { paddingTop: 8, height: 61, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, navTitle: { fontSize: 16, fontWeight: '800', color: colors.text }, photo: { height: 248, width: '100%', borderRadius: radius.lg, backgroundColor: colors.primarySoft }, photoFallback: { alignItems: 'center', justifyContent: 'center' }, calorieCard: { marginTop: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' }, calories: { fontSize: 39, lineHeight: 44, color: colors.primary, fontWeight: '800', letterSpacing: -1 }, kcal: { fontSize: 22, letterSpacing: -.5 }, estimate: { color: colors.muted, fontSize: 13, marginTop: 2 }, ingredients: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 4 }, ingredient: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', flexDirection: 'row', gap: 10 }, itemDot: { width: 25, height: 25, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, itemName: { flex: 1, color: colors.text, fontSize: 13 }, itemCalories: { color: colors.text, fontWeight: '700', fontSize: 12 }, macros: { flexDirection: 'row', gap: 8 }, info: { flexDirection: 'row', gap: 6, marginTop: 16, alignItems: 'center' }, infoText: { color: colors.muted, flex: 1, fontSize: 11 }, error: { color: colors.red, fontSize: 12, fontWeight: '700', marginTop: 12, textAlign: 'center' }, actions: { gap: 9, marginTop: 18 } });
