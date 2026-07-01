import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { getSupabaseClient } from '@/src/lib/supabase';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterInput = AuthCredentials & {
  name?: string;
};

export type SocialProvider = 'google' | 'facebook';


const getOAuthRedirectUrl = () => AuthSession.makeRedirectUri({ path: 'auth/callback' });

export const authService = {
  async register({ email, password, name }: RegisterInput) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: name ? { name } : undefined }
    });

    if (error) throw error;
    
    // Obsługa ochrony przed enumeracją e-maili (Supabase default)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('Konto z tym adresem e-mail już istnieje.');
    }

    // TODO: After auth confirmation, create user_profiles row in a backend
    // function/trigger so profile creation is not trusted to client logic.
    return data.user;
  },

  async login({ email, password }: AuthCredentials) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;
    return data.user;
  },

  async logout() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  },

  async getCurrentUser() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (error.message === 'Auth session missing!') return null;
      throw error;
    }
    return data.user;
  },

  async loginWithProvider(provider: SocialProvider) {
    const supabase = getSupabaseClient();
    const redirectTo = getOAuthRedirectUrl();
    let signInResponse;
    try {
      signInResponse = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
    } catch (err: any) {
      if (err.message === 'Network request failed') {
        // Cichy retry dla błędu sieciowego przy pierwszym uruchomieniu
        await new Promise(resolve => setTimeout(resolve, 500));
        signInResponse = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
      } else {
        throw err;
      }
    }
    const { data, error } = signInResponse;

    if (error) throw error;
    if (!data.url) throw new Error('Nie udało się przygotować logowania społecznościowego.');

    const browserOptions = Platform.OS === 'android' ? { showInRecents: false, createTask: false } : {};
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, browserOptions);

    if (result.type !== 'success') return null;

    const parsedUrl = Linking.parse(result.url);
    const errorParam = parsedUrl.queryParams?.error as string | undefined;
    const errorDesc = parsedUrl.queryParams?.error_description as string | undefined;
    
    if (errorParam) throw new Error(errorDesc || errorParam);
    
    const code = parsedUrl.queryParams?.code as string | undefined;

    if (!code) throw new Error('Provider nie zwrócił kodu autoryzacyjnego.');

    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) throw exchangeError;

    // TODO: Ensure user_profiles exists after social login via DB trigger or
    // backend function. The SQL schema already proposes an auth trigger.
    return sessionData.user;
  },

  async resetPassword(email: string) {
    const supabase = getSupabaseClient();
    const redirectTo = AuthSession.makeRedirectUri({ path: 'auth/callback' });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) throw error;
  },

  async updatePassword(password: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) throw error;
  }
};

export const register = authService.register;
export const login = authService.login;
export const logout = authService.logout;
export const getCurrentUser = authService.getCurrentUser;
export const loginWithProvider = authService.loginWithProvider;
export const resetPassword = authService.resetPassword;
export const updatePassword = authService.updatePassword;
