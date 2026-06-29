import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Logo, Screen } from '@/src/components/ui';
import { colors, radius, shadows } from '@/src/constants/theme';
import { getDeviceLanguage, getLanguageMeta, SUPPORTED_LANGUAGES, type AppLanguage } from '@/src/i18n';
import { useAppStore } from '@/src/store/app-store';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const detectedLanguage = getDeviceLanguage();

  const choose = (code: AppLanguage) => {
    void setLanguage(code, false);
    setExpanded(false);
  };

  const continueToApp = async () => {
    await setLanguage(language, true);
    router.replace('/onboarding');
  };

  return <Screen style={styles.wrap}>
    <View style={styles.header}>
      <Logo />
      <View style={styles.badge}><Ionicons name="globe-outline" size={14} color={colors.primary} /><Text style={styles.badgeText}>{t('language.badge')}</Text></View>
    </View>

    <View style={styles.hero}>
      <View style={styles.icon}><Ionicons name="language-outline" size={34} color={colors.primary} /></View>
      <Text style={styles.title}>{t('language.title')}</Text>
      <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
      <View style={styles.detected}>
        <Text style={styles.detectedLabel}>{t('language.detected')}</Text>
        <Text style={styles.detectedValue}>{getLanguageMeta(detectedLanguage).flag} {getLanguageMeta(detectedLanguage).nativeName}</Text>
      </View>
    </View>

    <View style={styles.selector}>
      <LanguageCard item={getLanguageMeta(language)} selected onPress={() => setExpanded((value) => !value)} />
      <Pressable onPress={() => setExpanded((value) => !value)} style={styles.toggle}>
        <Text style={styles.toggleText}>{expanded ? t('language.hideList') : t('language.chooseOther')}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
      </Pressable>
      {expanded && <View style={styles.grid}>
        {SUPPORTED_LANGUAGES.filter((item) => item.code !== language).map((item) => (
          <LanguageCard key={item.code} item={item} onPress={() => choose(item.code)} />
        ))}
      </View>}
    </View>

    <View style={styles.actions}>
      <Text style={styles.selectedHint}>{t('language.selected')}: {getLanguageMeta(language).nativeName}</Text>
      <Button title={t('language.continue')} onPress={continueToApp} />
    </View>
  </Screen>;
}

function LanguageCard({ item, selected = false, onPress }: { item: ReturnType<typeof getLanguageMeta>; selected?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}>
    <Text style={styles.flag}>{item.flag}</Text>
    <View style={styles.cardCopy}>
      <Text style={[styles.nativeName, selected && styles.selectedText]}>{item.nativeName}</Text>
      <Text style={styles.englishName}>{item.englishName}</Text>
    </View>
    {selected ? <View style={styles.check}><Ionicons name="checkmark" size={15} color="#fff" /></View> : <Ionicons name="chevron-forward" size={18} color="#A5ADA4" />}
  </Pressable>;
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 26 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#D9EDCD' },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  hero: { marginTop: 30, alignItems: 'center', padding: 22, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  icon: { width: 68, height: 68, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 18, color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
  subtitle: { marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', fontWeight: '600' },
  detected: { marginTop: 18, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.backgroundAlt, flexDirection: 'row', alignItems: 'center', gap: 8 },
  detectedLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  detectedValue: { color: colors.text, fontSize: 12, fontWeight: '900' },
  selector: { marginTop: 18 },
  grid: { marginTop: 10, gap: 10 },
  toggle: { marginTop: 10, minHeight: 44, borderRadius: radius.pill, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#D9EDCD', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  toggleText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  card: { minHeight: 62, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, ...shadows.card },
  cardSelected: { borderColor: colors.primary, backgroundColor: '#F4FAEF' },
  pressed: { opacity: .84, transform: [{ scale: .99 }] },
  flag: { fontSize: 25 },
  cardCopy: { flex: 1 },
  nativeName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  selectedText: { color: colors.primary },
  englishName: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  check: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 10, marginTop: 20, paddingBottom: 8 },
  selectedHint: { color: colors.muted, fontSize: 12, fontWeight: '800', textAlign: 'center' }
});
