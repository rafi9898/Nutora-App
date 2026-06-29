import { getSupabaseClient } from '@/src/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

const defaultBucket = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || 'meal-photos';

const getFileExtension = (uri: string) => {
  const extension = uri.split('?')[0]?.split('.').pop();
  return extension && extension.length <= 5 ? extension : 'jpg';
};

export const storageService = {
  async uploadMealPhoto(userId: string, photoUri: string): Promise<string> {
    const supabase = getSupabaseClient();
    const extension = getFileExtension(photoUri);
    const path = `${userId}/${Date.now()}.${extension}`;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/${defaultBucket}/${path}`;

    try {
      const response = await FileSystem.uploadAsync(uploadUrl, photoUri, {
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `image/${extension}`,
          'x-upsert': 'false'
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT
      });

      if (response.status >= 400) {
        throw new Error(`Upload HTTP ${response.status}: ${response.body}`);
      }

      const { data } = supabase.storage.from(defaultBucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      const { Alert } = require('react-native');
      Alert.alert('Upload Error', err?.message || String(err));
      throw new Error(`Upload Failed: ${err?.message || 'Unknown'}`);
    }
  }
};

export const uploadMealPhoto = storageService.uploadMealPhoto;
