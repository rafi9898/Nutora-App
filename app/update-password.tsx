import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Screen } from '@/src/components/ui';
import { colors, radius } from '@/src/constants/theme';
import { updatePassword } from '@/src/services/backend/auth-service';

import { useTranslation } from 'react-i18next';

export default function UpdatePasswordScreen() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!password.trim() || !repeatPassword.trim()) {
      setErrorMsg(t('updatePassword.errEmpty'));
      setStatus('error');
      return;
    }

    if (password !== repeatPassword) {
      setErrorMsg(t('updatePassword.errMismatch'));
      setStatus('error');
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t('updatePassword.errShort'));
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg(null);

    try {
      await updatePassword(password);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('updatePassword.errDefault'));
      setStatus('error');
    }
  };

  return <Screen scroll={false} style={styles.wrap}>
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>{t('updatePassword.title')}</Text>
        <Text style={styles.subtitle}>{t('updatePassword.subtitle')}</Text>
      </View>

      {status === 'success' ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>{t('updatePassword.successTitle')}</Text>
          <Text style={styles.successText}>{t('updatePassword.successText')}</Text>
          <View style={{ marginTop: 20 }}>
            <Button title={t('updatePassword.goToApp')} onPress={() => router.replace('/(tabs)/home')} />
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          <View>
            <Text style={styles.label}>{t('updatePassword.newPass')}</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#A0A8A0"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>
          <View>
            <Text style={styles.label}>{t('updatePassword.repeatPass')}</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setRepeatPassword}
              placeholder="••••••••"
              placeholderTextColor="#A0A8A0"
              secureTextEntry
              style={styles.input}
              value={repeatPassword}
            />
          </View>
          {status === 'error' && errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
        </View>
      )}
    </View>

    {status !== 'success' && (
      <View style={styles.bottom}>
        <View >
          <Button title={t('updatePassword.saveNew')} onPress={submit} />
        </View>
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
