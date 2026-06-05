import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, getUrgencyTheme } from '@app/theme/theme';
import { FoodItem } from '@features/inventory/store/inventoryStore';

interface FoodItemCardProps {
  item:        FoodItem;
  onSlider?:   (id: number) => void;
  onDelete?:   (id: number) => void;
  showActions?: boolean;
}

/**
 * FoodItemCard — Neo-Brutalism styled card with:
 * - Traffic-light color border based on urgency_status (🟢🟡🔴)
 * - Product name, quantity, storage location
 * - Days remaining countdown
 * - Slider and delete action buttons (optional)
 */
export const FoodItemCard: React.FC<FoodItemCardProps> = ({
  item,
  onSlider,
  onDelete,
  showActions = true,
}) => {
  const urgency      = getUrgencyTheme(item.urgency_status);
  const daysLeft     = getDaysRemaining(item.expiration_date);
  const storageLabel = getStorageLabel(item.storage_location);

  return (
    <View style={styles.card}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Status Badge */}
        <View style={[styles.badge, { borderColor: urgency.border, backgroundColor: urgency.background }]}>
          <Text style={[styles.badgeText, { color: urgency.text }]}>{urgency.label}</Text>
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {item.product_name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>QTY</Text>
            <Text style={styles.metaValue}>
              {parseFloat(item.quantity.toString()).toFixed(2)} {item.unit}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>STORAGE</Text>
            <Text style={styles.metaValue}>{storageLabel}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>EXPIRES</Text>
            <Text style={[styles.metaValue, { color: urgency.text }]}>
              {daysLeft <= 0 ? 'TODAY!' : `${daysLeft}d`}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {showActions && (
        <View style={styles.actions}>
          {item.is_scalable && onSlider && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.sliderBtn]}
              onPress={() => onSlider(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>⚖️ Adjust</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => onDelete(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

function getDaysRemaining(expirationDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0);
  const diff = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getStorageLabel(location: string): string {
  const map: Record<string, string> = {
    freezer:   '❄️ Freezer',
    chiller:   '🧊 Chiller',
    room_temp: '🌡️ Room Temp',
  };
  return map[location] ?? location;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.card, // 20px
    marginBottom:    Spacing.md,
    overflow:        'hidden',
    padding:         Spacing.lg,        // 16px
  },
  content: {
    padding: 0,
  },
  badge: {
    alignSelf:         'flex-start',
    borderWidth:       1,
    borderRadius:      BorderRadius.full, // pill style
    paddingVertical:   Spacing.xs - 2,
    paddingHorizontal: Spacing.sm,
    marginBottom:      Spacing.sm,
  },
  badgeText: {
    fontSize:   Typography.fontSizeCaption,
    fontWeight: Typography.fontWeightMedium,
  },
  productName: {
    color:        Colors.textPrimary,
    fontSize:     Typography.fontSizeLg,
    fontWeight:   Typography.fontWeightBold,
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacingTight,
  },
  metaRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      Spacing.xs,
  },
  metaItem: {
    alignItems: 'flex-start',
    flex:        1,
  },
  metaLabel: {
    color:        Colors.textSecondary,
    fontSize:     Typography.fontSizeXs,
    fontWeight:   Typography.fontWeightMedium,
    letterSpacing: 0.5,
    marginBottom:  2,
  },
  metaValue: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeMd,
    fontWeight: Typography.fontWeightSemibold,
  },
  actions: {
    flexDirection:   'row',
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    paddingTop:      Spacing.md,
    marginTop:       Spacing.md,
    gap:             Spacing.sm,
  },
  actionBtn: {
    flex:           1,
    height:         40,
    borderRadius:   BorderRadius.button, // 14px
    justifyContent: 'center',
    alignItems:     'center',
    borderWidth:    1,
  },
  sliderBtn: {
    borderColor:     Colors.border,
    backgroundColor: Colors.transparent,
  },
  deleteBtn: {
    borderColor:     Colors.urgencyRed,
    backgroundColor: Colors.urgencyRedBg, // 15% opacity background
  },
  actionBtnText: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemibold,
  },
  deleteBtnText: {
    color:      Colors.urgencyRed,
    fontSize:   Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemibold,
  },
});
