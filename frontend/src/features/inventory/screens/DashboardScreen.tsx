import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInventoryStore } from '@features/inventory/store/inventoryStore';
import { useAuthStore }      from '@features/auth/store/authStore';
import { FoodItemCard }      from '@features/inventory/components/FoodItemCard';
import { ConsumptionSlider } from '@features/inventory/components/ConsumptionSlider';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@app/theme/theme';

/**
 * DashboardScreen — Warm Kitchen Companion Home Screen
 * - Friendly greeting header (no Exit button)
 * - Empty state with Scan + Add actions
 * - Kitchen Summary chips (Use soon / Still fresh / Expired)
 * - Today's Focus section
 * - Recipe Ideas teaser
 * - Traffic-light sorted food items
 * - ConsumptionSlider modal
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
      'Remove Item',
      `Remove "${item?.product_name}" from your kitchen?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Remove',
          style:   'destructive',
          onPress: () => deleteItem(id),
        },
      ]
    );
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Chef';

  // Summary counts
  const redCount    = items.filter((i) => i.urgency_status === 'red').length;
  const yellowCount = items.filter((i) => i.urgency_status === 'yellow').length;
  const greenCount  = items.filter((i) => i.urgency_status === 'green').length;
  const isEmpty     = items.length === 0;

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
        ListHeaderComponent={
          <>
            {/* ─── Header ─── */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>{getGreeting()}, {firstName} 👋</Text>
                <Text style={styles.subtitle}>What's in your kitchen today?</Text>
              </View>
              {/* Profile avatar / logout tap target — subtle, no "Exit" label */}
              <TouchableOpacity style={styles.avatarBtn} onPress={logout} activeOpacity={0.7}>
                <Text style={styles.avatarInitial}>{firstName[0].toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {/* ─── Kitchen Summary Chips ─── */}
            {!isEmpty && (
              <View style={styles.summaryRow}>
                <View style={[styles.chip, styles.chipRed]}>
                  <Text style={[styles.chipDot, { color: Colors.urgencyRed }]}>●</Text>
                  <Text style={[styles.chipText, { color: Colors.urgencyRed }]}>
                    {redCount} Use today
                  </Text>
                </View>
                <View style={[styles.chip, styles.chipYellow]}>
                  <Text style={[styles.chipDot, { color: Colors.urgencyYellow }]}>●</Text>
                  <Text style={[styles.chipText, { color: Colors.urgencyYellow }]}>
                    {yellowCount} Use soon
                  </Text>
                </View>
                <View style={[styles.chip, styles.chipGreen]}>
                  <Text style={[styles.chipDot, { color: Colors.urgencyGreen }]}>●</Text>
                  <Text style={[styles.chipText, { color: Colors.urgencyGreen }]}>
                    {greenCount} Fresh
                  </Text>
                </View>
              </View>
            )}

            {/* ─── Loading ─── */}
            {isLoading && items.length === 0 && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={styles.loadingText}>Loading your kitchen...</Text>
              </View>
            )}

            {/* ─── Empty State Card ─── */}
            {isEmpty && !isLoading && (
              <View style={[styles.card, styles.emptyCard]}>
                <Text style={styles.emptyIllustration}>🥬</Text>
                <Text style={styles.emptyTitle}>Your kitchen is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Scan a receipt or add your first ingredient to start reducing food waste.
                </Text>
                <View style={styles.emptyActions}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('Scan')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryBtnText}>📷  Scan Receipt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => navigation.navigate('FridgeCheck')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryBtnText}>🧺  Add Manually</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ─── Today's Focus ─── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Focus</Text>
              {!isEmpty && (
                <TouchableOpacity onPress={() => navigation.navigate('FridgeCheck')}>
                  <Text style={styles.sectionLink}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEmpty ? (
              <View style={[styles.card, styles.hintCard]}>
                <Text style={styles.hintEmoji}>🗓️</Text>
                <Text style={styles.hintText}>
                  No expiring food yet. We'll remind you when something needs to be used.
                </Text>
              </View>
            ) : (
              /* Items rendered by FlatList below — section header is part of ListHeader */
              <Text style={styles.sectionSubtitle}>
                {redCount + yellowCount > 0
                  ? `${redCount + yellowCount} item${redCount + yellowCount > 1 ? 's' : ''} need your attention soon.`
                  : 'Everything looks good! Nothing urgent right now.'}
              </Text>
            )}

            {/* ─── Recipe Ideas section ─── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recipe Ideas</Text>
            </View>
            <TouchableOpacity
              style={[styles.card, styles.recipeCard]}
              onPress={() => navigation.navigate('Recipe')}
              activeOpacity={0.85}
            >
              {isEmpty ? (
                <>
                  <Text style={styles.recipeCardEmoji}>🍲</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recipeCardTitle}>Unlock recipe suggestions</Text>
                    <Text style={styles.recipeCardSub}>
                      Add ingredients to get personalised recipe ideas.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.recipeCardEmoji}>✨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recipeCardTitle}>Generate a recipe</Text>
                    <Text style={styles.recipeCardSub}>
                      Use your {items.length} ingredient{items.length > 1 ? 's' : ''} to cook something delicious.
                    </Text>
                  </View>
                  <Text style={styles.recipeCardArrow}>›</Text>
                </>
              )}
            </TouchableOpacity>

            {/* ─── Items section header (only when there are items) ─── */}
            {!isEmpty && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Kitchen</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Scan')}>
                  <Text style={styles.sectionLink}>+ Scan</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <FoodItemCard
            item={item}
            onSlider={item.is_scalable ? handleSliderOpen : undefined}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* ─── FAB: Scan Receipt (only when items exist) ─── */}
      {!isEmpty && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Scan')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>📷  Scan Receipt</Text>
        </TouchableOpacity>
      )}

      {/* ─── Consumption Slider Modal ─── */}
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
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 100, // space above FAB
  },

  // ─── Header ───
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.xxxl,
    paddingBottom:     Spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeXl,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: Typography.letterSpacingTight,
  },
  subtitle: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeBody,
    marginTop: Spacing.xs,
  },
  avatarBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.accentLight,
    borderWidth:     1.5,
    borderColor:     Colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      Spacing.md,
  },
  avatarInitial: {
    color:      Colors.accent,
    fontSize:   Typography.fontSizeLg,
    fontWeight: Typography.fontWeightBold,
  },

  // ─── Summary chips ───
  summaryRow: {
    flexDirection:     'row',
    gap:               Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom:     Spacing.lg,
  },
  chip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    paddingVertical:   5,
    paddingHorizontal: Spacing.sm,
    borderRadius:    BorderRadius.full,
    borderWidth:     1,
  },
  chipRed:    { backgroundColor: Colors.urgencyRedBg,    borderColor: '#F5C6C2' },
  chipYellow: { backgroundColor: Colors.urgencyYellowBg, borderColor: '#F5DCA8' },
  chipGreen:  { backgroundColor: Colors.urgencyGreenBg,  borderColor: '#B8DECA' },
  chipDot:   { fontSize: 8 },
  chipText:  { fontSize: Typography.fontSizeSm, fontWeight: Typography.fontWeightSemibold },

  // ─── Section headers ───
  sectionHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.lg,
    paddingBottom:     Spacing.sm,
  },
  sectionTitle: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeHeader,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: Typography.letterSpacingTight,
  },
  sectionLink: {
    color:      Colors.accent,
    fontSize:   Typography.fontSizeSm,
    fontWeight: Typography.fontWeightSemibold,
  },
  sectionSubtitle: {
    color:             Colors.textSecondary,
    fontSize:          Typography.fontSizeBody,
    paddingHorizontal: Spacing.xl,
    paddingBottom:     Spacing.sm,
  },

  // ─── Shared card ───
  card: {
    backgroundColor:   Colors.surface,
    borderRadius:      BorderRadius.card,
    marginHorizontal:  Spacing.xl,
    marginBottom:      Spacing.md,
    padding:           Spacing.xl,
    ...Shadows.card,
  },

  // ─── Loading ───
  loadingBox: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  loadingText: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeBody,
    marginTop: Spacing.md,
  },

  // ─── Empty state ───
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIllustration: {
    fontSize:     56,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeXl,
    fontWeight: Typography.fontWeightBold,
    textAlign:  'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeBody,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyActions: {
    width: '100%',
    gap:   Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius:    BorderRadius.button,
    height:          50,
    alignItems:      'center',
    justifyContent:  'center',
  },
  primaryBtnText: {
    color:      Colors.textInverse,
    fontSize:   Typography.fontSizeButton,
    fontWeight: Typography.fontWeightBold,
  },
  secondaryBtn: {
    backgroundColor: Colors.accentLight,
    borderRadius:    BorderRadius.button,
    height:          50,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     Colors.accent,
  },
  secondaryBtnText: {
    color:      Colors.accent,
    fontSize:   Typography.fontSizeButton,
    fontWeight: Typography.fontWeightSemibold,
  },

  // ─── Hint card ───
  hintCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
    paddingVertical: Spacing.lg,
  },
  hintEmoji: { fontSize: 28 },
  hintText: {
    flex:       1,
    color:      Colors.textSecondary,
    fontSize:   Typography.fontSizeBody,
    lineHeight: 22,
  },

  // ─── Recipe card ───
  recipeCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
    backgroundColor: Colors.accentLight,
    borderWidth:   1,
    borderColor:   '#B8DECA',
  },
  recipeCardEmoji: { fontSize: 32 },
  recipeCardTitle: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeMd,
    fontWeight: Typography.fontWeightSemibold,
    marginBottom: 2,
  },
  recipeCardSub: {
    color:    Colors.textSecondary,
    fontSize: Typography.fontSizeSm,
  },
  recipeCardArrow: {
    color:      Colors.accent,
    fontSize:   Typography.fontSizeXl,
    fontWeight: Typography.fontWeightBold,
  },

  // ─── FAB ───
  fab: {
    position:          'absolute',
    bottom:            Spacing.xl,
    left:              Spacing.xl,
    right:             Spacing.xl,
    height:            52,
    backgroundColor:   Colors.accent,
    borderRadius:      BorderRadius.button,
    alignItems:        'center',
    justifyContent:    'center',
    ...Shadows.card,
  },
  fabText: {
    color:      Colors.textInverse,
    fontSize:   Typography.fontSizeButton,
    fontWeight: Typography.fontWeightBold,
  },
});
