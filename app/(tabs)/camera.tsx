import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Screen } from '@/src/components/ui';
import { colors, radius, shadows } from '@/src/constants/theme';
import { useAppStore } from '@/src/store/app-store';

export default function CameraScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const analyzePhoto = useAppStore((state) => state.analyzePhoto);

  const analyze = async (photoUri?: string) => {
    setLoading(true);
    setError(null);

    try {
      const draft = await analyzePhoto(photoUri);

      if (!draft) {
        router.push('/subscription');
        return;
      }

      router.push(`/analysis/${draft.id}`);
    } catch (caughtError) {
      let msg = caughtError instanceof Error ? caughtError.message : null;
      if (msg === 'Network request failed') msg = t('common.noInternet');
      setError(msg === 'device_limit_reached' ? t('camera.deviceLimitReached') : (msg || t('camera.analysisError')));
    } finally {
      setLoading(false);
    }
  };

  const processImage = async (uri: string) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (e) {
      console.error('Image compression failed', e);
      return uri; // Fallback to original
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(t('camera.galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.72
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    const finalUri = await processImage(uri);
    setSelectedPhoto(finalUri);
    await analyze(finalUri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError(t('camera.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.72
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    const finalUri = await processImage(uri);
    setSelectedPhoto(finalUri);
    await analyze(finalUri);
  };

  return <Screen scroll={false} style={styles.wrap}>
    <View>
      <Text style={styles.title}>{t('camera.title')}</Text>
      <Text style={styles.subtitle}>{t('camera.subtitle')}</Text>
    </View>
    <View style={styles.viewfinder}>
      <View style={styles.viewfinderGlow} />
      {selectedPhoto && !loading ? <Image source={{ uri: selectedPhoto }} style={styles.preview} /> : null}
      {loading ? <View style={styles.loading}>
        <View style={styles.loadingBubble}><ActivityIndicator size="large" color="#fff" /></View>
        <Text style={styles.loadingText}>{t('camera.analyzing')}</Text>
        <Text style={styles.loadingSub}>{t('camera.analyzingSub')}</Text>
      </View> : !selectedPhoto ? <>
        <View style={styles.cornerTop} />
        <View style={styles.cornerBottom} />
        <View style={styles.focus}><Ionicons name="restaurant-outline" size={38} color="#fff" /></View>
        <Text style={styles.hint}>{t('camera.frameHint')}</Text>
      </> : <Text style={styles.hint}>{t('camera.photoReady')}</Text>}
    </View>
    <View style={styles.actions}>
      <Button title={t('camera.takePhoto')} icon="camera" onPress={takePhoto} disabled={loading} />
      
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable disabled={loading} onPress={pickFromGallery} style={[styles.secondaryBtn, { flex: 1 }]}>
          <Ionicons name="images-outline" size={21} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>{t('camera.chooseGallery')}</Text>
        </Pressable>
        <Pressable disabled={loading} onPress={() => router.push('/barcode-scanner' as never)} style={[styles.secondaryBtn, { flex: 1 }]}>
          <Ionicons name="barcode-outline" size={21} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>{t('camera.barcodeScanner')}</Text>
        </Pressable>
      </View>
      <Pressable disabled={loading} onPress={() => router.push('/manual-meal' as never)} style={styles.manual}>
        <Ionicons name="create-outline" size={20} color={colors.text} />
        <View style={{ flex: 1 }}>
          <Text style={styles.manualTitle}>{t('camera.addManual')}</Text>
          <Text style={styles.manualText}>{t('camera.addManualSub')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9AA39A" />
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.notice}>{t('camera.notice')}</Text>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 20, justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.muted, marginTop: 6, fontWeight: '600' },
  viewfinder: { flex: 1, backgroundColor: '#315C28', marginVertical: 28, borderRadius: radius.xl, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 1, borderColor: '#FFFFFF33', ...shadows.card },
  viewfinderGlow: { position: 'absolute', width: 270, height: 270, borderRadius: 135, backgroundColor: '#FFFFFF12', top: -78, right: -78 },
  preview: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  focus: { width: 116, height: 116, borderRadius: 58, backgroundColor: '#FFFFFF20', borderWidth: 1, borderColor: '#FFFFFF72', justifyContent: 'center', alignItems: 'center' },
  hint: { position: 'absolute', bottom: 28, color: '#fff', fontSize: 14, fontWeight: '800', backgroundColor: '#0000003D', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, overflow: 'hidden' },
  cornerTop: { position: 'absolute', top: 38, left: 35, width: 45, height: 45, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#fff', borderTopLeftRadius: 9 },
  cornerBottom: { position: 'absolute', right: 35, bottom: 76, width: 45, height: 45, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#fff', borderBottomRightRadius: 9 },
  actions: { gap: 12 },
  secondaryBtn: { height: 50, flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center', borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 8 },
  secondaryBtnText: { color: colors.primary, fontWeight: '800', fontSize: 12, flexShrink: 1, textAlign: 'center' },
  manual: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14 },
  manualTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  manualText: { color: colors.muted, fontSize: 11, marginTop: 2, fontWeight: '700' },
  notice: { textAlign: 'center', fontSize: 11, lineHeight: 15, color: colors.muted, marginTop: 2, paddingHorizontal: 25 },
  error: { textAlign: 'center', color: colors.red, fontWeight: '700', fontSize: 12, lineHeight: 17 },
  loading: { alignItems: 'center', paddingHorizontal: 20 },
  loadingBubble: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFFFFF21', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF45' },
  loadingText: { color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 20, textAlign: 'center' },
  loadingSub: { color: '#D9F2B8', fontSize: 13, marginTop: 6, textAlign: 'center' }
});
