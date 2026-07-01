import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BackButton, Button, Screen } from '@/src/components/ui';
import { colors, radius, shadows } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';
import { revenueCatService } from '@/src/services/payments/revenuecat-service';
import type { PurchasesPackage } from 'react-native-purchases';

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const subscription = useAppStore((state) => state.subscription);
  const getAnalysesUsed = useAppStore((state) => state.getAnalysesUsed);
  const subscriptionStatus = useAppStore((state) => state.subscriptionStatus);
  const subscriptionError = useAppStore((state) => state.subscriptionError);
  const authUserId = useAppStore((state) => state.authUser?.id);
  const purchasePackage = useAppStore((state) => state.purchasePackage);
  const restorePurchases = useAppStore((state) => state.restorePurchases);
  
  const [message, setMessage] = useState<string | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isFetchingPackages, setIsFetchingPackages] = useState(true);

  const isPremium = subscription.tier === 'premium';
  const limitText = subscription.monthlyLimit === null || subscription.monthlyLimit === 9999
    ? t('subscription.unlimited')
    : t('subscription.monthlyUsage', { used: getAnalysesUsed(), limit: subscription.monthlyLimit });
  const isLoading = subscriptionStatus === 'loading' || isFetchingPackages;
  const benefits = t('subscription.benefits', { returnObjects: true }) as string[];

  useEffect(() => {
    async function loadPackages() {
      setIsFetchingPackages(true);
      if (!authUserId) {
        setPackages([]);
        setSelectedPackage(null);
        setIsFetchingPackages(false);
        return;
      }

      const availablePackages = await revenueCatService.getOfferings(authUserId);
      setPackages(availablePackages);
      
      // Domyślnie zaznacz pakiet roczny (najbardziej opłacalny)
      const yearly = availablePackages.find(p => p.packageType === 'ANNUAL' || p.identifier.toLowerCase().includes('year'));
      if (yearly) {
        setSelectedPackage(yearly);
      } else if (availablePackages.length > 0) {
        setSelectedPackage(availablePackages[0]);
      }
      setIsFetchingPackages(false);
    }
    loadPackages();
  }, [authUserId]);

  const buy = async () => {
    if (!selectedPackage) return;
    setMessage(null);
    const success = await purchasePackage(selectedPackage);
    setMessage(success ? t('subscription.activated') : null);
    if (success) router.replace('/(tabs)/camera');
  };

  const restore = async () => {
    setMessage(null);
    const success = await restorePurchases();
    setMessage(success ? t('subscription.restored') : null);
  };

  const monthlyPackage = packages.find(p => p.packageType === 'MONTHLY' || p.identifier.toLowerCase().includes('month'));
  const yearlyPackage = packages.find(p => p.packageType === 'ANNUAL' || p.identifier.toLowerCase().includes('year'));

  const isMonthlySelected = selectedPackage?.identifier === monthlyPackage?.identifier;
  const isYearlySelected = selectedPackage?.identifier === yearlyPackage?.identifier;

  return <Screen>
    <BackButton onPress={() => router.back()} />
    <View style={styles.hero}>
      <View style={styles.crown}><Ionicons name="sparkles" size={38} color="#fff" /></View>
      <Text style={styles.title}>{isPremium ? t('subscription.premiumActive') : t('subscription.title')}</Text>
      <Text style={styles.subtitle}>{isPremium && subscription.expiresAt ? `Aktywna do: ${new Date(subscription.expiresAt).toLocaleDateString('pl-PL')}` : t('subscription.subtitle')}</Text>
    </View>
    <View style={styles.usage}>
      <Text style={styles.usageLabel}>{t('subscription.yourLimit')}</Text>
      <Text style={styles.usageValue}>{limitText}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, {
          width: subscription.monthlyLimit === null || subscription.monthlyLimit === 9999 ? '100%' : `${Math.min((getAnalysesUsed() / Math.max(subscription.monthlyLimit, 1)) * 100, 100)}%`
        }]} />
      </View>
    </View>

    {isFetchingPackages ? (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    ) : packages.length === 0 ? (
      <View style={styles.loaderContainer}>
         <Text style={styles.error}>{t('subscription.loadError', 'Nie udało się pobrać pakietów. Sprawdź połączenie z internetem.')}</Text>
      </View>
    ) : (
      <View style={styles.plansContainer}>
        {monthlyPackage && (
          <Pressable style={[styles.planCard, isMonthlySelected && styles.planCardActive]} onPress={() => setSelectedPackage(monthlyPackage)}>
            <View style={styles.planTop}>
              <Text style={[styles.planLabel, isMonthlySelected && styles.planLabelActive]}>{t('subscription.planMonthly')}</Text>
              <View style={[styles.radio, isMonthlySelected && styles.radioActive]}>
                {isMonthlySelected && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={[styles.price, isMonthlySelected && styles.priceActive]}>{monthlyPackage.product.priceString}</Text>
            <Text style={[styles.period, isMonthlySelected && styles.periodActive]}>{t('subscription.priceMonthlyPeriod')}</Text>
          </Pressable>
        )}

        {yearlyPackage && (
          <Pressable style={[styles.planCard, isYearlySelected && styles.planCardActive]} onPress={() => setSelectedPackage(yearlyPackage)}>
            <View style={styles.badge}><Text style={styles.badgeText}>{t('subscription.savePercentage')}</Text></View>
            <View style={styles.planTop}>
              <Text style={[styles.planLabel, isYearlySelected && styles.planLabelActive]}>{t('subscription.planYearly')}</Text>
              <View style={[styles.radio, isYearlySelected && styles.radioActive]}>
                {isYearlySelected && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={[styles.price, isYearlySelected && styles.priceActive]}>{yearlyPackage.product.priceString}</Text>
            <Text style={[styles.period, isYearlySelected && styles.periodActive]}>{t('subscription.priceYearlyPeriod')}</Text>
          </Pressable>
        )}
      </View>
    )}

    <View style={styles.plan}>
      {benefits.map((item) => <View key={item} style={styles.benefit}>
        <View style={styles.check}><Ionicons name="checkmark" size={14} color={colors.primary} /></View>
        <Text style={styles.benefitText}>{item}</Text>
      </View>)}
    </View>
    {(subscriptionError || message) && <Text style={[styles.status, subscriptionError && styles.error]}>{subscriptionError || message}</Text>}
    <View style={styles.bottom}>
      <Button title={isPremium ? t('common.backToCamera') : isLoading ? t('subscription.processing') : t('subscription.activate')} onPress={isPremium ? () => router.replace('/(tabs)/camera') : buy} disabled={isLoading || packages.length === 0} />
      <Pressable onPress={restore} disabled={isLoading} style={styles.restoreButton}>
        <Text style={styles.restore}>{t('common.restorePurchase')}</Text>
      </Pressable>
      <Text style={styles.legal}>{t('subscription.legal')}</Text>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 9 },
  crown: { height: 78, width: 78, borderRadius: 39, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.button },
  title: { fontSize: 30, color: colors.text, fontWeight: '800', letterSpacing: -1, textAlign: 'center', lineHeight: 36, marginTop: 20 },
  subtitle: { color: colors.muted, textAlign: 'center', lineHeight: 20, fontSize: 13, marginTop: 13, paddingHorizontal: 14 },
  usage: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 16, marginTop: 24, ...shadows.card },
  usageLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  usageValue: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 7 },
  track: { height: 7, borderRadius: 99, backgroundColor: '#E8ECE5', marginTop: 13, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 99 },
  loaderContainer: { padding: 30, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  plansContainer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  planCard: { flex: 1, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, padding: 14, position: 'relative' },
  planCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  planLabelActive: { color: colors.primary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  price: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 12 },
  priceActive: { color: colors.text },
  period: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  periodActive: { color: colors.primary },
  badge: { position: 'absolute', top: -10, left: 14, backgroundColor: colors.orange, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  plan: { borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface, padding: 19, marginTop: 16, ...shadows.card },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 },
  check: { backgroundColor: colors.primarySoft, height: 23, width: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  benefitText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  status: { color: colors.primary, textAlign: 'center', fontWeight: '700', fontSize: 12, marginTop: 14 },
  error: { color: colors.red },
  bottom: { marginTop: 24, gap: 12 },
  restoreButton: { alignItems: 'center', paddingVertical: 3 },
  restore: { textAlign: 'center', color: colors.primary, fontSize: 13, fontWeight: '800', marginTop: 3 },
  legal: { textAlign: 'center', color: colors.muted, fontSize: 10, lineHeight: 14, paddingHorizontal: 20 }
});
