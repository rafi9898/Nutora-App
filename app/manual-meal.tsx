import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BackButton, Button, Pill, Screen } from '@/src/components/ui';
import { colors, radius, shadows } from '@/src/constants/theme';
import { createLocalId, useAppStore } from '@/src/store/app-store';
import type { Meal, MealType, MealNutritionInput } from '@/src/types';
import { barcodeService } from '@/src/services/backend/barcode-service';

type NutritionField = 'estimatedCalories' | 'proteinG' | 'fatG' | 'carbsG';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

const toNumber = (value: string) => Math.round(Number(value.replace(',', '.')) || 0);

export default function ManualMealScreen() {
  const { t } = useTranslation();
  const saveMeal = useAppStore((state) => state.saveMeal);
  const profile = useAppStore((state) => state.profile);
  const authUser = useAppStore((state) => state.authUser);
  const mealsError = useAppStore((state) => state.mealsError);
  const language = useAppStore((state) => state.language);
  const analyzeText = useAppStore((state) => state.analyzeText);
  
  const [saving, setSaving] = useState(false);
  const [analyzingText, setAnalyzingText] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  
  const [nutrition, setNutrition] = useState<Record<NutritionField, string>>({
    estimatedCalories: '',
    proteinG: '',
    fatG: '',
    carbsG: ''
  });

  const canSave = mealName.trim().length > 1 && toNumber(nutrition.estimatedCalories) > 0;

  const save = async () => {
    if (!canSave) return;

    setSaving(true);
    const timestamp = new Date().toISOString();
    const id = createLocalId();
    const meal: Meal = {
      id,
      userId: authUser?.id ?? profile.userId,
      mealName: mealName.trim(),
      mealType,
      estimatedCalories: toNumber(nutrition.estimatedCalories),
      proteinG: toNumber(nutrition.proteinG),
      fatG: toNumber(nutrition.fatG),
      carbsG: toNumber(nutrition.carbsG),
      aiNotes: t('manualMeal.manualNote'),
      createdAt: timestamp,
      updatedAt: timestamp,
      items: []
    };

    const savedMeal = await saveMeal(meal);
    setSaving(false);
    if (!savedMeal) return;
    router.replace('/(tabs)/history');
  };

  const estimateAi = async () => {
    if (mealName.trim().length < 2 || analyzingText) return;
    setAnalyzingText(true);
    try {
      const result = await analyzeText(mealName.trim());
      if (result) {
        setNutrition({
          estimatedCalories: String(result.estimatedCalories),
          proteinG: String(result.proteinG),
          fatG: String(result.fatG),
          carbsG: String(result.carbsG)
        });
      }
    } catch (err: any) {
      if (err.message === 'limit_exceeded') {
        router.push('/subscription');
      } else if (err.message === 'device_limit_reached') {
        Alert.alert(t('camera.analysisError'), t('camera.deviceLimitReached'));
      } else {
        const msg = err.message === 'Network request failed' ? t('common.noInternet') : (err.message || t('camera.analysisError'));
        Alert.alert(t('camera.analysisError'), msg);
      }
    } finally {
      setAnalyzingText(false);
    }
  };

  return <Screen>
    <View style={styles.nav}>
      <BackButton onPress={() => router.back()} />
      <Text style={styles.navTitle}>{t('manualMeal.title')}</Text>
      <View style={styles.navIcon}><Ionicons name="create-outline" size={19} color={colors.primary} /></View>
    </View>

    <View style={styles.hero}>
      <View style={styles.heroIcon}><Ionicons name="restaurant-outline" size={30} color={colors.primary} /></View>
      <Text style={styles.heroTitle}>{t('manualMeal.heroTitle')}</Text>
      <Text style={styles.heroText}>{t('manualMeal.heroText')}</Text>
    </View>

    <Text style={styles.section}>{t('manualMeal.detailsSection')}</Text>
    <View style={[styles.card, { zIndex: 10 }]}>
      <View style={{ position: 'relative', zIndex: 100 }}>
        <Field label={t('manualMeal.mealName')} value={mealName} onChange={setMealName} placeholder={t('manualMeal.placeholder', 'np. Serek wiejski, Banan...')} />
        {mealName.trim().length > 2 && (
          <Pressable style={styles.aiButton} onPress={estimateAi} disabled={analyzingText}>
            {analyzingText ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="sparkles" size={16} color={colors.primary} />}
            <Text style={styles.aiButtonText}>{analyzingText ? t('manualMeal.estimating') : t('manualMeal.estimateWithAi')}</Text>
          </Pressable>
        )}
      </View>
      
      <Text style={[styles.label, { marginTop: 14 }]}>{t('manualMeal.mealType')}</Text>
      <View style={styles.typeWrap}>
        {mealTypes.map((type) => <Pill key={type} label={t(`mealTypes.${type}`)} selected={mealType === type} onPress={() => setMealType(type)} />)}
      </View>
    </View>

    <Text style={styles.section}>{t('manualMeal.nutritionSection')}</Text>
    <View style={[styles.card, { zIndex: 1 }]}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <Field label={t('editMeal.calories')} value={nutrition.estimatedCalories} onChange={(value) => { setNutrition((current) => ({ ...current, estimatedCalories: value })); }} unit={t('common.kcal')} numeric />
        </View>
      </View>

      <View style={styles.macroGrid}>
        <Field label={t('editMeal.protein')} value={nutrition.proteinG} onChange={(value) => { setNutrition((current) => ({ ...current, proteinG: value })); }} unit={t('common.grams')} numeric compact />
        <Field label={t('editMeal.fat')} value={nutrition.fatG} onChange={(value) => { setNutrition((current) => ({ ...current, fatG: value })); }} unit={t('common.grams')} numeric compact />
        <Field label={t('editMeal.carbs')} value={nutrition.carbsG} onChange={(value) => { setNutrition((current) => ({ ...current, carbsG: value })); }} unit={t('common.grams')} numeric compact />
      </View>
    </View>

    {mealsError && <Text style={styles.error}>{mealsError}</Text>}
    <View style={[styles.actions, { zIndex: 0 }]}>
      <Button title={saving ? t('manualMeal.saving') : t('manualMeal.save')} onPress={save} disabled={!canSave || saving} />
      <Button title={t('common.backToCamera')} variant="ghost" onPress={() => router.back()} disabled={saving} />
    </View>
  </Screen>;
}

