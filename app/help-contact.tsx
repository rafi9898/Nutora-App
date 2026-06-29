import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { BackButton, Button, Screen } from '@/src/components/ui';
import { colors, radius } from '@/src/constants/theme';

const links = {
  support: 'mailto:support@nutora.pro',
  contact: 'mailto:contact@nutora.pro',
  website: 'https://nutora.pro',
  privacy: 'https://nutora.pro/privacy',
  terms: 'https://nutora.pro/terms'
};

export default function HelpContactScreen() {
  const { t } = useTranslation();

  return <Screen>
    <View style={styles.header}>
      <BackButton onPress={() => router.back()} />
      <Text style={styles.title}>{t('help.title')}</Text>
      <View style={styles.headerIcon}><Ionicons name="help-circle-outline" size={20} color={colors.primary} /></View>
    </View>

    <View style={styles.hero}>
      <View style={styles.heroIcon}><Ionicons name="chatbubbles-outline" size={30} color={colors.primary} /></View>
      <Text style={styles.heroTitle}>{t('help.heroTitle')}</Text>
      <Text style={styles.heroText}>{t('help.heroText')}</Text>
      <Button title={t('help.writeSupport')} icon="mail-outline" onPress={() => void Linking.openURL(links.support)} />
    </View>

    <Text style={styles.section}>{t('help.quickLinks')}</Text>
    <View style={styles.list}>
      <HelpRow icon="mail-outline" label={t('help.support')} value="support@nutora.pro" onPress={() => void Linking.openURL(links.support)} />
      <HelpRow icon="briefcase-outline" label={t('help.contact')} value="contact@nutora.pro" onPress={() => void Linking.openURL(links.contact)} />
      <HelpRow icon="globe-outline" label={t('help.website')} value="nutora.pro" onPress={() => void Linking.openURL(links.website)} />
      <HelpRow icon="shield-checkmark-outline" label={t('help.privacy')} value="nutora.pro/privacy" onPress={() => void Linking.openURL(links.privacy)} />
      <HelpRow icon="document-text-outline" label={t('help.terms')} value="nutora.pro/terms" onPress={() => void Linking.openURL(links.terms)} />
    </View>

    <Text style={styles.section}>{t('help.faqTitle')}</Text>
    <View style={styles.faq}>
      <FaqItem question={t('help.faqAiQuestion')} answer={t('help.faqAiAnswer')} />
      <FaqItem question={t('help.faqPhotoQuestion')} answer={t('help.faqPhotoAnswer')} />
      <FaqItem question={t('help.faqPremiumQuestion')} answer={t('help.faqPremiumAnswer')} />
    </View>
  </Screen>;
}

function HelpRow({ icon, label, value, onPress }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    <View style={styles.rowIcon}><Ionicons name={icon} size={19} color={colors.primary} /></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
    <Ionicons name="open-outline" size={18} color="#A5ADA4" />
  </Pressable>;
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return <View style={styles.faqItem}>
    <Text style={styles.question}>{question}</Text>
    <Text style={styles.answer}>{answer}</Text>
  </View>;
}

const styles = StyleSheet.create({
  header: { paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -.4 },
  headerIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  hero: { marginTop: 20, padding: 20, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  heroText: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  section: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 26, marginBottom: 10 },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  row: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  pressed: { opacity: .82 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: colors.text, fontSize: 14, fontWeight: '900' },
  rowValue: { color: colors.muted, fontSize: 12, marginTop: 2 },
  faq: { gap: 10 },
  faqItem: { padding: 15, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  question: { color: colors.text, fontSize: 14, fontWeight: '900' },
  answer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }
});
