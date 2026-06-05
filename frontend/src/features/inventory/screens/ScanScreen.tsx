import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Image, Platform, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useInventoryStore } from '@features/inventory/store/inventoryStore';
import { useOfflineQueueStore } from '@features/inventory/store/offlineQueueStore';
import { isConnected } from '@core/connectivity/netInfo';
import { Feather } from '@expo/vector-icons';

// ─── Design Tokens ──────────────────────────────────────────────────────────
// Centralized palette — white-first, food-tech premium
const C = {
  bg:            '#FFFFFF',
  surface:       '#F8FAF8',
  softGreen:     '#EAF5EE',
  primary:       '#3A9B68',
  primaryDark:   '#2F8F5B',
  border:        '#E7EDE7',
  textPrimary:   '#1F2A24',
  textSecondary: '#6F7D73',
  textMuted:     '#A3B0A7',
  warning:       '#F6B84B',
  warningBg:     '#FEF7E6',
  urgent:        '#E75D5D',
  urgentBg:      '#FDEDED',
  disabled:      '#8AA091',
  disabledBg:    '#E8F1EA',
  white:         '#FFFFFF',
};

// Spacing system
const S = {
  screenPx: 24,      // horizontal screen padding
  sectionGap: 24,    // vertical gap between sections
  cardPadLg: 24,     // large card internal padding
  cardPadSm: 20,     // small card internal padding
  innerGap: 14,      // gap between elements inside cards
};

