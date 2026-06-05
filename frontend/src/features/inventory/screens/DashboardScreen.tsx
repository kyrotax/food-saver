import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInventoryStore } from '@features/inventory/store/inventoryStore';
import { useAuthStore }      from '@features/auth/store/authStore';
import { FoodItemCard }      from '@features/inventory/components/FoodItemCard';
import { ConsumptionSlider } from '@features/inventory/components/ConsumptionSlider';
import { Colors, Typography, Spacing, BorderRadius } from '@app/theme/theme';

/**
 * DashboardScreen — Main inventory view
 * - Traffic-light sorted food items (🔴 → 🟡 → 🟢)
 * - Scan receipt FAB
 * - ConsumptionSlider modal trigger
 * - Fridge Check shortcut
 */
export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user       = useAuthStore((s) => s.user);
  const logout     = useAuthStore((s) => s.logout);
  const {
    items, isLoading, fetchInventory, deleteItem,
  } = useInventoryStore();

  const [sliderVisible, setSliderVisible] = useState(false);
  const [selectedItem,  setSelectedItem]  = useState<{ id: number; name: string } | null>(null);
  const [refreshing,    setRefreshing]    = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  }, []);

  const handleSliderOpen = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      setSelectedItem({ id, name: item.product_name });
      setSliderVisible(true);
    }
  };

  const handleDelete = (id: number) => {
    const item = items.find((i) => i.id === id);
    Alert.alert(
      'Delete Item',
      `Remove "${item?.product_name}" from your inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Delete',
          style:   'destructive',
          onPress: () => deleteItem(id),
        },
      ]
    );
  };

  // Summary counts
  const redCount    = items.filter((i) => i.urgency_status === 'red').length;
  const yellowCount = items.filter((i) => i.urgency_status === 'yellow').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>👋 Hey, {user?.name?.split(' ')[0] ?? 'Chef'}!</Text>
          <Text style={styles.subtitle}>Your Kitchen Inventory</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={[styles.summaryItem, { borderColor: Colors.urgencyRed, backgroundColor: Colors.urgencyRedBg }]}>
          <Text style={[styles.summaryCount, { color: Colors.urgencyRed }]}>{redCount}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.urgencyRed }]}>Urgent</Text>
        </View>
        <View style={[styles.summaryItem, { borderColor: Colors.urgencyYellow, backgroundColor: Colors.urgencyYellowBg }]}>
          <Text style={[styles.summaryCount, { color: Colors.urgencyYellow }]}>{yellowCount}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.urgencyYellow }]}>Warning</Text>
        </View>
        <View style={[styles.summaryItem, { borderColor: Colors.urgencyGreen, backgroundColor: Colors.urgencyGreenBg }]}>
          <Text style={[styles.summaryCount, { color: Colors.urgencyGreen }]}>
            {items.length - redCount - yellowCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: Colors.urgencyGreen }]}>Safe</Text>
        </View>

        {/* Fridge Check shortcut */}
        <TouchableOpacity
          style={styles.fridgeCheckBtn}
          onPress={() => navigation.navigate('FridgeCheck')}
        >
          <Text style={styles.fridgeCheckText}>🧊 Check</Text>
        </TouchableOpacity>
      </View>

      {/* Item List */}
      {isLoading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading your kitchen...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <FoodItemCard
              item={item}
              onSlider={item.is_scalable ? handleSliderOpen : undefined}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🥗</Text>
              <Text style={styles.emptyTitle}>Kitchen is empty!</Text>
              <Text style={styles.emptySubtitle}>Scan a receipt to start tracking your food.</Text>
            </View>
          }
        />
      )}

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.recipeBtn}
          onPress={() => navigation.navigate('Recipe')}
          activeOpacity={0.8}
        >
          <Text style={styles.recipeBtnText}>🍳 Get Recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanFab}
          onPress={() => navigation.navigate('Scan')}
          activeOpacity={0.85}
        >
          <Text style={styles.scanFabText}>📷 Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Consumption Slider Modal */}
      {selectedItem && (
        <ConsumptionSlider
          itemId={selectedItem.id}
          itemName={selectedItem.name}
          visible={sliderVisible}
          onClose={() => {
            setSliderVisible(false);
            setSelectedItem(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: Spacing.xl,
    paddingTop:      Spacing.xxxl,
    paddingBottom:   Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'transparent',
  },
  greeting: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeTitle, // 28sp
    fontWeight: Typography.fontWeightBold,
    letterSpacing: Typography.letterSpacingTight,
  },
  subtitle: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeBody,
    marginTop: Spacing.xs,
  },
  logoutBtn: {
    borderWidth:   1,
    borderColor:   Colors.border,
    borderRadius:  BorderRadius.button, // 14px
    paddingVertical:   Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'transparent',
  },
  logoutBtnText: { 
    color: Colors.textSecondary, 
    fontSize: Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemibold,
  },
  summaryBar: {
    flexDirection:   'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    gap:             Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    flex:         1,
    borderWidth:  1,
    borderRadius: BorderRadius.button, // 14px
    padding:      Spacing.sm,
    alignItems:   'center',
  },
  summaryCount: { 
    fontSize: Typography.fontSizeXl, 
    fontWeight: Typography.fontWeightBold 
  },
  summaryLabel: { 
    fontSize: Typography.fontSizeXs, 
    fontWeight: Typography.fontWeightMedium,
    marginTop: 2 
  },
  fridgeCheckBtn: {
    backgroundColor: Colors.transparent,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.button, // 14px
    padding:         Spacing.sm,
    alignItems:      'center',
    justifyContent:  'center',
    flex:            1,
  },
  fridgeCheckText: { 
    color: Colors.textPrimary, 
    fontSize: Typography.fontSizeSm, 
    fontWeight: Typography.fontWeightSemibold 
  },
  list:    { padding: Spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  loadingText: { color: Colors.textSecondary, marginTop: Spacing.md },
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxxl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.fontSizeXl, fontWeight: Typography.fontWeightBold },
  emptySubtitle: { color: Colors.textSecondary, fontSize: Typography.fontSizeMd, marginTop: Spacing.sm, textAlign: 'center' },
  actionBar: {
    flexDirection:   'row',
    padding:         Spacing.lg,
    gap:             Spacing.md,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    backgroundColor: Colors.surface,
  },
  recipeBtn: {
    flex:           1,
    height:         52,
    borderWidth:    1,
    borderColor:    Colors.border,
    borderRadius:   BorderRadius.button, // 14px
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: Colors.transparent,
  },
  recipeBtnText: { 
    color: Colors.textPrimary, 
    fontSize: Typography.fontSizeButton, 
    fontWeight: Typography.fontWeightSemibold 
  },
  scanFab: {
    flex:           1,
    height:         52,
    backgroundColor: Colors.accent,
    borderRadius:   BorderRadius.button, // 14px
    alignItems:     'center',
    justifyContent: 'center',
  },
  scanFabText: { 
    color: Colors.textInverse, 
    fontSize: Typography.fontSizeButton, 
    fontWeight: Typography.fontWeightSemibold 
  },
});
