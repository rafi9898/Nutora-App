import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BackButton, Button, Pill, Screen } from '@/src/components/ui';
import { colors, radius } from '@/src/constants/theme';
import { mockMeals } from '@/src/data/mock';
import { translateMealItemName, translateMealName } from '@/src/features/meals/labels';
import { useAppStore } from '@/src/store/app-store';
import type { MealItem } from '@/src/types';

type NutritionField = 'estimatedCalories' | 'proteinG' | 'fatG' | 'carbsG';
type EditableItem = {
  id: string;
  name: string;
  estimatedWeightG: string;
  estimatedCalories: string;
  proteinG: string;
  fatG: string;
  carbsG: string;
};

const toEditableItem = (item: MealItem, name: string): EditableItem => ({
  id: item.id,
  name,
  estimatedWeightG: String(item.estimatedWeightG ?? 0),
  estimatedCalories: String(item.estimatedCalories),
  proteinG: String(item.proteinG),
  fatG: String(item.fatG),
  carbsG: String(item.carbsG)
});

const toNumber = (value: string) => Number(value.replace(',', '.')) || 0;
const scaleValue = (value: string, factor: number) => String(Math.round(toNumber(value) * factor));

export default function EditMealScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meals = useAppStore((state) => state.meals);
  const draft = useAppStore((state) => state.analysisDraft);
  const updateMeal = useAppStore((state) => state.updateMeal);
  const saveMeal = useAppStore((state) => state.saveMeal);
  const setAnalysisDraft = useAppStore((state) => state.setAnalysisDraft);
  const mealsError = useAppStore((state) => state.mealsError);
  const meal = meals.find((item) => item.id === id) ?? (draft?.id === id ? draft : mockMeals[1]);
  const isDraft = draft?.id === meal.id;
  const [saving, setSaving] = useState(false);
  const [portion, setPortion] = useState(1);
  const [nutrition, setNutrition] = useState<Record<NutritionField, string>>({
    estimatedCalories: String(meal.estimatedCalories),
    proteinG: String(meal.proteinG),
    fatG: String(meal.fatG),
    carbsG: String(meal.carbsG)
  });
  const [items, setItems] = useState<EditableItem[]>(meal.items.map((item) => toEditableItem(item, translateMealItemName(t, item))));

  const setMealPortion = (nextPortion: number) => {
    const factor = nextPortion / portion;
    setPortion(nextPortion);
    setNutrition((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, scaleValue(value, factor)])) as Record<NutritionField, string>);
    setItems((current) => current.map((item) => ({
      ...item,
      estimatedWeightG: scaleValue(item.estimatedWeightG, factor),
      estimatedCalories: scaleValue(item.estimatedCalories, factor),
      proteinG: scaleValue(item.proteinG, factor),
      fatG: scaleValue(item.fatG, factor),
      carbsG: scaleValue(item.carbsG, factor)
    })));
  };

  const updateItem = (itemId: string, field: keyof EditableItem, value: string) => {
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, [field]: value } : item));
  };

  const addIngredient = () => {
    const now = Date.now();
    setItems((current) => [
      ...current,
      {
        id: `custom-${now}`,
        name: t('editMeal.newIngredient'),
        estimatedWeightG: '100',
        estimatedCalories: '0',
        proteinG: '0',
        fatG: '0',
        carbsG: '0'
      }
    ]);
  };

  const removeIngredient = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const save = async () => {
    setSaving(true);
    const parsedItems: MealItem[] = items.map((item) => ({
      id: item.id,
      mealId: meal.id,
      name: item.name.trim() || t('editMeal.newIngredient'),
      estimatedWeightG: Math.round(toNumber(item.estimatedWeightG)),
      estimatedCalories: Math.round(toNumber(item.estimatedCalories)),
      proteinG: Math.round(toNumber(item.proteinG)),
      fatG: Math.round(toNumber(item.fatG)),
      carbsG: Math.round(toNumber(item.carbsG))
    }));
    
    const finalMeal = {
      ...meal,
      estimatedCalories: Math.round(toNumber(nutrition.estimatedCalories)),
      proteinG: Math.round(toNumber(nutrition.proteinG)),
      fatG: Math.round(toNumber(nutrition.fatG)),
      carbsG: Math.round(toNumber(nutrition.carbsG)),
      items: parsedItems,
      updatedAt: new Date().toISOString()
    };
    
    const savedMeal = isDraft ? await saveMeal(finalMeal) : await updateMeal(finalMeal);
    
    if (isDraft && savedMeal) {
      setAnalysisDraft(null as any);
    }
    
    setSaving(false);
    if (!savedMeal) return;
    router.replace('/(tabs)/history');
  };

  return <Screen>
    <View style={styles.nav}>
      <BackButton onPress={() => router.back()} />
      <Text style={styles.title}>{t('editMeal.title')}</Text>
      <View style={{ width: 42 }} />
    </View>

    <View style={styles.summary}>
      <Text style={styles.mealName}>{translateMealName(t, meal)}</Text>
      <Text style={styles.summaryInfo}>{t('editMeal.summaryInfo')}</Text>
      <Text style={styles.total}>{nutrition.estimatedCalories} <Text style={styles.kcal}>{t('common.kcal')}</Text></Text>
    </View>

    <Text style={styles.section}>{t('editMeal.portionSection')}</Text>
    <View style={styles.portionCard}>
      <Text style={styles.portionTitle}>{t('editMeal.portionQuestion')}</Text>
      <View style={styles.pills}>
        <Pill label={t('editMeal.small')} selected={portion === .75} onPress={() => setMealPortion(.75)} />
        <Pill label={t('editMeal.medium')} selected={portion === 1} onPress={() => setMealPortion(1)} />
        <Pill label={t('editMeal.large')} selected={portion === 1.25} onPress={() => setMealPortion(1.25)} />
      </View>
      <View style={styles.stepper}>
        <Pressable onPress={() => setMealPortion(Math.max(.5, Number((portion - .1).toFixed(1))))} style={styles.stepButton}>
          <Ionicons name="remove" size={22} color={colors.primary} />
        </Pressable>
        <View>
          <Text style={styles.portionValue}>{Math.round(portion * 100)}%</Text>
          <Text style={styles.portionLabel}>{t('editMeal.aiPortion')}</Text>
        </View>
        <Pressable onPress={() => setMealPortion(Math.min(2, Number((portion + .1).toFixed(1))))} style={styles.stepButton}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </Pressable>
      </View>
    </View>

    <Text style={styles.section}>{t('editMeal.nutritionSection')}</Text>
    <View style={styles.nutritionCard}>
      <NutritionInput label={t('editMeal.calories')} unit={t('common.kcal')} value={nutrition.estimatedCalories} onChange={(value) => setNutrition((current) => ({ ...current, estimatedCalories: value }))} />
      <View style={styles.macroInputs}>
        <NutritionInput label={t('editMeal.protein')} unit={t('common.grams')} value={nutrition.proteinG} onChange={(value) => setNutrition((current) => ({ ...current, proteinG: value }))} />
        <NutritionInput label={t('editMeal.fat')} unit={t('common.grams')} value={nutrition.fatG} onChange={(value) => setNutrition((current) => ({ ...current, fatG: value }))} />
        <NutritionInput label={t('editMeal.carbs')} unit={t('common.grams')} value={nutrition.carbsG} onChange={(value) => setNutrition((current) => ({ ...current, carbsG: value }))} />
      </View>
    </View>

    <Text style={styles.section}>{t('editMeal.ingredientsSection')}</Text>
    <View style={styles.items}>
      {items.length ? items.map((item) => (
        <IngredientEditor
          key={item.id}
          item={item}
          onChange={updateItem}
          onRemove={removeIngredient}
        />
      )) : <Text style={styles.emptyIngredients}>{t('editMeal.noIngredients')}</Text>}
    </View>

    {mealsError && <Text style={styles.error}>{mealsError}</Text>}
    <View style={styles.actions}>
      <Button title={saving ? t('editMeal.saving') : t('editMeal.saveChanges')} onPress={save} disabled={saving} />
      <Button title={t('editMeal.addIngredient')} icon="add" variant="outline" disabled={saving} onPress={addIngredient} />
    </View>
  </Screen>;
}