function Field({ label, value, onChange, placeholder, unit, numeric = false, compact = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  unit?: string;
  numeric?: boolean;
  compact?: boolean;
}) {
  return <View style={[styles.field, compact && styles.fieldCompact]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#A8B0A5"
        keyboardType={numeric ? 'number-pad' : 'default'}
        style={styles.input}
      />
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  nav: { paddingTop: 8, height: 61, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  navIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  hero: { marginTop: 12, borderRadius: radius.lg, padding: 20, backgroundColor: colors.primarySoft, alignItems: 'center' },
  heroIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFFB8', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  heroText: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  section: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 25, marginBottom: 10 },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 15 },
  aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, alignSelf: 'flex-start', marginTop: -4, marginBottom: 8, gap: 6 },
  aiButtonText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  field: { marginBottom: 14 },
  fieldCompact: { flex: 1, minWidth: 0 },
  label: { color: colors.text, fontSize: 12, fontWeight: '900', marginBottom: 8 },
  inputWrap: { minHeight: 50, borderRadius: radius.md, backgroundColor: '#F8FAF6', borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  input: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
  unit: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  typeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macroGrid: { flexDirection: 'row', gap: 8 },
  error: { color: colors.red, marginTop: 12, textAlign: 'center', fontSize: 12, fontWeight: '800' },
  actions: { gap: 8, marginTop: 24 }
});
