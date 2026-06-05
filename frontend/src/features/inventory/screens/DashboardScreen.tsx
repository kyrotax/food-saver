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

// ─── Color Tokens (Home palette — white-first, matches Fridge Check) ────────
const HC = {
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
  cardShadow:    '#1F2A24',
};

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
 * DashboardScreen — Clean White Kitchen Dashboard
 *
 * Layout:
 * 1. Header (greeting + avatar)
 * 2. Kitchen Summary Card (empty state or stats)
 * 3. Quick Actions (scan, add, fridge check)
 * 4. Use These First (urgent/warning items)
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
  const firstName  = user?.name?.split(' ')[0] ?? 'Chef';
  const isEmpty    = items.length === 0;
  const redCount   = items.filter((i) => i.urgency_status === 'red').length;
  const yellowCount = items.filter((i) => i.urgency_status === 'yellow').length;
  const greenCount = items.filter((i) => i.urgency_status === 'green').length;
  const expiringCount = redCount + yellowCount;

  // Focus items: urgent first, then warning, sorted by expiry date
  const focusItems = useMemo(() => {
    return items
      .filter((i) => i.urgency_status === 'red' || i.urgency_status === 'yellow')
      .sort((a, b) => {
        const urgencyOrder = (s: string) => s === 'red' ? 0 : 1;
        const diff = urgencyOrder(a.urgency_status) - urgencyOrder(b.urgency_status);
        if (diff !== 0) return diff;
        return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
      })
      .slice(0, 5); // show top 5
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
            tintColor={HC.primary}
            colors={[HC.primary]}
          />
        }
      >
        {/* ─── 1. Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
            <Text style={styles.subtitle}>What's in your kitchen today?</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={logout} activeOpacity={0.7}>
            <Text style={styles.avatarInitial}>{firstName[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Loading ─── */}
        {isLoading && items.length === 0 && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={HC.primary} />
            <Text style={styles.loadingText}>Loading your kitchen...</Text>
          </View>
        )}

        {/* ─── 2. Kitchen Summary Card ─── */}
        {!isLoading && isEmpty && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconCircle}>
              <Feather name="package" size={28} color={HC.primary} />
            </View>
            <Text style={styles.summaryTitle}>Your kitchen is empty</Text>
            <Text style={styles.summaryDesc}>
              Scan a receipt or add your first ingredient to start reducing food waste.
            </Text>
            <View style={styles.summaryActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.85}
              >
                <Feather name="camera" size={18} color={HC.white} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Scan Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('FridgeCheck')}
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={18} color={HC.primary} style={{ marginRight: 8 }} />
                <Text style={styles.secondaryBtnText}>Add Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isLoading && !isEmpty && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.summaryTitle}>Kitchen Summary</Text>
                <Text style={styles.summarySubtitle}>Here's what needs your attention today.</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIconBox, { backgroundColor: HC.softGreen }]}>
                  <Feather name="box" size={18} color={HC.primary} />
                </View>
                <Text style={styles.statNumber}>{items.length}</Text>
                <Text style={styles.statLabel}>Ingredients</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconBox, { backgroundColor: HC.warningBg }]}>
                  <Feather name="clock" size={18} color={HC.warning} />
                </View>
                <Text style={styles.statNumber}>{yellowCount}</Text>
                <Text style={styles.statLabel}>Expiring Soon</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconBox, { backgroundColor: HC.urgentBg }]}>
                  <Feather name="alert-triangle" size={18} color={HC.urgent} />
                </View>
                <Text style={styles.statNumber}>{redCount}</Text>
                <Text style={styles.statLabel}>Urgent</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── 3. Quick Actions ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: HC.softGreen }]}>
              <Feather name="camera" size={22} color={HC.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Scan Receipt</Text>
            <Text style={styles.quickActionDesc}>Add items from your grocery receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('FridgeCheck')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Feather name="plus-square" size={22} color="#5B6AD0" />
            </View>
            <Text style={styles.quickActionTitle}>Add Manually</Text>
            <Text style={styles.quickActionDesc}>Add ingredients one by one</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('FridgeCheck')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF7E6' }]}>
              <Feather name="list" size={22} color="#D4860A" />
            </View>
            <Text style={styles.quickActionTitle}>Fridge Check</Text>
            <Text style={styles.quickActionDesc}>Review inventory before shopping</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 4. Use These First ─── */}
        {!isEmpty && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Use these first</Text>
                <Text style={styles.sectionSubtitle}>Ingredients that need your attention today.</Text>
              </View>
              {hasUrgentItems && (
                <TouchableOpacity onPress={() => navigation.navigate('FridgeCheck')}>
                  <Text style={styles.sectionLink}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {hasUrgentItems ? (
              <View style={styles.focusList}>
                {focusItems.map((item) => {
                  const days = getDaysRemaining(item.expiration_date);
                  const isUrgent = item.urgency_status === 'red';
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.focusCard}
                      onPress={() => {
                        if (item.is_scalable) handleSliderOpen(item.id);
                      }}
                      activeOpacity={item.is_scalable ? 0.7 : 1}
                    >
                      <View style={[
                        styles.focusAccent,
                        { backgroundColor: isUrgent ? HC.urgent : HC.warning }
                      ]} />
                      <View style={styles.focusContent}>
                        <View style={styles.focusTop}>
                          <View style={styles.focusInfo}>
                            <Text style={styles.focusName} numberOfLines={1}>
                              {item.product_name}
                            </Text>
                            <Text style={styles.focusMeta}>
                              {parseFloat(item.quantity.toString()).toFixed(1)} {item.unit} · {expiryText(days)}
                            </Text>
                          </View>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: isUrgent ? HC.urgentBg : HC.warningBg }
                          ]}>
                            <View style={[
                              styles.statusDot,
                              { backgroundColor: isUrgent ? HC.urgent : HC.warning }
                            ]} />
                            <Text style={[
                              styles.statusText,
                              { color: isUrgent ? HC.urgent : HC.warning }
                            ]}>
                              {isUrgent ? 'Urgent' : 'Warning'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {/* Delete action */}
                      <TouchableOpacity
                        style={styles.focusDeleteBtn}
                        onPress={() => handleDelete(item.id)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={16} color={HC.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.positiveCard}>
                <View style={[styles.positiveIconBox, { backgroundColor: HC.softGreen }]}>
                  <Feather name="check-circle" size={22} color={HC.primary} />
                </View>
                <View style={styles.positiveContent}>
                  <Text style={styles.positiveTitle}>All good!</Text>
                  <Text style={styles.positiveDesc}>
                    No urgent ingredients. Your kitchen is looking great.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {isEmpty && !isLoading && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Use these first</Text>
            </View>
            <View style={styles.positiveCard}>
              <View style={[styles.positiveIconBox, { backgroundColor: HC.surface }]}>
                <Feather name="inbox" size={22} color={HC.textMuted} />
              </View>
              <View style={styles.positiveContent}>
                <Text style={styles.positiveDesc}>
                  Add your first ingredients to see what needs attention.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ─── 5. Recipe Ideas ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recipe Ideas</Text>
          <Text style={styles.sectionSubtitleInline}>Cook before it goes to waste.</Text>
        </View>

        {hasUrgentItems ? (
          <TouchableOpacity
            style={styles.recipeCard}
            onPress={() => navigation.navigate('Recipe')}
            activeOpacity={0.8}
          >
            <View style={styles.recipeCardInner}>
              <View style={[styles.recipeIconBox, { backgroundColor: HC.softGreen }]}>
                <Feather name="book-open" size={24} color={HC.primary} />
              </View>
              <View style={styles.recipeCardContent}>
                <Text style={styles.recipeCardTitle}>Turn expiring ingredients into meals</Text>
                <Text style={styles.recipeCardDesc}>
                  Generate recipes based on {expiringCount} ingredient{expiringCount > 1 ? 's' : ''} that need to be used first.
                </Text>
              </View>
            </View>
            <View style={styles.recipeCardCta}>
              <Text style={styles.recipeCardCtaText}>Generate Recipe</Text>
              <Feather name="arrow-right" size={16} color={HC.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.recipeCard}
            onPress={() => isEmpty ? navigation.navigate('FridgeCheck') : navigation.navigate('Recipe')}
            activeOpacity={0.8}
          >
            <View style={styles.recipeCardInner}>
              <View style={[styles.recipeIconBox, { backgroundColor: HC.softGreen }]}>
                <Feather name={isEmpty ? 'plus-circle' : 'check-circle'} size={24} color={HC.primary} />
              </View>
              <View style={styles.recipeCardContent}>
                <Text style={styles.recipeCardTitle}>
                  {isEmpty ? 'Get started with recipes' : 'Your kitchen is under control'}
                </Text>
                <Text style={styles.recipeCardDesc}>
                  {isEmpty
                    ? 'Add ingredients to get personalised recipe ideas.'
                    : 'Add more ingredients or check your fridge to get recipe ideas.'}
                </Text>
              </View>
            </View>
            <View style={styles.recipeCardCta}>
              <Text style={styles.recipeCardCtaText}>
                {isEmpty ? 'Add Ingredients' : 'View Recipes'}
              </Text>
              <Feather name="arrow-right" size={16} color={HC.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
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
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HC.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // ─── Header ───
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 24,
    paddingTop:        Platform.OS === 'ios' ? 60 : 48,
    paddingBottom:     20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color:         HC.textPrimary,
    fontSize:      22,
    fontWeight:    '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color:     HC.textSecondary,
    fontSize:  14,
    marginTop: 4,
  },
  avatarBtn: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: HC.softGreen,
    borderWidth:     1.5,
    borderColor:     HC.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      16,
  },
  avatarInitial: {
    color:      HC.primary,
    fontSize:   17,
    fontWeight: '700',
  },

  // ─── Loading ───
  loadingBox: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 48,
  },
  loadingText: {
    color:     HC.textSecondary,
    fontSize:  14,
    marginTop: 12,
  },

  // ─── Kitchen Summary Card ───
  summaryCard: {
    backgroundColor: HC.white,
    borderRadius:    24,
    marginHorizontal: 20,
    marginBottom:    8,
    padding:         24,
    borderWidth:     1,
    borderColor:     HC.border,
    shadowColor:     HC.cardShadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.05,
    shadowRadius:    12,
    elevation:       3,
  },
  summaryHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   20,
  },
  summaryIconCircle: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: HC.softGreen,
    alignItems:      'center',
    justifyContent:  'center',
    alignSelf:       'center',
    marginBottom:    16,
  },
  summaryTitle: {
    color:         HC.textPrimary,
    fontSize:      18,
    fontWeight:    '700',
    letterSpacing: -0.3,
  },
  summarySubtitle: {
    color:     HC.textSecondary,
    fontSize:  13,
    marginTop: 3,
  },
  summaryDesc: {
    color:      HC.textSecondary,
    fontSize:   14,
    textAlign:  'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  summaryActions: {
    width: '100%',
    gap:   10,
  },

  // ─── Stats row ───
  statsRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex:       1,
    alignItems: 'center',
  },
  statIconBox: {
    width:        40,
    height:       40,
    borderRadius: 12,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    color:      HC.textPrimary,
    fontSize:   20,
    fontWeight: '700',
  },
  statLabel: {
    color:     HC.textSecondary,
    fontSize:  11,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width:           1,
    height:          40,
    backgroundColor: HC.border,
  },

  // ─── Buttons ───
  primaryBtn: {
    backgroundColor: HC.primary,
    borderRadius:    14,
    height:          50,
    alignItems:      'center',
    justifyContent:  'center',
    flexDirection:   'row',
  },
  primaryBtnText: {
    color:      HC.white,
    fontSize:   15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: HC.white,
    borderRadius:    14,
    height:          50,
    alignItems:      'center',
    justifyContent:  'center',
    flexDirection:   'row',
    borderWidth:     1.5,
    borderColor:     HC.border,
  },
  secondaryBtnText: {
    color:      HC.primary,
    fontSize:   15,
    fontWeight: '600',
  },

  // ─── Section ───
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop:        24,
    paddingBottom:     4,
    flexDirection:     'row',
    alignItems:        'flex-end',
    justifyContent:    'space-between',
  },
  sectionTitle: {
    color:         HC.textPrimary,
    fontSize:      17,
    fontWeight:    '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color:     HC.textSecondary,
    fontSize:  13,
    marginTop: 2,
  },
  sectionSubtitleInline: {
    color:    HC.textSecondary,
    fontSize: 12,
  },
  sectionLink: {
    color:      HC.primary,
    fontSize:   13,
    fontWeight: '600',
  },

  // ─── Quick Actions Grid ───
  quickActionsGrid: {
    flexDirection:     'row',
    paddingHorizontal: 20,
    paddingTop:        12,
    gap:               10,
  },
  quickActionCard: {
    flex:            1,
    backgroundColor: HC.white,
    borderRadius:    18,
    padding:         16,
    borderWidth:     1,
    borderColor:     HC.border,
    shadowColor:     HC.cardShadow,
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.04,
    shadowRadius:    6,
    elevation:       2,
  },
  quickActionIcon: {
    width:        42,
    height:       42,
    borderRadius: 13,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    color:      HC.textPrimary,
    fontSize:   13,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickActionDesc: {
    color:      HC.textSecondary,
    fontSize:   11,
    lineHeight: 15,
  },

  // ─── Focus Items ───
  focusList: {
    paddingHorizontal: 20,
    paddingTop:        8,
    gap:               8,
  },
  focusCard: {
    flexDirection:   'row',
    backgroundColor: HC.white,
    borderRadius:    16,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     HC.border,
    shadowColor:     HC.cardShadow,
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.04,
    shadowRadius:    6,
    elevation:       2,
    alignItems:      'center',
  },
  focusAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  focusContent: {
    flex:    1,
    padding: 14,
  },
  focusTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            8,
  },
  focusInfo: {
    flex: 1,
  },
  focusName: {
    color:      HC.textPrimary,
    fontSize:   15,
    fontWeight: '600',
  },
  focusMeta: {
    color:     HC.textSecondary,
    fontSize:  12,
    marginTop: 3,
  },
  statusBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   4,
    paddingHorizontal: 10,
    borderRadius:      20,
    gap:               5,
  },
  statusDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  statusText: {
    fontSize:   11,
    fontWeight: '600',
  },
  focusDeleteBtn: {
    paddingHorizontal: 14,
    paddingVertical:   14,
  },

  // ─── Positive card ───
  positiveCard: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   HC.white,
    borderRadius:      16,
    marginHorizontal:  20,
    marginTop:         8,
    padding:           16,
    borderWidth:       1,
    borderColor:       HC.border,
    gap:               14,
  },
  positiveIconBox: {
    width:        44,
    height:       44,
    borderRadius: 14,
    alignItems:   'center',
    justifyContent: 'center',
  },
  positiveContent: {
    flex: 1,
  },
  positiveTitle: {
    color:      HC.textPrimary,
    fontSize:   14,
    fontWeight: '700',
    marginBottom: 3,
  },
  positiveDesc: {
    color:      HC.textSecondary,
    fontSize:   13,
    lineHeight: 19,
  },

  // ─── Recipe Ideas Card ───
  recipeCard: {
    backgroundColor:   HC.softGreen,
    borderRadius:      20,
    marginHorizontal:  20,
    marginTop:         12,
    padding:           20,
    borderWidth:       1,
    borderColor:       '#D4E8DC',
  },
  recipeCardInner: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           14,
    marginBottom:  16,
  },
  recipeIconBox: {
    width:        48,
    height:       48,
    borderRadius: 16,
    backgroundColor: HC.white,
    alignItems:   'center',
    justifyContent: 'center',
  },
  recipeCardContent: {
    flex: 1,
  },
  recipeCardTitle: {
    color:      HC.textPrimary,
    fontSize:   15,
    fontWeight: '700',
    marginBottom: 4,
  },
  recipeCardDesc: {
    color:      HC.textSecondary,
    fontSize:   13,
    lineHeight: 19,
  },
  recipeCardCta: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: HC.white,
    borderRadius:    12,
    paddingVertical: 12,
    gap:             6,
  },
  recipeCardCtaText: {
    color:      HC.primary,
    fontSize:   14,
    fontWeight: '700',
  },
});
