import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { BackButton, Button, Pill, Screen } from '@/src/components/ui';
import { colors, radius } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';
import type { UserGoal } from '@/src/types';
import { weightToKg, weightFromKg, weightUnit, feetInchesToCm, cmToFeetInches } from '@/src/utils/units';

const goalOptions = ['lose_weight', 'maintain', 'gain_weight'] as const;
const activityOptions = ['low', 'medium', 'high'] as const;

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const logWeight = useAppStore((state) => state.logWeight);
  const setHasOnboarded = useAppStore((state) => state.setHasOnboarded);
  const authError = useAppStore((state) => state.authError);
  const unitSystem = useAppStore((state) => state.unitSystem);
  const setUnitSystem = useAppStore((state) => state.setUnitSystem);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name === 'Alex' ? '' : profile.name);
  const [gender, setGender] = useState<'male' | 'female'>(profile.gender === 'female' ? 'female' : 'male');
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');

  // Height: for metric we store cm directly; for imperial we use feet+inches inputs
  const initialFtIn = profile.heightCm ? cmToFeetInches(profile.heightCm) : { feet: 0, inches: 0 };
  const [height, setHeight] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [heightFt, setHeightFt] = useState(initialFtIn.feet ? String(initialFtIn.feet) : '');
  const [heightIn, setHeightIn] = useState(initialFtIn.inches ? String(initialFtIn.inches) : '');

  // Weight: for metric we store kg directly; for imperial we convert to/from lbs
  const initialDisplayWeight = profile.weightKg
    ? String(weightFromKg(profile.weightKg, unitSystem))
    : '';
  const [weight, setWeight] = useState(initialDisplayWeight);

  const [goal, setGoal] = useState<UserGoal>(profile.goal);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const steps = t('profileSetup.steps', { returnObjects: true }) as string[];

  // Derive internal values for calculations (always in metric)
  const weightKg = useMemo(() => {
    const val = parseFloat(weight.replace(',', '.'));
    if (!val || isNaN(val)) return 0;
    return weightToKg(val, unitSystem);
  }, [weight, unitSystem]);

  const heightCm = useMemo(() => {
    let cm = 0;
    if (unitSystem === 'imperial') {
      const ft = parseInt(heightFt) || 0;
      const inches = parseInt(heightIn) || 0;
      cm = ft > 0 ? feetInchesToCm(ft, inches) : 0;
    } else {
      cm = parseFloat(height.replace(',', '.')) || 0;
    }
    return Math.round(cm);
  }, [height, heightFt, heightIn, unitSystem]);

  const isStep0Valid = name.trim().length > 0 && Number(age) > 0 && heightCm > 0 && weightKg > 0;

  const dailyGoal = useMemo(() => {
    const w = weightKg || 70;
    const h = heightCm || 170;
    const a = Number(age) || 30;
    
    // Równanie Mifflina-St Jeora
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr += gender === 'male' ? 5 : -161;

    // Mnożnik aktywności
    const activityMultiplier = activityLevel === 'high' ? 1.725 : activityLevel === 'low' ? 1.2 : 1.55;
    const tdee = bmr * activityMultiplier;

    // Cel
    const goalAdjustment = goal === 'lose_weight' ? -500 : goal === 'gain_weight' ? 500 : 0;
    return Math.round(tdee + goalAdjustment);
  }, [activityLevel, goal, weightKg, heightCm, age, gender]);

  const bmi = useMemo(() => {
    if (!heightCm || !weightKg) return null;
    return (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
  }, [heightCm, weightKg]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return '';
    const b = Number(bmi);
    if (b < 18.5) return t('profileSetup.bmiUnderweight', 'Niedowaga');
    if (b < 25) return t('profileSetup.bmiNormal', 'Waga w normie');
    if (b < 30) return t('profileSetup.bmiOverweight', 'Nadwaga');
    return t('profileSetup.bmiObese', 'Otyłość');
  }, [bmi]);

  const saveAndContinue = async () => {
    await updateProfile({
      ...profile,
      name: name.trim() || profile.name,
      gender,
      age: parseInt(age) || undefined,
      heightCm: heightCm || undefined,
      weightKg: weightKg || undefined,
      goal,
      activityLevel,
      dailyCalorieGoal: dailyGoal,
      proteinGoalG: Math.round(dailyGoal * 0.3 / 4),
      fatGoalG: Math.round(dailyGoal * 0.3 / 9),
      carbsGoalG: Math.round(dailyGoal * 0.4 / 4)
    });
    if (weightKg) {
      logWeight(weightKg);
    }
    setHasOnboarded(true);
    router.replace('/(tabs)/home');
  };

  const next = () => step < 2 ? setStep(step + 1) : void saveAndContinue();

  const wUnit = weightUnit(unitSystem);

  return <Screen style={styles.wrap}>
    <View style={styles.nav}>
      {step > 0 ? (
        <BackButton onPress={() => setStep(step - 1)} />
      ) : (
        <View style={{ width: 44, height: 44 }} />
      )}
      <Text style={styles.counter}>{step + 1} / 3</Text>
    </View>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} /></View>
    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>{t('profileSetup.kicker')}</Text>
      <Text style={styles.title}>{steps[step]}</Text>
      {step === 0 && <View style={styles.fields}>
        <Field label={t('profileSetup.name')} value={name} onChangeText={setName} />
        
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>{t('profileSetup.gender', 'Płeć')}</Text>
          <View style={styles.inlinePills}>
            <Pill label={t('profileSetup.genderMale', 'Mężczyzna')} selected={gender === 'male'} onPress={() => setGender('male')} />
            <Pill label={t('profileSetup.genderFemale', 'Kobieta')} selected={gender === 'female'} onPress={() => setGender('female')} />
          </View>
        </View>

        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>{t('accountSettings.unitSystem')}</Text>
          <View style={styles.inlinePills}>
            <Pill label={t('accountSettings.unitMetric')} selected={unitSystem === 'metric'} onPress={() => setUnitSystem('metric')} />
            <Pill label={t('accountSettings.unitImperial')} selected={unitSystem === 'imperial'} onPress={() => setUnitSystem('imperial')} />
          </View>
        </View>

        <View style={styles.row}>
          <Field label={t('profileSetup.age')} value={age} onChangeText={setAge} numeric compact />
          {unitSystem === 'imperial' ? (
            <>
              <Field label={t('profileSetup.height') + ' (ft)'} value={heightFt} onChangeText={setHeightFt} numeric compact />
              <Field label="(in)" value={heightIn} onChangeText={setHeightIn} numeric compact />
            </>
          ) : (
            <Field label={t('profileSetup.height') + ' (cm)'} value={height} onChangeText={setHeight} numeric compact />
          )}
        </View>
        <Field label={`${t('profileSetup.weight')} (${wUnit})`} value={weight} onChangeText={setWeight} numeric />
      </View>}
      {step === 1 && <View style={styles.goalWrap}>
        <Text style={styles.question}>{t('profileSetup.goalQuestion')}</Text>
        {goalOptions.map((item) => <Pill key={item} label={t(`profileSetup.goals.${item}`)} selected={goal === item} onPress={() => setGoal(item)} />)}
        <Text style={[styles.question, { marginTop: 26 }]}>{t('profileSetup.activityQuestion')}</Text>
        <View style={styles.inlinePills}>{activityOptions.map((item) => <Pill key={item} label={t(`profileSetup.activity.${item}`)} selected={activityLevel === item} onPress={() => setActivityLevel(item)} />)}</View>
      </View>}
      {step === 2 && <View style={styles.ready}>
        <View style={styles.readyIcon}><Ionicons name="sparkles" size={36} color={colors.primary} /></View>
        <Text style={styles.readyTitle}>{t('profileSetup.readyTitle', { dailyGoal })}</Text>
        <Text style={styles.readyText}>{t('profileSetup.readyText')}</Text>
        <View style={styles.calorie}><Text style={styles.calorieValue}>{dailyGoal}</Text><Text style={styles.calorieUnit}>{t('profileSetup.perDay')}</Text></View>
        
        {bmi && (
          <View style={styles.bmiWrap}>
            <Text style={styles.bmiText}>{t('profileSetup.yourBmi', 'Twoje BMI:')} <Text style={styles.bmiBold}>{bmi}</Text></Text>
            <Text style={[styles.bmiCategory, Number(bmi) < 18.5 || Number(bmi) >= 25 ? { color: colors.orange } : {}]}>{bmiCategory}</Text>
          </View>
        )}

        {authError && <Text style={styles.error}>{authError}</Text>}
      </View>}
    </ScrollView>
    <Button title={step === 2 ? t('profileSetup.finish') : t('profileSetup.next')} onPress={next} disabled={step === 0 && !isStep0Valid} />
  </Screen>;
}

