import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { BackButton, Button, Screen } from '@/src/components/ui';
import { colors, radius } from '@/src/constants/theme';
import { resetPassword } from '@/src/services/backend/auth-service';
const translateError = (error: unknown, t: any) => {
  if (!(error instanceof Error)) return t('resetPassword.defaultError');
  const msg = error.message.toLowerCase();
  if (msg.includes('rate limit')) return t('resetPassword.errRateLimit');
  if (msg.includes('network request failed')) return t('resetPassword.errNetwork');
  if (msg.includes('user not found')) return t('resetPassword.errUserNotFound');
  return t('resetPassword.defaultError');
};
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) {
      setErrorMsg(t('resetPassword.missingEmail'));
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg(null);

    try {
      await resetPassword(email.trim());
      setStatus('success');
    } catch (err) {
      setErrorMsg(translateError(err, t));
      setStatus('error');
    }
  };

  return <Screen scroll={false} style={styles.wrap}>
    <View>
      {router.canGoBack() && <BackButton onPress={() => router.back()} />}
      <View style={styles.header}>
        <Text style={styles.title}>{t('resetPassword.title')}</Text>
        <Text style={styles.subtitle}>{t('resetPassword.subtitle')}</Text>
      </View>

      {status === 'success' ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>{t('resetPassword.successTitle')}</Text>
          <Text style={styles.successText}>{t('resetPassword.successText')}</Text>
          <View style={{ marginTop: 24 }}>
            <Button title={t('resetPassword.backToLogin')} onPress={() => router.replace('/login')} />
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          <View>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="anna@example.com"
              placeholderTextColor="#A0A8A0"
              style={styles.input}
              value={email}
            />
          </View>
          {status === 'error' && errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
        </View>
      )}
    </View>

    {status !== 'success' && (
      <View style={styles.bottom}>
        <Button title={status === 'loading' ? t('resetPassword.sending') : t('resetPassword.sendLink')} onPress={submit} disabled={status === 'loading'} />
        {status === 'loading' && <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />}
      </View>
    )}
  </Screen>;
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'space-between', paddingTop: 8 },
  header: { marginTop: 20, gap: 12 },
  title: { fontSize: 31, letterSpacing: -.8, fontWeight: '800', color: colors.text, marginTop: 22 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  form: { gap: 18, marginTop: 42 },
  label: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  input: { height: 54, borderRadius: radius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.text, fontSize: 16 },
  error: { color: colors.red, fontWeight: '700', fontSize: 13, lineHeight: 18 },
  bottom: { gap: 10, paddingBottom: 20 },
  successBox: { marginTop: 40, padding: 20, backgroundColor: '#F1F9E8', borderRadius: radius.lg, borderWidth: 1, borderColor: '#DCEFD1' },
  successTitle: { color: colors.primary, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  successText: { color: colors.text, fontSize: 15, lineHeight: 22 }
});
