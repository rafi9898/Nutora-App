import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TextInput, View, Switch, Pressable } from 'react-native';
import { BackButton, Button, Pill, Screen } from '@/src/components/ui';
import { isSupabaseMode } from '@/src/config/env';
import { colors, radius } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';
import type { UnitSystem } from '@/src/utils/units';

export default function AccountSettingsScreen() {
  const { t } = useTranslation();
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const authUser = useAppStore((state) => state.authUser);
  const notificationsEnabled = useAppStore((state) => state.notificationsEnabled);
  const toggleNotifications = useAppStore((state) => state.toggleNotifications);
  const unitSystem = useAppStore((state) => state.unitSystem);
  const setUnitSystem = useAppStore((state) => state.setUnitSystem);
  const [name, setName] = useState(profile.name);
  const [dailyGoal, setDailyGoal] = useState(String(profile.dailyCalorieGoal));
  const [proteinGoal, setProteinGoal] = useState(String(profile.proteinGoalG));
  const [fatGoal, setFatGoal] = useState(String(profile.fatGoalG));
  const [carbsGoal, setCarbsGoal] = useState(String(profile.carbsGoalG));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await updateProfile({
      ...profile,
      name: name.trim() || profile.name,
      dailyCalorieGoal: Number(dailyGoal) || profile.dailyCalorieGoal,
      proteinGoalG: Number(proteinGoal) || profile.proteinGoalG,
      fatGoalG: Number(fatGoal) || profile.fatGoalG,
      carbsGoalG: Number(carbsGoal) || profile.carbsGoalG
    });
    setSaving(false);
    Alert.alert(t('accountSettings.savedTitle'), t('accountSettings.savedText'));
  };

  return <Screen>
    <View style={styles.header}>
      <BackButton onPress={() => router.back()} />
      <Text style={styles.title}>{t('accountSettings.title')}</Text>
      <View style={styles.headerIcon}><Ionicons name="settings-outline" size={19} color={colors.primary} /></View>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('accountSettings.profileData')}</Text>
      <Field label={t('auth.name')} value={name} onChangeText={setName} />
      <Field label={t('profile.dailyGoal')} value={dailyGoal} onChangeText={setDailyGoal} keyboardType="numeric" />
      
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label={t('profileSetup.proteinGoal', 'Białko (g)')} value={proteinGoal} onChangeText={setProteinGoal} keyboardType="numeric" /></View>
        <View style={{ flex: 1 }}><Field label={t('profileSetup.fatGoal', 'Tłuszcze (g)')} value={fatGoal} onChangeText={setFatGoal} keyboardType="numeric" /></View>
        <View style={{ flex: 1 }}><Field label={t('profileSetup.carbsGoal', 'Węgle (g)')} value={carbsGoal} onChangeText={setCarbsGoal} keyboardType="numeric" /></View>
      </View>
      
      {!isSupabaseMode && <Text style={styles.hint}>{t('accountSettings.localHint')}</Text>}
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('accountSettings.unitSystem')}</Text>
      <View style={styles.unitRow}>
        <Pill label={t('accountSettings.unitMetric')} selected={unitSystem === 'metric'} onPress={() => setUnitSystem('metric')} />
        <Pill label={t('accountSettings.unitImperial')} selected={unitSystem === 'imperial'} onPress={() => setUnitSystem('imperial')} />
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('accountSettings.accountStatus')}</Text>
      <InfoRow icon="person-circle-outline" label={t('accountSettings.userId')} value={authUser?.id ?? profile.userId} />
      <InfoRow icon="cloud-outline" label={t('accountSettings.mode')} value={isSupabaseMode ? t('profile.supabaseAccount') : t('profile.demoMode')} />
      <InfoRow icon="shield-checkmark-outline" label={t('accountSettings.dataStorage')} value={isSupabaseMode ? t('accountSettings.cloudStorage') : t('accountSettings.localStorage')} />
    </View>

    <View style={[styles.card, { marginBottom: 24 }]}>
      <Text style={styles.cardTitle}>{t('accountSettings.notificationsTitle', 'Powiadomienia i Nawyk')}</Text>
      <View style={styles.switchRow}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.switchLabel}>{t('accountSettings.notificationsSub', 'Codzienne przypomnienia')}</Text>
          <Text style={styles.switchHint}>{t('accountSettings.notificationsDesc', 'Otrzymuj przypomnienia o logowaniu posiłków na obiad i kolację.')}</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: colors.line, true: colors.primary }}
        />
      </View>
    </View>

    <Button title={saving ? t('accountSettings.saving') : t('accountSettings.save')} onPress={save} disabled={saving} />

    <View style={styles.dangerZone}>
      <Text style={styles.dangerTitle}>{t('accountSettings.dangerZone', 'Strefa niebezpieczna')}</Text>
      
      <Pressable style={styles.dangerButton} onPress={() => {
        Alert.alert(
          t('accountSettings.clearData', 'Wyczyść wszystkie dane'),
          t('accountSettings.clearDataConfirm', 'Czy na pewno chcesz usunąć całą historię swoich posiłków? Tej akcji nie da się cofnąć.'),
          [
            { text: t('common.cancel', 'Anuluj'), style: 'cancel' },
            { text: t('accountSettings.yesClear', 'Tak, wyczyść'), style: 'destructive', onPress: async () => {
              const success = await useAppStore.getState().resetData();
              if (success) {
                Alert.alert(t('accountSettings.success', 'Sukces'), t('accountSettings.cleared', 'Twoje dane zostały wyczyszczone.'));
              } else {
                Alert.alert(t('accountSettings.error', 'Błąd'), t('accountSettings.clearError', 'Nie udało się wyczyścić danych.'));
              }
            }}
          ]
        );
      }}>
        <Text style={styles.dangerButtonText}>{t('accountSettings.clearDataBtn', 'Wyczyść historię posiłków')}</Text>
      </Pressable>

      <Pressable style={styles.dangerButton} onPress={() => {
        Alert.alert(
          t('accountSettings.deleteAccountTitle', 'Usuń konto bezpowrotnie'),
          t('accountSettings.deleteAccountDesc', 'Czy na pewno chcesz trwale usunąć swoje konto oraz wszystkie powiązane z nim dane? Utracisz również aktywną subskrypcję. Tej akcji nie da się cofnąć!'),
          [
            { text: t('common.cancel', 'Anuluj'), style: 'cancel' },
            { text: t('accountSettings.deleteAccountConfirm', 'Tak, usuń moje konto'), style: 'destructive', onPress: async () => {
              const success = await useAppStore.getState().deleteAccount();
              if (!success) {
                Alert.alert(t('accountSettings.error', 'Błąd'), t('accountSettings.deleteAccountError', 'Nie udało się usunąć konta. Spróbuj zalogować się ponownie i ponowić próbę.'));
              } else {
                router.replace('/');
              }
            }}
          ]
        );
      }}>
        <Text style={styles.dangerButtonText}>{t('accountSettings.deleteAccountBtn', 'Usuń konto')}</Text>
      </Pressable>
    </View>
  </Screen>;
}

