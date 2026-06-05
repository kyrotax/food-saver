import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@app/theme/theme';
import { useInventoryStore } from '@features/inventory/store/inventoryStore';

interface ConsumptionSliderProps {
  itemId:   number;
  itemName: string;
  visible:  boolean;
  onClose:  () => void;
}

type SliderState = '100' | '50' | '25' | '0';

const SLIDER_OPTIONS: { state: SliderState; label: string; emoji: string; description: string }[] = [
  { state: '100', label: 'Full',  emoji: '🟢', description: 'Fully restocked to original quantity' },
  { state: '50',  label: 'Half',  emoji: '🟡', description: 'About half of the package remaining' },
  { state: '25',  label: 'Low',   emoji: '🟠', description: 'Only a quarter of the package left' },
  { state: '0',   label: 'Empty', emoji: '🔴', description: 'Fully consumed — will be archived' },
];

/**
 * ConsumptionSlider — Modal-based percentage selector (100% | 50% | 25% | 0%)
 * Triggers the slider multiplier API on the Laravel backend (FR-12, FR-13)
 */
export const ConsumptionSlider: React.FC<ConsumptionSliderProps> = ({
  itemId,
  itemName,
  visible,
  onClose,
}) => {
  const [selected,  setSelected]  = useState<SliderState>('100');
  const [isUpdating, setIsUpdating] = useState(false);
  const updateSlider = useInventoryStore((s) => s.updateSlider);

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      await updateSlider(itemId, selected);
      onClose();
    } catch {
      // Error already in store
    } finally {
      setIsUpdating(false);
    }
  };

  const currentOption = SLIDER_OPTIONS.find((o) => o.state === selected);
  const isDestructive = selected === '0';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>⚖️ Adjust Quantity</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{itemName}</Text>
          </View>

          {/* Slider Section */}
          <View style={styles.sliderSection}>
            <View style={styles.trackContainer}>
              <View style={styles.trackInactive}>
                <View style={[styles.trackActive, { width: `${selected}%` }]} />
                
                {/* Clickable Segments for Slider Precision */}
                <View style={styles.clickableSegments}>
                  <Pressable style={styles.segment} onPress={() => setSelected('0')} />
                  <Pressable style={styles.segment} onPress={() => setSelected('25')} />
                  <Pressable style={styles.segment} onPress={() => setSelected('50')} />
                  <Pressable style={styles.segment} onPress={() => setSelected('100')} />
                </View>

                {/* Slider Thumb */}
                <View
                  style={[
                    styles.thumb,
                    {
                      left: `${selected}%`,
                      marginLeft: selected === '0' ? 0 : selected === '100' ? -22 : -11,
                    },
                  ]}
                />
              </View>
            </View>

            {/* State Label Chips */}
            <View style={styles.chipsContainer}>
              {SLIDER_OPTIONS.map((option) => {
                const isActive = selected === option.state;
                return (
                  <TouchableOpacity
                    key={option.state}
                    style={[
                      styles.chip,
                      isActive ? styles.chipActive : styles.chipInactive,
                    ]}
                    onPress={() => setSelected(option.state)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {option.state}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Current Selection Details */}
            {currentOption && (
              <View style={styles.selectionDetails}>
                <Text style={styles.detailsEmoji}>{currentOption.emoji}</Text>
                <View style={styles.detailsTextCol}>
                  <Text style={styles.detailsLabel}>
                    {currentOption.state}% — {currentOption.label}
                  </Text>
                  <Text style={styles.detailsDesc}>{currentOption.description}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              isDestructive && styles.confirmBtnDestructive,
              isUpdating && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.confirmBtnText,
                isDestructive && styles.confirmBtnTextDestructive,
              ]}
            >
              {isUpdating ? 'Updating...' : `Set to ${selected}%`}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: Colors.overlay,
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    borderTopLeftRadius:  BorderRadius.card,
    borderTopRightRadius: BorderRadius.card,
    padding:         Spacing.xl,
    paddingBottom:   Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    color:        Colors.textPrimary,
    fontSize:     Typography.fontSizeHeader,
    fontWeight:   Typography.fontWeightBold,
    letterSpacing: Typography.letterSpacingTight,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color:    Colors.textSecondary,
    fontSize: Typography.fontSizeMd,
  },
  sliderSection: {
    marginBottom: Spacing.xl,
  },
  trackContainer: {
    height:         40,
    justifyContent: 'center',
  },
  trackInactive: {
    height:          6,
    backgroundColor: Colors.border,
    borderRadius:    3,
    position:        'relative',
  },
  trackActive: {
    height:          '100%',
    backgroundColor: Colors.accent,
    borderRadius:    3,
  },
  clickableSegments: {
    position:       'absolute',
    top:            -17,
    left:           0,
    right:          0,
    height:         40,
    flexDirection:  'row',
  },
  segment: {
    flex: 1,
  },
  thumb: {
    position:        'absolute',
    top:             -8,
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: Colors.white,
  },
  chipsContainer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      Spacing.md,
    gap:            Spacing.sm,
  },
  chip: {
    flex:           1,
    height:         36,
    borderRadius:   18,
    justifyContent: 'center',
    alignItems:     'center',
    borderWidth:    1,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor:     Colors.accent,
  },
  chipInactive: {
    backgroundColor: Colors.surfaceAlt,
    borderColor:     Colors.border,
  },
  chipText: {
    fontSize: Typography.fontSizeSm,
  },
  chipTextActive: {
    color:      Colors.textInverse,
    fontWeight: Typography.fontWeightBold,
  },
  chipTextInactive: {
    color:      Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },
  selectionDetails: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius:    BorderRadius.lg,
    padding:         Spacing.md,
    marginTop:       Spacing.lg,
    gap:             Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  detailsEmoji: {
    fontSize: 28,
  },
  detailsTextCol: {
    flex: 1,
  },
  detailsLabel: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeMd,
    fontWeight: Typography.fontWeightSemibold,
  },
  detailsDesc: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeSm,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: Colors.accent,
    height:          52,
    borderRadius:    BorderRadius.button,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.sm,
  },
  confirmBtnDestructive: {
    backgroundColor: Colors.urgencyRedBg,
    borderWidth:     1,
    borderColor:     Colors.urgencyRed,
  },
  confirmBtnDisabled: {
    opacity:         0.5,
  },
  confirmBtnText: {
    color:      Colors.textInverse,
    fontSize:   Typography.fontSizeButton,
    fontWeight: Typography.fontWeightSemibold,
  },
  confirmBtnTextDestructive: {
    color:      Colors.urgencyRed,
    fontWeight: Typography.fontWeightBold,
  },
  cancelBtn: {
    height:          52,
    borderRadius:    BorderRadius.button,
    borderWidth:     1,
    borderColor:     Colors.border,
    backgroundColor: Colors.transparent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cancelBtnText: {
    color:    Colors.textPrimary,
    fontSize: Typography.fontSizeButton,
    fontWeight: Typography.fontWeightSemibold,
  },
});
