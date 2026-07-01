import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { BackButton, Button, Logo, Screen } from '@/src/components/ui';
import { isSupabaseMode } from '@/src/config/env';
import { colors, radius } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const loginWithEmail = useAppStore((state) => state.loginWithEmail);
  const loginWithProvider = useAppStore((state) => state.loginWithProvider);
  const authStatus = useAppStore((state) => state.authStatus);
  const authError = useAppStore((state) => state.authError);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const isLoading = authStatus === 'loading';

  useFocusEffect(
    useCallback(() => {
      setLocalError(null);
      clearAuthError();
    }, [clearAuthError])
  );

  const submit = async () => {
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError(t('auth.loginMissing'));
      return;
    }

    const success = await loginWithEmail({ email: email.trim(), password });
    if (success) router.replace('/(tabs)/home');
  };

  const socialLogin = async (provider: 'google' | 'facebook') => {
    setLocalError(null);
    const success = await loginWithProvider(provider);
    if (success) {
      const hasOnboarded = useAppStore.getState().hasOnboarded;
      router.replace(hasOnboarded ? '/(tabs)/home' : '/profile-setup');
    }
  };

  return <Screen scroll={false} style={styles.wrap}>
    <View>
      {router.canGoBack() && <BackButton onPress={() => router.back()} />}
      <View style={styles.header}>
        <Logo />
        <Text style={styles.title}>{t('auth.loginTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
      </View>
      <View style={styles.form}>
        <Field label={t('auth.email')} placeholder="anna@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label={t('auth.password')} placeholder="••••••••" value={password} onChangeText={setPassword} secure />
        <Text style={styles.forgot} onPress={() => router.push('/forgot-password')}>{t('auth.forgotPassword')}</Text>
        {(localError || authError) && <Text style={styles.error}>{localError || authError}</Text>}
      </View>
    </View>
    <View style={styles.bottom}>
      <Button title={isLoading ? t('auth.loggingIn') : t('auth.login')} onPress={submit} disabled={isLoading} />
      {isLoading && <ActivityIndicator color={colors.primary} />}
      <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>{t('common.or')}</Text><View style={styles.line} /></View>
      <Button title={t('common.google')} variant="outline" icon="logo-google" onPress={() => socialLogin('google')} disabled={isLoading} />
      <Text style={styles.account}>{t('auth.noAccount')} <Text onPress={() => router.push('/register')} style={styles.link}>{t('auth.createAccountLink')}</Text></Text>
      
    </View>
  </Screen>;
}

function Field({ label, placeholder, secure, value, onChangeText, keyboardType = 'default' }: {
  label: string;
  placeholder: string;
  secure?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address';
}) {
  return <View>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      autoCapitalize="none"
      keyboardType={keyboardType}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#A0A8A0"
      secureTextEntry={secure}
      style={styles.input}
      value={value}
    />
  </View>;
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'space-between', paddingTop: 8 },
  header: { marginTop: 20, gap: 12 },
  title: { fontSize: 31, letterSpacing: -.8, fontWeight: '800', color: colors.text, marginTop: 22 },
  subtitle: { color: colors.muted, fontSize: 15 },
  form: { gap: 18, marginTop: 42 },
  label: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  input: { height: 54, borderRadius: radius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.text, fontSize: 16 },
  forgot: { color: colors.primary, textAlign: 'right', fontWeight: '700', fontSize: 13 },
  error: { color: colors.red, fontWeight: '700', fontSize: 13, lineHeight: 18 },
  modeHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  bottom: { gap: 10 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 3 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  or: { color: colors.muted, fontSize: 12 },
  account: { textAlign: 'center', color: colors.muted, marginTop: 8, fontSize: 13 },
  link: { color: colors.primary, fontWeight: '800' }
});
