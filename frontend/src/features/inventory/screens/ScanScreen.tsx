import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation }     from '@react-navigation/native';
import { useInventoryStore } from '@features/inventory/store/inventoryStore';
import { useOfflineQueueStore } from '@features/inventory/store/offlineQueueStore';
import { isConnected }       from '@core/connectivity/netInfo';
import { Colors, Typography, Spacing, BorderRadius } from '@app/theme/theme';

/**
 * ScanScreen — Receipt scanning interface
 * Handles both online (direct upload → OCR pipeline) and offline (queue to SQLite)
 * with the 2-click rule: 1. Select image, 2. Confirm upload (FR-03, FR-06, NFR-06)
 */
export const ScanScreen: React.FC = () => {
  const navigation     = useNavigation<any>();
  const { scanReceipt, isScanLoading } = useInventoryStore();
  const { enqueue }    = useOfflineQueueStore();

  const [imageUri,    setImageUri]    = useState<string | null>(null);
  const [statusMsg,   setStatusMsg]   = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to scan receipts.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.9,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setStatusMsg('');
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed to upload receipts.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.9,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setStatusMsg('');
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    setIsUploading(true);

    try {
      const online = await isConnected();

      if (online) {
        await scanReceipt(imageUri);
        setStatusMsg('✅ Receipt uploaded! Inventory will update in a few seconds.');
        setTimeout(() => navigation.goBack(), 2000);
      } else {
        // Queue for later sync
        await enqueue(imageUri);
        setStatusMsg('📥 Saved offline. Will sync when back online.');
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message ?? 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Receipt</Text>
      </View>

      {/* Preview Area */}
      <View style={styles.previewArea}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>📄</Text>
            <Text style={styles.placeholderText}>No receipt selected yet</Text>
            <Text style={styles.placeholderSub}>Use the buttons below to capture or upload.</Text>
          </View>
        )}
      </View>

      {/* Status Message */}
      {statusMsg ? (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{statusMsg}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={pickFromCamera} activeOpacity={0.8}>
          <Text style={styles.actionBtnEmoji}>📷</Text>
          <Text style={styles.actionBtnLabel}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery} activeOpacity={0.8}>
          <Text style={styles.actionBtnEmoji}>🖼️</Text>
          <Text style={styles.actionBtnLabel}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadBtn, (!imageUri || isUploading || isScanLoading) && styles.uploadBtnDisabled]}
        onPress={handleUpload}
        disabled={!imageUri || isUploading || isScanLoading}
        activeOpacity={0.85}
      >
        {(isUploading || isScanLoading)
          ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color={Colors.textInverse} />
              <Text style={styles.uploadBtnText}>Processing...</Text>
            </View>
          )
          : <Text style={styles.uploadBtnText}>🚀 Upload & Scan</Text>
        }
      </TouchableOpacity>

      <Text style={styles.offlineNote}>
        📶 No internet? Receipts will be saved and auto-synced when you reconnect.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       Spacing.xl,
    paddingTop:    Spacing.xxxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'transparent',
    gap:           Spacing.md,
  },
  backBtn:     { padding: Spacing.xs },
  backBtnText: { color: Colors.accent, fontSize: Typography.fontSizeMd, fontWeight: Typography.fontWeightSemibold },
  title: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeHeader,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: Typography.letterSpacingTight,
  },
  previewArea: {
    flex:        1,
    margin:      Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.card, // 20px
    borderStyle: 'dashed',
    overflow:    'hidden',
    backgroundColor: Colors.surface,
  },
  preview:    { width: '100%', height: '100%' },
  placeholder: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.xl,
  },
  placeholderEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  placeholderText: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeLg,
    fontWeight: Typography.fontWeightSemibold,
    textAlign:  'center',
  },
  placeholderSub: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeSm,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  statusBar: {
    backgroundColor: Colors.urgencyGreenBg,
    borderWidth:     1,
    borderColor:     Colors.accent,
    marginHorizontal: Spacing.xl,
    borderRadius:    BorderRadius.button, // 14px
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
  },
  statusText: { color: Colors.accent, fontSize: Typography.fontSizeMd, fontWeight: Typography.fontWeightSemibold, textAlign: 'center' },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap:           Spacing.md,
    marginBottom:  Spacing.md,
  },
  actionBtn: {
    flex:           1,
    backgroundColor: Colors.transparent,
    borderWidth:    1,
    borderColor:    Colors.border,
    borderRadius:   BorderRadius.button, // 14px
    padding:        Spacing.lg,
    alignItems:     'center',
  },
  actionBtnEmoji: { fontSize: 32, marginBottom: Spacing.sm },
  actionBtnLabel: { color: Colors.textPrimary, fontSize: Typography.fontSizeMd, fontWeight: Typography.fontWeightSemibold },
  uploadBtn: {
    backgroundColor: Colors.accent,
    borderRadius:    BorderRadius.button, // 14px
    height:          52,
    marginHorizontal: Spacing.xl,
    alignItems:      'center',
    justifyContent:  'center',
  },
  uploadBtnDisabled: { opacity: 0.4 },
  uploadBtnText: {
    color:      Colors.textInverse,
    fontSize:   Typography.fontSizeButton,
    fontWeight: Typography.fontWeightBold,
  },
  uploadingRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  offlineNote: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeSm,
    textAlign: 'center',
    padding:   Spacing.lg,
  },
});