// Typography scale
const T = {
  title:       { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  subtitleHdr: { fontSize: 16, fontWeight: '400' as const },
  sectionTitle:{ fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  cardTitle:   { fontSize: 20, fontWeight: '600' as const },
  body:        { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  secondary:   { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption:     { fontSize: 13, fontWeight: '500' as const },
  button:      { fontSize: 16, fontWeight: '600' as const },
};

// Radius scale
const R = {
  cardLg: 28,
  cardSm: 22,
  button: 18,
  icon:   16,
};

// Shadow — very soft, premium
const SHADOW = {
  shadowColor:   '#1F2A24',
  shadowOffset:  { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius:  14,
  elevation:     2,
};

/**
 * ScanScreen — Receipt scanning interface
 * Handles both online (direct upload → OCR pipeline) and offline (queue to SQLite)
 * with the 2-click rule: 1. Select image, 2. Confirm upload
 */
export const ScanScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { scanReceipt, isScanLoading } = useInventoryStore();
  const { enqueue } = useOfflineQueueStore();

  const [imageUri,    setImageUri]    = useState<string | null>(null);
  const [statusType,  setStatusType]  = useState<'success_online' | 'success_offline' | 'error' | null>(null);
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
      setStatusType(null);
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
      setStatusType(null);
      setStatusMsg('');
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    setIsUploading(true);
    setStatusType(null);
    setStatusMsg('');

    try {
      const online = await isConnected();

      if (online) {
        await scanReceipt(imageUri);
        setStatusType('success_online');
        setStatusMsg('Receipt scanned successfully. Review detected ingredients before adding them to your kitchen.');
        setTimeout(() => navigation.goBack(), 3500);
      } else {
        // Queue for later sync
        await enqueue(imageUri);
        setStatusType('success_offline');
        setStatusMsg('Saved offline. Receipts will be synced when you reconnect.');
        setTimeout(() => navigation.goBack(), 3500);
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMsg(err.message ?? 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const isButtonsDisabled = isUploading || isScanLoading;

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Scan Receipt</Text>
          <Text style={styles.headerSubtitle}>Capture or upload your grocery receipt</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Intro / Helper Card ─── */}
        <View style={styles.helperCard}>
          <View style={styles.helperIconContainer}>
            <Feather name="zap" size={18} color={C.primary} />
          </View>
          <View style={styles.helperTextContainer}>
            <Text style={styles.helperTitle}>Add items faster</Text>
            <Text style={styles.helperDesc}>
              Scan your receipt and Food Saver will detect ingredients automatically.
            </Text>
          </View>
        </View>

        {/* ─── Receipt Preview Card ─── */}
        <View style={styles.previewCard}>
          {imageUri ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.previewOverlay}>
                <View style={styles.readyBadge}>
                  <Feather name="check" size={14} color={C.white} />
                  <Text style={styles.readyBadgeText}>Ready to scan</Text>
                </View>
                <TouchableOpacity
                  style={styles.replaceBtn}
                  onPress={pickFromGallery}
                  disabled={isButtonsDisabled}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={14} color={C.primary} />
                  <Text style={styles.replaceBtnText}>Replace</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.placeholderIconBox}>
                <Feather name="file-text" size={32} color={C.primary} />
              </View>
              <Text style={styles.placeholderTitle}>No receipt selected</Text>
              <Text style={styles.placeholderDesc}>
                Take a photo or choose an image from your gallery.
              </Text>
              <Text style={styles.placeholderHelper}>
                Make sure the text is clear and readable.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Loading / Scanning State Card ─── */}
        {(isUploading || isScanLoading) && (
          <View style={styles.progressCard}>
            <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.progressTitle}>Processing Receipt</Text>
              <Text style={styles.progressDesc}>Detecting ingredients from your receipt...</Text>
            </View>
          </View>
        )}

        {/* ─── Success Card ─── */}
        {statusType && (statusType === 'success_online' || statusType === 'success_offline') && (
          <View style={styles.successCard}>
            <View style={styles.successIconBox}>
              <Feather name="check-circle" size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>
                {statusType === 'success_online' ? 'Receipt scanned' : 'Saved offline'}
              </Text>
              <Text style={styles.successDesc}>
                {statusMsg}
              </Text>
            </View>
          </View>
        )}

        {/* ─── Error Card ─── */}
        {statusType === 'error' && (
          <View style={styles.errorCard}>
            <View style={styles.errorIconBox}>
              <Feather name="alert-circle" size={20} color={C.urgent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Couldn't read the receipt</Text>
              <Text style={styles.errorDesc}>
                Try using a clearer photo with better lighting. Details: {statusMsg}
              </Text>
              <TouchableOpacity
                style={styles.errorCta}
                onPress={() => {
                  setImageUri(null);
                  setStatusType(null);
                  setStatusMsg('');
                }}
              >
                <Text style={styles.errorCtaText}>Choose another image</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Source Action Cards ─── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, isButtonsDisabled && styles.actionCardDisabled]}
            onPress={pickFromCamera}
            disabled={isButtonsDisabled}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: C.softGreen }]}>
              <Feather name="camera" size={22} color={C.primary} />
            </View>
            <Text style={styles.actionCardTitle}>Camera</Text>
            <Text style={styles.actionCardDesc}>Take a receipt photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, isButtonsDisabled && styles.actionCardDisabled]}
            onPress={pickFromGallery}
            disabled={isButtonsDisabled}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#EEF1FF' }]}>
              <Feather name="image" size={22} color="#5B6AD0" />
            </View>
            <Text style={styles.actionCardTitle}>Gallery</Text>
            <Text style={styles.actionCardDesc}>Upload from device</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Primary Upload Button ─── */}
        <TouchableOpacity
          style={[
            styles.uploadBtn,
            !imageUri && styles.uploadBtnDisabled,
            isButtonsDisabled && styles.uploadBtnLoading
          ]}
          onPress={handleUpload}
          disabled={!imageUri || isButtonsDisabled}
          activeOpacity={0.85}
        >
          {isButtonsDisabled ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={C.white} size="small" />
              <Text style={styles.uploadBtnText}>Scanning receipt...</Text>
            </View>
          ) : (
            <View style={styles.buttonContentRow}>
              <Feather
                name="sparkles"
                size={18}
                color={imageUri ? C.white : '#8AA091'}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.uploadBtnText, !imageUri && styles.uploadBtnTextDisabled]}>
                {imageUri ? 'Upload & Scan' : 'Select a receipt first'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ─── Offline Support notice ─── */}
        <View style={styles.offlineCard}>
          <View style={styles.offlineIconBox}>
            <Feather name="cloud-off" size={16} color={C.textSecondary} />
          </View>
          <View style={styles.offlineTextContainer}>
            <Text style={styles.offlineTitle}>Offline support</Text>
            <Text style={styles.offlineDesc}>
              Receipts will be saved and synced when you reconnect.
            </Text>
          </View>
        </View>

        {/* Bottom space */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ─── Header ───
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: S.screenPx,
    paddingTop:        Platform.OS === 'ios' ? 56 : 44,
    paddingBottom:     16,
    backgroundColor:   C.bg,
    gap:               12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...T.sectionTitle,
    fontWeight: '700',
  },
  headerSubtitle: {
    color:     C.textSecondary,
    ...T.secondary,
    fontSize:  13,
    marginTop: 2,
  },

  // ─── Helper Card ───
  helperCard: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.softGreen,
    borderRadius:      R.cardSm,
    borderWidth:       1,
    borderColor:       '#D4E8DC',
    padding:           16,
    marginHorizontal:  S.screenPx,
    marginBottom:      S.sectionGap,
  },
  helperIconContainer: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: C.white,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     12,
  },
  helperTextContainer: {
    flex: 1,
  },
  helperTitle: {
    color:        C.textPrimary,
    fontSize:     15,
    fontWeight:   '600',
    marginBottom: 2,
  },
  helperDesc: {
    color:      C.textSecondary,
    fontSize:   13,
    lineHeight: 18,
  },

  // ─── Preview Card ───
  previewCard: {
    height:           320,
    backgroundColor:  C.surface,
    borderRadius:     R.cardLg,
    borderWidth:      1,
    borderColor:      C.border,
    marginHorizontal: S.screenPx,
    marginBottom:     S.sectionGap,
    overflow:         'hidden',
    ...SHADOW,
  },
  imageWrapper: {
    width:    '100%',
    height:   '100%',
    position: 'relative',
  },
  previewImage: {
    width:  '100%',
    height: '100%',
  },
  previewOverlay: {
    position:       'absolute',
    bottom:         16,
    left:           16,
    right:          16,
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  readyBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.primary,
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius:      20,
    gap:               4,
  },
  readyBadgeText: {
    color:      C.white,
    fontSize:   12,
    fontWeight: '600',
  },
  replaceBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.white,
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius:      20,
    gap:               6,
    borderWidth:       1,
    borderColor:       C.border,
    ...SHADOW,
  },
  replaceBtnText: {
    color:      C.primary,
    fontSize:   12,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 24,
  },
  placeholderIconBox: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: C.softGreen,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    16,
  },
  placeholderTitle: {
    color:        C.textPrimary,
    ...T.cardTitle,
    textAlign:    'center',
    marginBottom: 8,
  },
  placeholderDesc: {
    color:        C.textSecondary,
    ...T.body,
    fontSize:     14,
    textAlign:    'center',
    marginBottom: 8,
  },
  placeholderHelper: {
    color:     C.textMuted,
    fontSize:  12,
    textAlign: 'center',
  },

  // ─── Loading / Progress Card ───
  progressCard: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  C.softGreen,
    borderWidth:      1,
    borderColor:      '#D4E8DC',
    borderRadius:     18,
    padding:          16,
    marginHorizontal: S.screenPx,
    marginBottom:     16,
  },
  progressTitle: {
    color:      C.textPrimary,
    fontSize:   14,
    fontWeight: '600',
  },
  progressDesc: {
    color:     C.textSecondary,
    fontSize:  12,
    marginTop: 2,
  },

  // ─── Success Card ───
  successCard: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  C.softGreen,
    borderWidth:      1,
    borderColor:      '#D4E8DC',
    borderRadius:     18,
    padding:          16,
    marginHorizontal: S.screenPx,
    marginBottom:     16,
    gap:              12,
  },
  successIconBox: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: C.white,
    alignItems:      'center',
    justifyContent:  'center',
  },
  successTitle: {
    color:      C.textPrimary,
    fontSize:   14,
    fontWeight: '600',
  },
  successDesc: {
    color:      C.textSecondary,
    fontSize:   12,
    marginTop:  2,
    lineHeight: 16,
  },

  // ─── Error Card ───
  errorCard: {
    flexDirection:    'row',
    alignItems:       'flex-start',
    backgroundColor:  C.urgentBg,
    borderWidth:      1,
    borderColor:      '#FAD2D2',
    borderRadius:     18,
    padding:          16,
    marginHorizontal: S.screenPx,
    marginBottom:     16,
    gap:              12,
  },
  errorIconBox: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: C.white,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       2,
  },
  errorTitle: {
    color:      C.textPrimary,
    fontSize:   14,
    fontWeight: '600',
  },
  errorDesc: {
    color:      C.textSecondary,
    fontSize:   12,
    marginTop:  2,
    lineHeight: 16,
  },
  errorCta: {
    marginTop:       10,
    backgroundColor: C.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius:    12,
    alignSelf:       'flex-start',
    borderWidth:     1,
    borderColor:     C.border,
  },
  errorCtaText: {
    color:      C.urgent,
    fontSize:   12,
    fontWeight: '600',
  },

  // ─── Source Actions ───
  actionsRow: {
    flexDirection:     'row',
    paddingHorizontal: S.screenPx,
    gap:               16,
    marginBottom:      S.sectionGap,
  },
  actionCard: {
    flex:            1,
    height:          128,
    backgroundColor: C.white,
    borderRadius:    R.cardSm,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         S.cardPadSm,
    ...SHADOW,
  },
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionIconContainer: {
    width:          44,
    height:         44,
    borderRadius:   R.icon,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   10,
  },
  actionCardTitle: {
    color:        C.textPrimary,
    fontSize:     16,
    fontWeight:   '600',
    marginBottom: 4,
  },
  actionCardDesc: {
    color:      C.textSecondary,
    fontSize:   13,
    lineHeight: 18,
  },

  // ─── Primary Upload Button ───
  uploadBtn: {
    backgroundColor:  C.primary,
    borderRadius:     R.button,
    height:           56,
    marginHorizontal: S.screenPx,
    alignItems:       'center',
    justifyContent:   'center',
    marginBottom:     16,
  },
  uploadBtnDisabled: {
    backgroundColor: '#E8F1EA',
  },
  uploadBtnLoading: {
    backgroundColor: C.primaryDark,
  },
  uploadBtnText: {
    color: C.white,
    ...T.button,
  },
  uploadBtnTextDisabled: {
    color: '#8AA091',
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },

  // ─── Offline Card ───
  offlineCard: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.surface,
    borderWidth:       1,
    borderColor:       C.border,
    borderRadius:      18,
    paddingVertical:   12,
    paddingHorizontal: 16,
    marginHorizontal:  S.screenPx,
    marginBottom:      S.sectionGap,
    gap:               12,
  },
  offlineIconBox: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: C.white,
    alignItems:      'center',
    justifyContent:  'center',
  },
  offlineTextContainer: {
    flex: 1,
  },
  offlineTitle: {
    color:      C.textPrimary,
    fontSize:   13,
    fontWeight: '600',
  },
  offlineDesc: {
    color:      C.textSecondary,
    fontSize:   12,
    lineHeight: 16,
    marginTop:  1,
  },
});
