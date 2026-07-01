import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { BackButton, Button, Logo, Screen } from '@/src/components/ui';
import { colors, radius } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const registerWithEmail = useAppStore((state) => state.registerWithEmail);
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

    if (!name.trim() || !email.trim() || password.length < 8) {
      setLocalError(t('auth.registerMissing'));
      return;
    }

    if (password !== repeatPassword) {
      setLocalError(t('auth.passwordsMismatch'));
      return;
    }

    const success = await registerWithEmail({ name: name.trim(), email: email.trim(), password });
    if (success) router.push('/profile-setup');
  };

  const socialLogin = async (provider: 'google' | 'facebook') => {
    setLocalError(null);
    const success = await loginWithProvider(provider);
    if (success) {
      const hasOnboarded = useAppStore.getState().hasOnboarded;
      router.replace(hasOnboarded ? '/(tabs)/home' : '/profile-setup');
    }
  };

  return <Screen style={styles.wrap}>
    {router.canGoBack() && <BackButton onPress={() => router.back()} />}
    <View style={styles.header}>
      <Logo />
      <Text style={styles.title}>{t('auth.registerTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
    </View>
    <View style={styles.form}>
      <Field label={t('auth.name')} placeholder={t('auth.namePlaceholder')} value={name} onChangeText={setName} />
      <Field label={t('auth.email')} placeholder="anna@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label={t('auth.password')} placeholder={t('auth.passwordPlaceholder')} value={password} onChangeText={setPassword} secure />
      <Field label={t('auth.repeatPassword')} placeholder="••••••••" value={repeatPassword} onChangeText={setRepeatPassword} secure />
      {(localError || authError) && <Text style={styles.error}>{localError || authError}</Text>}
    </View>
    <View style={styles.bottom}>
      <Button title={isLoading ? t('auth.creatingAccount') : t('auth.createAccount')} onPress={submit} disabled={isLoading} />
      {isLoading && <ActivityIndicator color={colors.primary} />}
      <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>{t('common.or')}</Text><View style={styles.line} /></View>
      <Button title={t('common.google')} variant="outline" icon="logo-google" onPress={() => socialLogin('google')} disabled={isLoading} />
      <Text style={styles.terms}>{t('auth.terms')}</Text>
      <Text style={styles.account}>{t('auth.haveAccount')} <Text onPress={() => router.push('/login')} style={styles.link}>{t('auth.login')}</Text></Text>
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
  wrap: { paddingTop: 8 },
  header: { marginTop: 14, gap: 12 },
  title: { fontSize: 31, letterSpacing: -.8, fontWeight: '800', color: colors.text, marginTop: 17 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  form: { gap: 16, marginTop: 33 },
  label: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  input: { height: 53, borderRadius: radius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.text, fontSize: 16 },
  error: { color: colors.red, fontWeight: '700', fontSize: 13, lineHeight: 18 },
  bottom: { gap: 13, marginTop: 30 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 1 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  or: { color: colors.muted, fontSize: 12 },
  terms: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 16, paddingHorizontal: 18 },
  account: { textAlign: 'center', color: colors.muted, marginTop: 6, fontSize: 13 },
  link: { color: colors.primary, fontWeight: '800' }
});
