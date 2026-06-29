import { getSupabaseClient } from '@/src/lib/supabase';
import type { UserProfile } from '@/src/types';
import { mapProfileRowToProfile, mapProfileToUpdate } from '@/src/services/backend/mappers';

export const profileService = {
  async getProfile(userId?: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = userId ? { data: null, error: null } : await supabase.auth.getUser();
    const resolvedUserId = userId ?? authData?.user?.id;

    if (authError) throw authError;
    if (!resolvedUserId) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', resolvedUserId)
      .single();

    if (error) throw error;
    return mapProfileRowToProfile(data, authData?.user?.email ?? '');
  },

  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .update(mapProfileToUpdate(profile))
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;
    return mapProfileRowToProfile(data, profile.email);
  },

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: profile.userId,
        name: profile.name,
        ...mapProfileToUpdate(profile)
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return mapProfileRowToProfile(data, profile.email);
  }
};
