import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation }     from '@react-navigation/native';
import { useInventoryStore } from '@features/inventory/store/inventoryStore';
import { FoodItem }          from '@features/inventory/store/inventoryStore';
import { Colors, Typography, Spacing, BorderRadius, getUrgencyTheme } from '@app/theme/theme';

/**
 * FridgeCheckScreen — Quick read-only inventory reference
 * for use before going shopping to prevent double-buying (FR-11)
 */
export const FridgeCheckScreen: React.FC = () => {
  const navigation     = useNavigation<any>();
  const fetchFridgeCheck = useInventoryStore((s) => s.fetchFridgeCheck);
  const [items,      setItems]      = useState<FoodItem[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFridgeCheck();
        setItems(data);
      } catch (e) {
        // Error handled by store
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const renderItem = ({ item }: { item: FoodItem }) => {
    const urgency  = getUrgencyTheme(item.urgency_status);
    const expiry = new Date(item.expiration_date);
    expiry.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const daysLeft = Math.max(
      0,
      Math.round((expiry.getTime() - now.getTime()) / 86400000)
    );

    return (
      <View style={[styles.row, { borderLeftColor: urgency.border, borderLeftWidth: 4 }]}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowName} numberOfLines={1}>{item.product_name}</Text>
          <Text style={styles.rowMeta}>
            {parseFloat(item.quantity.toString()).toFixed(2)} {item.unit}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowDays, { color: urgency.text }]}>
            {daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
          </Text>
          <Text style={styles.rowStorage}>
            {item.storage_location === 'freezer' ? '❄️' :
             item.storage_location === 'chiller' ? '🧊' : '🌡️'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🧊 Fridge Check</Text>
          <Text style={styles.subtitle}>Review before you shop</Text>
        </View>
      </View>

      {/* Legend with Status Indicator Pill Badges */}
      <View style={styles.legend}>
        <View style={[styles.legendPill, { borderColor: Colors.urgencyRed, backgroundColor: Colors.urgencyRedBg }]}>
          <Text style={[styles.legendText, { color: Colors.urgencyRed }]}>🔴 Urgent</Text>
        </View>
        <View style={[styles.legendPill, { borderColor: Colors.urgencyYellow, backgroundColor: Colors.urgencyYellowBg }]}>
          <Text style={[styles.legendText, { color: Colors.urgencyYellow }]}>🟡 Warning</Text>
        </View>
        <View style={[styles.legendPill, { borderColor: Colors.urgencyGreen, backgroundColor: Colors.urgencyGreenBg }]}>
          <Text style={[styles.legendText, { color: Colors.urgencyGreen }]}>🟢 Safe</Text>
        </View>
        <Text style={styles.legendCount}>{items.length} items</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🥗</Text>
              <Text style={styles.emptyText}>Your fridge is empty — go shopping!</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
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
  subtitle: { color: Colors.textSecondary, fontSize: Typography.fontSizeSm },
  legend: {
    flexDirection:   'row',
    flexWrap:        'wrap',
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    gap:             Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendPill: {
    borderWidth:       1,
    borderRadius:      BorderRadius.full,
    paddingVertical:   Spacing.xs - 2,
    paddingHorizontal: Spacing.sm,
    alignItems:        'center',
    justifyContent:    'center',
  },
  legendText: {
    fontSize:   Typography.fontSizeCaption,
    fontWeight: Typography.fontWeightSemibold,
  },
  legendCount: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeCaption,
    alignSelf: 'center',
    marginLeft: 'auto',
  },
  list:       { padding: Spacing.xl, gap: Spacing.sm },
  row: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.card, // 20px
    padding:         Spacing.md,
  },
  rowLeft:   { flex: 1 },
  rowName: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeMd,
    fontWeight: Typography.fontWeightSemibold,
  },
  rowMeta:  { color: Colors.textSecondary, fontSize: Typography.fontSizeSm, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowDays: {
    fontSize:   Typography.fontSizeSm,
    fontWeight: Typography.fontWeightBold,
  },
  rowStorage: { fontSize: Typography.fontSizeLg },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxxl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  emptyText: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeMd,
    textAlign: 'center',
  },
});
