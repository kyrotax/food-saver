import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, getUrgencyTheme } from '@app/theme/theme';
import { FoodItem } from '@features/inventory/store/inventoryStore';

interface FoodItemCardProps {
  item:        FoodItem;
  onSlider?:   (id: number) => void;
  onDelete?:   (id: number) => void;
  showActions?: boolean;
}

/**
 * FoodItemCard — Warm kitchen-style card with:
 * - Soft white card with shadow
 * - Left accent bar based on urgency
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
      {/* Left urgency accent bar */}
      <View style={[styles.accentBar, { backgroundColor: urgency.border }]} />

      <View style={styles.inner}>
        {/* Top row: name + urgency badge */}
        <View style={styles.topRow}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name}
          </Text>
          <View style={[styles.badge, { backgroundColor: urgency.background }]}>
            <Text style={[styles.badgeText, { color: urgency.text }]}>{urgency.label}</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Quantity</Text>
            <Text style={styles.metaValue}>
              {parseFloat(item.quantity.toString()).toFixed(2)} {item.unit}
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Storage</Text>
            <Text style={styles.metaValue}>{storageLabel}</Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Expires</Text>
            <Text style={[styles.metaValue, { color: urgency.text }]}>
              {daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actions}>
            {item.is_scalable && onSlider && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onSlider(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>Adjust Amount</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => onDelete(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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
    freezer:   'Freezer',
    chiller:   'Chiller',
    room_temp: 'Room Temp',
  };
  return map[location] ?? location;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.card,
    marginHorizontal: Spacing.xl,
    marginBottom:    Spacing.md,
    flexDirection:   'row',
    overflow:        'hidden',
    ...Shadows.card,
  },
  accentBar: {
    width:          4,
    borderTopLeftRadius:    BorderRadius.card,
    borderBottomLeftRadius: BorderRadius.card,
  },
  inner: {
    flex:    1,
    padding: Spacing.lg,
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Spacing.sm,
    gap:            Spacing.sm,
  },
  productName: {
    flex:       1,
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeLg,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: Typography.letterSpacingTight,
  },
  badge: {
    alignSelf:         'flex-start',
    borderRadius:      BorderRadius.full,
    paddingVertical:   3,
    paddingHorizontal: Spacing.sm,
  },
  badgeText: {
    fontSize:   Typography.fontSizeXs,
    fontWeight: Typography.fontWeightSemibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     Spacing.xs,
  },
  metaItem: {
    flex:       1,
    alignItems: 'center',
  },
  metaDivider: {
    width:      1,
    height:     28,
    backgroundColor: Colors.border,
  },
  metaLabel: {
    color:     Colors.textMuted,
    fontSize:  Typography.fontSizeXs,
    fontWeight: Typography.fontWeightMedium,
    marginBottom: 2,
  },
  metaValue: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemibold,
    textAlign:  'center',
  },
  actions: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    marginTop:     Spacing.md,
    paddingTop:    Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex:           1,
    height:         36,
    backgroundColor: Colors.surfaceAlt,
    borderRadius:   BorderRadius.lg,
    justifyContent: 'center',
    alignItems:     'center',
  },
  actionBtnText: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemibold,
  },
  deleteBtn: {
    paddingHorizontal: Spacing.lg,
    height:           36,
    backgroundColor: Colors.urgencyRedBg,
    borderRadius:    BorderRadius.lg,
    justifyContent:  'center',
    alignItems:      'center',
  },
  deleteBtnText: {
    color:      Colors.urgencyRed,
    fontSize:   Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemibold,
  },
});