function Field({ label, value, onChangeText, keyboardType = 'default', editable = true }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  editable?: boolean;
}) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, !editable && styles.inputDisabled]}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      editable={editable}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
    />
  </View>;
}

function InfoRow({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return <View style={styles.infoRow}>
    <View style={styles.infoIcon}><Ionicons name={icon} size={18} color={colors.primary} /></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -.4 },
  headerIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  card: { marginTop: 18, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: 14 },
  field: { marginBottom: 14 },
  label: { color: colors.text, fontWeight: '800', fontSize: 12, marginBottom: 8 },
  input: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, color: colors.text, paddingHorizontal: 14, fontSize: 15, fontWeight: '700' },
  inputDisabled: { color: colors.muted, backgroundColor: '#EEF2EB' },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  unitRow: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, justifyContent: 'space-between', padding: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  infoIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingRight: 4 },
  switchLabel: { color: colors.text, fontSize: 13, fontWeight: '700' },
  switchHint: { color: colors.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  dangerZone: { marginTop: 48, marginBottom: 40, paddingHorizontal: 12 },
  dangerTitle: { color: colors.red, fontSize: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  dangerButton: { backgroundColor: '#FF3B3015', paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.md, marginBottom: 12, borderWidth: 1, borderColor: '#FF3B3030' },
  dangerButtonText: { color: colors.red, fontSize: 14, fontWeight: '700', textAlign: 'center' }
});