function NutritionInput({ label, unit, value, onChange }: { label: string; unit: string; value: string; onChange: (value: string) => void }) {
  return <View style={styles.nutritionInput}>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput keyboardType="number-pad" value={value} onChangeText={onChange} style={styles.input} />
      <Text style={styles.unit}>{unit}</Text>
    </View>
  </View>;
}

function IngredientEditor({ item, onChange, onRemove }: {
  item: EditableItem;
  onChange: (itemId: string, field: keyof EditableItem, value: string) => void;
  onRemove: (itemId: string) => void;
}) {
  const { t } = useTranslation();
  return <View style={styles.item}>
    <View style={styles.itemHeader}>
      <TextInput value={item.name} onChangeText={(value) => onChange(item.id, 'name', value)} style={styles.itemNameInput} />
      <Pressable hitSlop={8} onPress={() => onRemove(item.id)}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable>
    </View>
    <View style={styles.itemGrid}>
      <MiniInput label={t('common.grams')} value={item.estimatedWeightG} onChange={(value) => onChange(item.id, 'estimatedWeightG', value)} />
      <MiniInput label={t('common.kcal')} value={item.estimatedCalories} onChange={(value) => onChange(item.id, 'estimatedCalories', value)} />
      <MiniInput label={t('editMeal.protein')} value={item.proteinG} onChange={(value) => onChange(item.id, 'proteinG', value)} />
      <MiniInput label={t('editMeal.fat')} value={item.fatG} onChange={(value) => onChange(item.id, 'fatG', value)} />
      <MiniInput label={t('editMeal.carbs')} value={item.carbsG} onChange={(value) => onChange(item.id, 'carbsG', value)} />
    </View>
  </View>;
}

function MiniInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <View style={styles.miniInputWrap}>
    <Text style={styles.miniLabel}>{label}</Text>
    <TextInput keyboardType="number-pad" value={value} onChangeText={onChange} style={styles.miniInput} />
  </View>;
}

const styles = StyleSheet.create({
  nav: { paddingTop: 8, height: 61, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  summary: { borderRadius: radius.lg, backgroundColor: colors.primarySoft, padding: 20, alignItems: 'center', marginTop: 10 },
  mealName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  summaryInfo: { fontSize: 12, color: colors.muted, marginTop: 5 },
  total: { fontSize: 38, fontWeight: '800', color: colors.primary, marginTop: 16 },
  kcal: { fontSize: 21 },
  section: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 25, marginBottom: 10 },
  portionCard: { borderRadius: radius.md, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  portionTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  pills: { flexDirection: 'row', borderRadius: 99, borderWidth: 1, borderColor: colors.line, padding: 3, marginTop: 14, justifyContent: 'space-between' },
  stepper: { marginTop: 23, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 25 },
  stepButton: { height: 42, width: 42, borderRadius: 21, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  portionValue: { textAlign: 'center', color: colors.primary, fontSize: 22, fontWeight: '800' },
  portionLabel: { fontSize: 11, color: colors.muted },
  nutritionCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 14, gap: 13 },
  macroInputs: { flexDirection: 'row', gap: 8 },
  nutritionInput: { flex: 1 },
  nutritionLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAF6', borderRadius: 10, paddingHorizontal: 10, height: 42 },
  input: { flex: 1, fontWeight: '800', color: colors.text, fontSize: 15 },
  unit: { fontSize: 11, color: colors.muted, fontWeight: '700' },
  items: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  item: { padding: 13, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 10 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemNameInput: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '800', paddingVertical: 5 },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniInputWrap: { width: '30%', minWidth: 82, flexGrow: 1 },
  miniLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginBottom: 5 },
  miniInput: { height: 38, borderRadius: 10, backgroundColor: '#F8FAF6', color: colors.text, fontWeight: '800', paddingHorizontal: 10, borderWidth: 1, borderColor: colors.line },
  emptyIngredients: { color: colors.muted, textAlign: 'center', padding: 18, fontSize: 12, fontWeight: '700' },
  error: { color: colors.red, marginTop: 12, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  actions: { gap: 9, marginTop: 24 }
});
