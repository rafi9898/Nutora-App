import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { barcodeService } from '@/src/services/backend/barcode-service';
import { useAppStore } from '@/src/store/app-store';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/src/constants/theme';

import { useTranslation } from 'react-i18next';

export default function BarcodeScannerScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const isProcessing = useRef(false);
  const [loading, setLoading] = useState(false);
  const setAnalysisDraft = useAppStore(state => state.setAnalysisDraft);
  const authUser = useAppStore(state => state.authUser);
  const profile = useAppStore(state => state.profile);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>{t('camera.cameraPermission')}</Text>
        <Pressable onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>{t('common.allowAccess', 'Przyznaj dostęp')}</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setScanned(true);
    setLoading(true);

    const product = await barcodeService.fetchProduct(data);
    
    if (product) {
      const Crypto = require('expo-crypto');
      const mealId = Crypto.randomUUID();
      const itemId = Crypto.randomUUID();
      
      const meal = {
        id: mealId,
        userId: authUser?.id || profile.userId,
        mealName: product.name,
        mealType: 'snack' as const,
        estimatedCalories: product.nutrition.estimatedCalories,
        proteinG: product.nutrition.proteinG,
        fatG: product.nutrition.fatG,
        carbsG: product.nutrition.carbsG,
        confidenceScore: 1,
        items: [{
          id: itemId,
          mealId: mealId,
          name: product.name,
          estimatedCalories: product.nutrition.estimatedCalories,
          proteinG: product.nutrition.proteinG,
          fatG: product.nutrition.fatG,
          carbsG: product.nutrition.carbsG,
          confidenceScore: 1,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setAnalysisDraft(meal);
      router.replace(`/edit-meal/${meal.id}`);
    } else {
      Alert.alert(t('common.error', 'Błąd'), t('barcodeScanner.notFound', `Nie udało się znaleźć w bazie produktu o kodzie: ${data}. Skanuj ponownie!`));
      setScanned(false);
      isProcessing.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="close" size={32} color="#fff" />
          </Pressable>
          <Text style={styles.title}>{t('barcodeScanner.title', 'Skaner Produktów')}</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.targetBox}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.hint}>{t('barcodeScanner.hint', 'Nakieruj aparat na kod kreskowy')}</Text>
        
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('barcodeScanner.loading', 'Pobieram dane produktu...')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  permText: { fontSize: 16, color: colors.text, textAlign: 'center', marginBottom: 20, fontWeight: '700' },
  button: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.pill },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  overlay: { flex: 1, justifyContent: 'space-between', paddingVertical: 60, alignItems: 'center' },
  header: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  targetBox: { width: 280, height: 180, position: 'relative', marginTop: 40 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  hint: { color: '#fff', fontSize: 15, fontWeight: '800', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, overflow: 'hidden', marginTop: 40 },
  loadingBox: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -100 }, { translateY: -60 }], width: 200, padding: 20, backgroundColor: '#fff', borderRadius: radius.xl, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  loadingText: { color: colors.text, marginTop: 12, fontWeight: '800', fontSize: 13, textAlign: 'center' }
});
