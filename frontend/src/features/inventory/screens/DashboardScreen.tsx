import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useInventoryStore, FoodItem } from '@features/inventory/store/inventoryStore';
import { useAuthStore } from '@features/auth/store/authStore';
import { ConsumptionSlider } from '@features/inventory/components/ConsumptionSlider';
import { AddEditItemModal } from '@features/inventory/components/AddEditItemModal';

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
  safe:          '#3A9B68',
  safeBg:        '#EAF5EE',
  white:         '#FFFFFF',
};

// Spacing system — 8pt grid, consistent across all sections
const S = {
  screenPx: 24,      // horizontal screen padding
  sectionGap: 30,    // vertical gap between sections
  cardPadLg: 24,     // large card internal padding
  cardPadSm: 20,     // small card internal padding
  innerGap: 14,      // gap between elements inside cards
  titleGap: 14,      // gap between section title and content
};

// Typography scale
const T = {
  greeting:    { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  subtitleHdr: { fontSize: 16, fontWeight: '400' as const },
  sectionTitle:{ fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  cardTitleLg: { fontSize: 21, fontWeight: '600' as const, letterSpacing: -0.2 },
  cardTitleSm: { fontSize: 17, fontWeight: '600' as const },
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

// ─── Food Category & Icon Classification ──────────────────────────────────
const VEGETABLE_KW = ['tomat', 'wortel', 'carrot', 'bayam', 'spinach', 'brokoli', 'broccoli', 'kangkung', 'selada', 'lettuce', 'bawang', 'onion', 'cabai', 'pepper', 'kentang', 'potato', 'timun', 'cucumber', 'terong', 'eggplant', 'labu', 'pumpkin', 'jagung', 'corn', 'kol', 'cabbage', 'paprika', 'sawi', 'seledri', 'celery'];
const FRUIT_KW     = ['apel', 'apple', 'jeruk', 'orange', 'pisang', 'banana', 'mangga', 'mango', 'semangka', 'watermelon', 'melon', 'anggur', 'grape', 'strawberry', 'nanas', 'pineapple', 'pepaya', 'papaya', 'lemon', 'lime', 'avocado', 'alpukat', 'buah', 'fruit', 'berry', 'kiwi', 'durian', 'rambutan'];
const PROTEIN_KW   = ['ayam', 'chicken', 'daging', 'beef', 'meat', 'ikan', 'fish', 'telur', 'egg', 'udang', 'shrimp', 'tahu', 'tofu', 'tempe', 'tempeh', 'sosis', 'sausage', 'bakso', 'cumi', 'squid', 'salmon', 'tuna', 'sardine', 'ham', 'bacon', 'nugget'];
const DAIRY_KW     = ['susu', 'milk', 'keju', 'cheese', 'yogurt', 'mentega', 'butter', 'cream', 'krim', 'whipped', 'dairy'];
const GRAIN_KW     = ['beras', 'rice', 'roti', 'bread', 'mie', 'noodle', 'pasta', 'tepung', 'flour', 'oat', 'gandum', 'wheat', 'sereal', 'cereal', 'crackers', 'biscuit'];

function getFoodIconAndColor(name: string, isUrgent: boolean): { icon: keyof typeof Feather.glyphMap; bg: string; color: string } {
  const n = name.toLowerCase();
  let icon: keyof typeof Feather.glyphMap = 'package';
  
  if (VEGETABLE_KW.some(k => n.includes(k))) icon = 'sun';
  else if (FRUIT_KW.some(k => n.includes(k))) icon = 'heart';
  else if (PROTEIN_KW.some(k => n.includes(k))) icon = 'target';
  else if (DAIRY_KW.some(k => n.includes(k))) icon = 'droplet';
  else if (GRAIN_KW.some(k => n.includes(k))) icon = 'layers';

  return {
    icon,
    bg: isUrgent ? C.urgentBg : C.warningBg,
    color: isUrgent ? C.urgent : C.warning,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function getDaysRemaining(expirationDate: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDate); exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - now.getTime()) / 86400000);
}

function expiryText(d: number): string {
  if (d <= 0) return 'Expires today';
  if (d === 1) return 'Expires tomorrow';
  return `Expires in ${d} days`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * DashboardScreen — Premium Food Saver Home
 *
 * Layout:
 * 1. Header (greeting + avatar inline)
 * 2. Kitchen Summary Card (empty state or stats)
 * 3. Quick Actions (scrollable row of action cards)
 * 4. Use These First (urgent/warning items with category icons)
 * 5. Recipe Ideas (contextual CTA)
 */
export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user       = useAuthStore((s) => s.user);
  const logout     = useAuthStore((s) => s.logout);
  const {
    items, isLoading, fetchInventory, deleteItem,
  } = useInventoryStore();

  const [sliderVisible, setSliderVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedItem,  setSelectedItem]  = useState<{ id: number; name: string } | null>(null);
  const [refreshing,    setRefreshing]    = useState(false);

  useEffect(() => { fetchInventory(); }, []);

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
        { text: 'Remove', style: 'destructive', onPress: () => deleteItem(id) },
      ]
    );
  };

  // ─── Derived data ────────────────────────────────────────────────────────
  const firstName   = user?.name?.split(' ')[0] ?? 'Chef';
  const isEmpty     = items.length === 0;
  const redCount    = items.filter((i) => i.urgency_status === 'red').length;
  const yellowCount = items.filter((i) => i.urgency_status === 'yellow').length;
  const expiringCount = redCount + yellowCount;

  // Focus items: urgent first, then warning, sorted by expiry date
  const focusItems = useMemo(() => {
    return items
      .filter((i) => i.urgency_status === 'red' || i.urgency_status === 'yellow')
      .sort((a, b) => {
        const order = (s: string) => s === 'red' ? 0 : 1;
        const diff = order(a.urgency_status) - order(b.urgency_status);
        if (diff !== 0) return diff;
        return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
      })
      .slice(0, 5);
  }, [items]);

  const hasUrgentItems = focusItems.length > 0;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >

        {/* ══════════════════════════════════════════════════════════════════
            1. HEADER
            ══════════════════════════════════════════════════════════════════ */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <Text style={styles.greeting} numberOfLines={1}>{getGreeting()}, {firstName}</Text>
              <TouchableOpacity style={styles.avatarBtn} onPress={logout} activeOpacity={0.7}>
                <Text style={styles.avatarInitial}>{firstName[0].toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSubtitle}>What's in your kitchen today?</Text>
          </View>
        </View>

        {/* ── Loading ── */}
        {isLoading && items.length === 0 && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Loading your kitchen...</Text>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            2. KITCHEN SUMMARY CARD
            ══════════════════════════════════════════════════════════════════ */}

        {/* Empty kitchen */}
        {!isLoading && isEmpty && (
          <View style={styles.heroCard}>
            <View style={styles.heroIconCircle}>
              <Feather name="package" size={24} color={C.primary} />
            </View>
            <Text style={styles.heroTitle}>Your kitchen is empty</Text>
            <Text style={styles.heroDesc}>
              Scan a receipt or add your first ingredient to start reducing food waste.
            </Text>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.85}
              >
                <Feather name="camera" size={20} color={C.white} style={{ marginRight: 10 }} />
                <Text style={styles.btnPrimaryText}>Scan Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setAddModalVisible(true)}
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={20} color={C.primary} style={{ marginRight: 10 }} />
                <Text style={styles.btnSecondaryText}>Add Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Kitchen with items */}
        {!isLoading && !isEmpty && (
          <View style={styles.heroCard}>
            <Text style={styles.heroTitleLeft}>Kitchen Summary</Text>
            <Text style={styles.heroSubtitleLeft}>Here's what needs your attention today.</Text>

            <View style={styles.statsRow}>
              {/* Total */}
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: C.softGreen }]}>
                  <Feather name="box" size={20} color={C.primary} />
                </View>
                <Text style={styles.statNumber}>{items.length}</Text>
                <Text style={styles.statLabel}>Ingredients</Text>
              </View>

              <View style={styles.statDivider} />

              {/* Expiring */}
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: C.warningBg }]}>
                  <Feather name="clock" size={20} color={C.warning} />
                </View>
                <Text style={styles.statNumber}>{yellowCount}</Text>
                <Text style={styles.statLabel}>Expiring Soon</Text>
              </View>

              <View style={styles.statDivider} />

              {/* Urgent */}
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: C.urgentBg }]}>
                  <Feather name="alert-triangle" size={20} color={C.urgent} />
                </View>
                <Text style={styles.statNumber}>{redCount}</Text>
                <Text style={styles.statLabel}>Urgent</Text>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            3. QUICK ACTIONS
            ══════════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionScrollable}>
          <Text style={styles.sectionTitleScrollable}>Quick Actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.qaScrollContent}
            style={styles.qaScroll}
          >
            <TouchableOpacity
              style={styles.qaCard}
              onPress={() => navigation.navigate('Scan')}
              activeOpacity={0.7}
            >
              <View style={[styles.qaIcon, { backgroundColor: C.softGreen }]}>
                <Feather name="camera" size={20} color={C.primary} />
              </View>
              <Text style={styles.qaTitle}>Scan Receipt</Text>
              <Text style={styles.qaDesc}>Add items from receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qaCard}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.qaIcon, { backgroundColor: '#EEF1FF' }]}>
                <Feather name="plus-square" size={20} color="#5B6AD0" />
              </View>
              <Text style={styles.qaTitle}>Add Manually</Text>
              <Text style={styles.qaDesc}>Add ingredients one by one</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qaCard}
              onPress={() => navigation.navigate('FridgeCheck')}
              activeOpacity={0.7}
            >
              <View style={[styles.qaIcon, { backgroundColor: C.warningBg }]}>
                <Feather name="list" size={20} color="#D4860A" />
              </View>
              <Text style={styles.qaTitle}>Fridge Check</Text>
              <Text style={styles.qaDesc}>Review before shopping</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            4. USE THESE FIRST
            ══════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Use these first</Text>
              {!isEmpty && (
                <Text style={styles.sectionSubtitle}>
                  Ingredients that need your attention today.
                </Text>
              )}
            </View>
            {hasUrgentItems && (
              <TouchableOpacity
                onPress={() => navigation.navigate('FridgeCheck')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.sectionLink}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Has urgent/warning items ── */}
          {hasUrgentItems && (
            <View style={styles.focusList}>
              {focusItems.map((item) => {
                const days = getDaysRemaining(item.expiration_date);
                const isUrgent = item.urgency_status === 'red';
                const iconInfo = getFoodIconAndColor(item.product_name, isUrgent);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.focusCard}
                    onPress={() => { if (item.is_scalable) handleSliderOpen(item.id); }}
                    activeOpacity={item.is_scalable ? 0.7 : 1}
                  >
                    <View style={styles.focusCardInner}>
                      <View style={[styles.focusIconContainer, { backgroundColor: iconInfo.bg }]}>
                        <Feather name={iconInfo.icon} size={20} color={iconInfo.color} />
                      </View>
                      <View style={styles.focusTextContainer}>
                        <Text style={styles.focusName} numberOfLines={1}>
                          {item.product_name}
                        </Text>
                        <Text style={styles.focusMeta}>
                          {parseFloat(item.quantity.toString()).toFixed(1)} {item.unit} · {expiryText(days)}
                        </Text>
                      </View>
                      <View style={[
                        styles.badge,
                        { backgroundColor: isUrgent ? C.urgentBg : C.warningBg }
                      ]}>
                        <View style={[
                          styles.badgeDot,
                          { backgroundColor: isUrgent ? C.urgent : C.warning }
                        ]} />
                        <Text style={[
                          styles.badgeText,
                          { color: isUrgent ? C.urgent : C.warning }
                        ]}>
                          {isUrgent ? 'Urgent' : 'Warning'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.focusDeleteBtn}
                      onPress={() => handleDelete(item.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="trash-2" size={18} color={C.textMuted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── No urgent items (but inventory exists) ── */}
          {!isEmpty && !hasUrgentItems && (
            <View style={styles.emptyMini}>
              <View style={[styles.emptyMiniIcon, { backgroundColor: C.softGreen }]}>
                <Feather name="check-circle" size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyMiniTitle}>All good!</Text>
                <Text style={styles.emptyMiniDesc}>
                  No urgent ingredients. Your kitchen is looking great.
                </Text>
              </View>
            </View>
          )}

          {/* ── Empty inventory ── */}
          {isEmpty && !isLoading && (
            <View style={styles.emptyMini}>
              <View style={[styles.emptyMiniIcon, { backgroundColor: C.surface }]}>
                <Feather name="inbox" size={18} color={C.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyMiniTitle}>Nothing to use yet</Text>
                <Text style={styles.emptyMiniDesc}>
                  Add ingredients to see what needs your attention.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            5. RECIPE IDEAS
            ══════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Recipe Ideas</Text>
              <Text style={styles.sectionSubtitle}>Cook before it goes to waste.</Text>
            </View>
          </View>

          {hasUrgentItems ? (
            <TouchableOpacity
              style={styles.recipeCard}
              onPress={() => navigation.navigate('Recipe')}
              activeOpacity={0.8}
            >
              <View style={styles.recipeInner}>
                <View style={styles.recipeIconBox}>
                  <Feather name="book-open" size={22} color={C.primary} />
                </View>
                <View style={styles.recipeContent}>
                  <Text style={styles.recipeTitle}>Cook before it goes to waste</Text>
                  <Text style={styles.recipeDesc}>
                    Generate recipe ideas from ingredients that expire soon.
                  </Text>
                </View>
              </View>
              <View style={styles.recipeCta}>
                <Text style={styles.recipeCtaText}>Generate Recipe</Text>
                <Feather name="arrow-right" size={16} color={C.primary} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.recipeCard}
              onPress={() => isEmpty ? navigation.navigate('FridgeCheck') : navigation.navigate('Recipe')}
              activeOpacity={0.8}
            >
              <View style={styles.recipeInner}>
                <View style={styles.recipeIconBox}>
                  <Feather name={isEmpty ? 'plus-circle' : 'check-circle'} size={22} color={C.primary} />
                </View>
                <View style={styles.recipeContent}>
                  <Text style={styles.recipeTitle}>
                    {isEmpty ? 'Start exploring recipes' : 'Your fridge is in good shape'}
                  </Text>
                  <Text style={styles.recipeDesc}>
                    {isEmpty
                      ? 'Add ingredients to get personalised recipe ideas.'
                      : 'Browse recipes you can make with what you have.'}
                  </Text>
                </View>
              </View>
              <View style={styles.recipeCta}>
                <Text style={styles.recipeCtaText}>
                  {isEmpty ? 'Add Ingredients' : 'View Recipes'}
                </Text>
                <Feather name="arrow-right" size={16} color={C.primary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom safe area */}
        <View style={{ height: 40 }} />
      </ScrollView>

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

      {/* ─── Add Item Modal ─── */}
      <AddEditItemModal 
        visible={addModalVisible} 
        onClose={() => setAddModalVisible(false)} 
        mode="add" 
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: C.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ─── Header ──────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: S.screenPx,
    paddingTop:        Platform.OS === 'ios' ? 62 : 52,
    paddingBottom:     S.sectionGap,
  },
  headerContent: {
    width: '100%',
  },
  headerTopRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    width:          '100%',
  },
  greeting: {
    color:         C.textPrimary,
    flex:          1,
    marginRight:   16,
    ...T.greeting,
  },
  headerSubtitle: {
    color:     C.textSecondary,
    ...T.subtitleHdr,
    marginTop: 8,
  },
  avatarBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: C.softGreen,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: {
    color:      C.primary,
    fontSize:   16,
    fontWeight: '600',
  },

  // ─── Loading ─────────────────────────────────────────────────────────────
  loadingBox: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 56,
  },
  loadingText: {
    color:     C.textSecondary,
    ...T.secondary,
    marginTop: 14,
  },

  // ─── Hero Card (Kitchen Summary / Empty) ─────────────────────────────────
  heroCard: {
    backgroundColor:  C.white,
    borderRadius:     R.cardLg,
    marginHorizontal: S.screenPx,
    padding:          S.cardPadLg,
    borderWidth:      1,
    borderColor:      C.border,
    ...SHADOW,
  },

  // Empty variant — centered
  heroIconCircle: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: C.softGreen,
    alignItems:      'center',
    justifyContent:  'center',
    alignSelf:       'center',
    marginBottom:    16,
  },
  heroTitle: {
    color:     C.textPrimary,
    ...T.cardTitleLg,
    textAlign: 'center',
  },
  heroDesc: {
    color:        C.textSecondary,
    ...T.body,
    textAlign:    'center',
    marginTop:    8,
    marginBottom: 22,
  },
  heroActions: {
    width: '100%',
    gap:   12,
  },

  // Filled variant — left-aligned
  heroTitleLeft: {
    color: C.textPrimary,
    ...T.cardTitleLg,
  },
  heroSubtitleLeft: {
    color:        C.textSecondary,
    ...T.secondary,
    marginTop:    4,
    marginBottom: 22,
  },

  // ─── Stats row ───────────────────────────────────────────────────────────
  statsRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex:       1,
    alignItems: 'center',
  },
  statIcon: {
    width:          44,
    height:         44,
    borderRadius:   R.icon,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   10,
  },
  statNumber: {
    color:      C.textPrimary,
    fontSize:   22,
    fontWeight: '700',
  },
  statLabel: {
    color:     C.textSecondary,
    ...T.caption,
    marginTop: 3,
  },
  statDivider: {
    width:           1,
    height:          44,
    backgroundColor: C.border,
  },

  // ─── Buttons ─────────────────────────────────────────────────────────────
  btnPrimary: {
    backgroundColor: C.primary,
    borderRadius:    R.button,
    height:          56,
    alignItems:      'center',
    justifyContent:  'center',
    flexDirection:   'row',
  },
  btnPrimaryText: {
    color: C.white,
    ...T.button,
  },
  btnSecondary: {
    backgroundColor: C.white,
    borderRadius:    R.button,
    height:          56,
    alignItems:      'center',
    justifyContent:  'center',
    flexDirection:   'row',
    borderWidth:     1,
    borderColor:     C.primary,
  },
  btnSecondaryText: {
    color: C.primary,
    ...T.button,
  },

  // ─── Section ─────────────────────────────────────────────────────────────
  section: {
    marginTop: S.sectionGap,
    paddingHorizontal: S.screenPx,
  },
  sectionScrollable: {
    marginTop: S.sectionGap,
  },
  sectionTitleScrollable: {
    color: C.textPrimary,
    paddingHorizontal: S.screenPx,
    ...T.sectionTitle,
  },
  sectionHeaderRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   S.titleGap,
  },
  sectionTitle: {
    color: C.textPrimary,
    ...T.sectionTitle,
  },
  sectionSubtitle: {
    color:     C.textSecondary,
    ...T.secondary,
    marginTop: 4,
  },
  sectionLink: {
    color:      C.primary,
    ...T.caption,
    fontWeight: '600',
    marginTop:  4,
  },

  // ─── Quick Actions (Scrollable) ──────────────────────────────────────────
  qaScroll: {
    marginTop: S.titleGap,
  },
  qaScrollContent: {
    paddingHorizontal: S.screenPx,
    paddingBottom:     8, // shadow visibility
    gap:               12,
  },
  qaCard: {
    width:           156,
    backgroundColor: C.white,
    borderRadius:    R.cardSm,
    padding:         S.cardPadSm,
    borderWidth:     1,
    borderColor:     C.border,
    ...SHADOW,
  },
  qaIcon: {
    width:          48,
    height:         48,
    borderRadius:   R.icon,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   S.innerGap,
  },
  qaTitle: {
    color:        C.textPrimary,
    fontSize:     16,
    fontWeight:   '600',
    marginBottom: 6,
  },
  qaDesc: {
    color:      C.textSecondary,
    fontSize:   13,
    lineHeight: 18,
  },

  // ─── Focus Items ─────────────────────────────────────────────────────────
  focusList: {
    gap: 10,
  },
  focusCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.white,
    borderRadius:    R.cardSm,
    borderWidth:     1,
    borderColor:     C.border,
    paddingRight:    8,
    ...SHADOW,
  },
  focusCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
  },
  focusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  focusTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  focusName: {
    color: C.textPrimary,
    ...T.body,
    fontWeight: '600',
  },
  focusMeta: {
    color:      C.textSecondary,
    ...T.caption,
    fontWeight: '400',
    marginTop:  2,
  },
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   5,
    paddingHorizontal: 12,
    borderRadius:      20,
    gap:               6,
  },
  badgeDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize:   12,
    fontWeight: '600',
  },
  focusDeleteBtn: {
    paddingHorizontal: 16,
    paddingVertical:   16,
  },

  // ─── Empty mini card (Use These First) ───────────────────────────────────
  emptyMini: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.surface,
    borderRadius:    R.cardSm,
    padding:         S.cardPadSm,
    gap:             S.innerGap,
    borderWidth:     1,
    borderColor:     C.border,
  },
  emptyMiniIcon: {
    width:          48,
    height:         48,
    borderRadius:   R.icon,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emptyMiniTitle: {
    color: C.textPrimary,
    ...T.body,
    fontWeight: '600',
    marginBottom: 3,
  },
  emptyMiniDesc: {
    color: C.textSecondary,
    ...T.secondary,
  },

  // ─── Recipe Ideas Card ───────────────────────────────────────────────────
  recipeCard: {
    backgroundColor: C.softGreen,
    borderRadius:    R.cardLg,
    padding:         S.cardPadLg,
    borderWidth:     1,
    borderColor:     '#D4E8DC',
  },
  recipeInner: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           S.innerGap,
    marginBottom:  18,
  },
  recipeIconBox: {
    width:           52,
    height:          52,
    borderRadius:    R.icon,
    backgroundColor: C.white,
    alignItems:      'center',
    justifyContent:  'center',
  },
  recipeContent: {
    flex: 1,
  },
  recipeTitle: {
    color: C.textPrimary,
    ...T.cardTitleSm,
    marginBottom: 5,
  },
  recipeDesc: {
    color: C.textSecondary,
    ...T.secondary,
  },
  recipeCta: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: C.white,
    borderRadius:    16,
    paddingVertical: 14,
    gap:             8,
    borderWidth:     1,
    borderColor:     C.border,
    ...SHADOW,
  },
  recipeCtaText: {
    color: C.primary,
    ...T.button,
  },
});
