import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/src/i18n';
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { BackButton, Button, Screen } from '@/src/components/ui';
import { colors, radius, shadows } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';
import { weightFromKg, weightToKg, weightUnit } from '@/src/utils/units';

export default function WeightTrackerScreen() {
  const { t } = useTranslation();
  const weightLogs = useAppStore((state) => state.weightLogs);
  const logWeight = useAppStore((state) => state.logWeight);
  const deleteWeightLog = useAppStore((state) => state.deleteWeightLog);
  const unitSystem = useAppStore((state) => state.unitSystem);
  const [newWeight, setNewWeight] = useState('');

  const wUnit = weightUnit(unitSystem);
  const currentWeight = weightLogs.length ? weightFromKg(weightLogs[weightLogs.length - 1].weightKg, unitSystem) : 0;
  
  const handleSave = () => {
    const val = parseFloat(newWeight.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      // Convert to kg for storage
      logWeight(weightToKg(val, unitSystem));
      setNewWeight('');
    }
  };

  // Chart calculations – convert to display unit
  const CHART_HEIGHT = 200;
  const CHART_WIDTH = 320;
  
  const displayWeights = weightLogs.map(l => weightFromKg(l.weightKg, unitSystem));
  const minWeight = displayWeights.length ? Math.min(...displayWeights) - 2 : 0;
  const maxWeight = displayWeights.length ? Math.max(...displayWeights) + 2 : 100;
  const range = Math.max(maxWeight - minWeight, 1);

  const points = weightLogs.map((log, index) => {
    const displayW = weightFromKg(log.weightKg, unitSystem);
    const x = weightLogs.length > 1 ? (index / (weightLogs.length - 1)) * CHART_WIDTH : CHART_WIDTH / 2;
    const y = CHART_HEIGHT - ((displayW - minWeight) / range) * CHART_HEIGHT;
    return { x, y, value: displayW, date: log.date };
  });

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

  const placeholder = unitSystem === 'imperial'
    ? t('weightTracker.example', 'Np. 82.5').replace('82.5', '181.9')
    : t('weightTracker.example', 'Np. 82.5');

  return (
    <Screen>
      <View style={styles.nav}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.navTitle}>{t('weightTracker.title', 'Śledzenie Wagi')}</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('weightTracker.lastWeight', 'Ostatnia waga')}</Text>
        <Text style={styles.cardValue}>{currentWeight ? `${currentWeight} ${wUnit}` : t('weightTracker.noData', 'Brak danych')}</Text>
      </View>

      <View style={styles.chartContainer}>
        {weightLogs.length > 0 ? (
          <Svg width="100%" height={CHART_HEIGHT} viewBox={`-10 -10 ${CHART_WIDTH + 20} ${CHART_HEIGHT + 20}`}>
            <Polyline points={polylineStr} fill="none" stroke={colors.primary} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={6} fill={colors.surface} stroke={colors.primary} strokeWidth={3} />
            ))}
          </Svg>
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.line} />
            <Text style={styles.emptyText}>{t('weightTracker.addMeasurement', 'Dodaj pomiar aby zobaczyć wykres')}</Text>
          </View>
        )}
      </View>

      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>{t('weightTracker.addToday', 'Dodaj dzisiejszy pomiar')} ({wUnit})</Text>
        <View style={styles.inputRow}>
          <TextInput 
            style={styles.input}
            placeholder={placeholder}
            keyboardType="decimal-pad"
            value={newWeight}
            onChangeText={setNewWeight}
          />
          <View style={{ flex: 1 }}>
            <Button title={t('accountSettings.save', 'Zapisz')} onPress={handleSave} disabled={!newWeight} />
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>{t('weightTracker.history', 'Historia pomiarów')}</Text>
      <ScrollView style={styles.historyList}>
        {[...weightLogs].reverse().map(log => (
          <View key={log.id} style={styles.historyItem}>
            <View>
              <Text style={styles.historyDate}>{new Date(log.date).toLocaleDateString(i18n.language || 'en-US', { day: 'numeric', month: 'long' })}</Text>
              <Text style={styles.historyWeight}>{weightFromKg(log.weightKg, unitSystem)} {wUnit}</Text>
            </View>
            <Pressable hitSlop={10} onPress={() => deleteWeightLog(log.id)}>
              <Ionicons name="trash-outline" size={20} color={colors.red} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { paddingTop: 8, height: 61, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  card: { marginTop: 10, padding: 24, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center' },
  cardLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  cardValue: { color: colors.primary, fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 4 },
  chartContainer: { marginTop: 20, height: 220, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 10, ...shadows.card },
  emptyChart: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  addSection: { marginTop: 32 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, height: 50, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, fontSize: 16, fontWeight: '700', color: colors.text },
  historyList: { marginTop: 8 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  historyDate: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  historyWeight: { fontSize: 16, color: colors.text, fontWeight: '800', marginTop: 2 }
});