function Field({ label, value, onChangeText, numeric, compact }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  numeric?: boolean;
  compact?: boolean;
}) {
  return <View style={compact && { flex: 1 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType={numeric ? 'numeric' : 'default'} />
  </View>;
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, justifyContent: 'space-between' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  progress: { height: 5, backgroundColor: colors.line, borderRadius: 99, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 99 },
  content: { flex: 1, paddingTop: 45 },
  kicker: { color: colors.primary, fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  title: { fontSize: 32, color: colors.text, fontWeight: '800', letterSpacing: -.8, marginTop: 10 },
  fields: { gap: 20, marginTop: 42 },
  row: { flexDirection: 'row', gap: 13 },
  label: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 8 },
  input: { height: 53, borderRadius: radius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.text, fontSize: 16 },
  goalWrap: { gap: 10, marginTop: 38 },
  question: { fontSize: 16, color: colors.text, fontWeight: '800', marginBottom: 7 },
  inlinePills: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, justifyContent: 'space-between', padding: 4 },
  ready: { alignItems: 'center', marginTop: 55 },
  readyIcon: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  readyTitle: { fontSize: 26, color: colors.text, fontWeight: '800', marginTop: 22, textAlign: 'center' },
  readyText: { textAlign: 'center', color: colors.muted, lineHeight: 21, marginTop: 12, paddingHorizontal: 15 },
  calorie: { alignItems: 'center', marginTop: 31 },
  calorieValue: { fontSize: 57, lineHeight: 63, color: colors.primary, fontWeight: '800', letterSpacing: -2 },
  calorieUnit: { fontSize: 14, color: colors.muted, fontWeight: '700' },
  error: { color: colors.red, textAlign: 'center', marginTop: 16, fontSize: 12, fontWeight: '700' },
  bmiWrap: { marginTop: 28, padding: 14, borderRadius: radius.md, backgroundColor: '#f4f5f4', borderWidth: 1, borderColor: colors.line, width: '100%', alignItems: 'center' },
  bmiText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  bmiBold: { fontWeight: '900', color: colors.primary },
  bmiCategory: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }
});
