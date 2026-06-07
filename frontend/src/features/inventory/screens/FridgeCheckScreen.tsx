import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, ScrollView,
  RefreshControl, Platform, Dimensions, PanResponder, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation }     from '@react-navigation/native';
import { useInventoryStore } from '@features/inventory/store/inventoryStore';
import { FoodItem }          from '@features/inventory/store/inventoryStore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// ─── Color Tokens (Fridge Check palette — white-first) ──────────────────────
const FC = {
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

// ─── Category classification ────────────────────────────────────────────────
const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Protein', 'Dairy', 'Grains', 'Frozen', 'Others'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_ICONS: Record<Category, keyof typeof Feather.glyphMap> = {
  All:         'grid',
  Vegetables:  'sun',       // leaf-like
  Fruits:      'heart',
  Protein:     'target',
  Dairy:       'droplet',
  Grains:      'layers',
  Frozen:      'cloud-snow',
  Others:      'more-horizontal',
};

const VEGETABLE_KW = ['tomat', 'wortel', 'carrot', 'bayam', 'spinach', 'brokoli', 'broccoli', 'kangkung', 'selada', 'lettuce', 'bawang', 'onion', 'cabai', 'pepper', 'kentang', 'potato', 'timun', 'cucumber', 'terong', 'eggplant', 'labu', 'pumpkin', 'jagung', 'corn', 'kol', 'cabbage', 'paprika', 'sawi', 'seledri', 'celery'];
const FRUIT_KW     = ['apel', 'apple', 'jeruk', 'orange', 'pisang', 'banana', 'mangga', 'mango', 'semangka', 'watermelon', 'melon', 'anggur', 'grape', 'strawberry', 'nanas', 'pineapple', 'pepaya', 'papaya', 'lemon', 'lime', 'avocado', 'alpukat', 'buah', 'fruit', 'berry', 'kiwi', 'durian', 'rambutan'];
const PROTEIN_KW   = ['ayam', 'chicken', 'daging', 'beef', 'meat', 'ikan', 'fish', 'telur', 'egg', 'udang', 'shrimp', 'tahu', 'tofu', 'tempe', 'tempeh', 'sosis', 'sausage', 'bakso', 'cumi', 'squid', 'salmon', 'tuna', 'sardine', 'ham', 'bacon', 'nugget'];
const DAIRY_KW     = ['susu', 'milk', 'keju', 'cheese', 'yogurt', 'mentega', 'butter', 'cream', 'krim', 'whipped', 'dairy'];
const GRAIN_KW     = ['beras', 'rice', 'roti', 'bread', 'mie', 'noodle', 'pasta', 'tepung', 'flour', 'oat', 'gandum', 'wheat', 'sereal', 'cereal', 'crackers', 'biscuit'];

function classifyItem(item: FoodItem): Category {
  if (item.storage_location === 'freezer') return 'Frozen';
  const name = item.product_name.toLowerCase();
  if (VEGETABLE_KW.some(k => name.includes(k))) return 'Vegetables';
  if (FRUIT_KW.some(k => name.includes(k)))     return 'Fruits';
  if (PROTEIN_KW.some(k => name.includes(k)))   return 'Protein';
  if (DAIRY_KW.some(k => name.includes(k)))     return 'Dairy';
  if (GRAIN_KW.some(k => name.includes(k)))     return 'Grains';
  return 'Others';
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

function urgencyOrder(s: string): number {
  return s === 'red' ? 0 : s === 'yellow' ? 1 : 2;
}

// ─── StatusBadge ────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: 'red' | 'yellow' | 'green' }> = ({ status }) => {
  const conf = status === 'red'
    ? { bg: FC.urgentBg, color: FC.urgent, label: 'Urgent' }
    : status === 'yellow'
    ? { bg: FC.warningBg, color: FC.warning, label: 'Use soon' }
    : { bg: FC.safeBg, color: FC.safe, label: 'Fresh' };
  return (
    <View style={[s.badge, { backgroundColor: conf.bg }]}>
      <Text style={[s.badgeText, { color: conf.color }]}>{conf.label}</Text>
    </View>
  );
};

// ─── FridgeItemCard (full card for category sections) ───────────────────────
const FridgeItemCard: React.FC<{
  item: FoodItem;
  category: Category;
  onPress: (ref: React.RefObject<TouchableOpacity>) => void;
  style?: any;
}> = ({ item, category, onPress, style }) => {
  const days = getDaysRemaining(item.expiration_date);
  const cardRef = useRef<TouchableOpacity>(null);
  return (
    <TouchableOpacity
      ref={cardRef}
      style={[s.itemCard, style]}
      onPress={() => onPress(cardRef)}
      activeOpacity={0.7}
    >
      <View style={s.itemIconBox}>
        <Feather name={CATEGORY_ICONS[category]} size={20} color={FC.primary} />
      </View>
      <View style={s.itemContent}>
        <View style={s.itemTopRow}>
          <Text style={s.itemName} numberOfLines={1}>{item.product_name}</Text>
          <StatusBadge status={item.urgency_status} />
        </View>
        <Text style={s.itemCategory}>{category}</Text>
        <Text style={s.itemMeta}>
          {parseFloat(item.quantity.toString()).toFixed(1)} {item.unit}  ·  {expiryText(days)}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={FC.textMuted} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
};

// ─── Expiring Soon compact card ─────────────────────────────────────────────
const ExpiringSoonCard: React.FC<{
  item: FoodItem;
  onPress: (ref: React.RefObject<TouchableOpacity>) => void;
  style?: any;
}> = ({ item, onPress, style }) => {
  const days = getDaysRemaining(item.expiration_date);
  const isUrgent = item.urgency_status === 'red';
  const cardRef = useRef<TouchableOpacity>(null);
  return (
    <TouchableOpacity
      ref={cardRef}
      style={[s.expiringCard, { borderColor: isUrgent ? FC.urgent : FC.warning }, style]}
      onPress={() => onPress(cardRef)}
      activeOpacity={0.7}
    >
      <View style={s.expiringHeader}>
        <Feather name="alert-circle" size={14} color={isUrgent ? FC.urgent : FC.warning} />
        <StatusBadge status={item.urgency_status} />
      </View>
      <Text style={s.expiringName} numberOfLines={1}>{item.product_name}</Text>
      <Text style={s.expiringMeta}>
        {parseFloat(item.quantity.toString()).toFixed(1)} {item.unit}
      </Text>
      <Text style={[s.expiringDays, { color: isUrgent ? FC.urgent : FC.warning }]}>
        {expiryText(days)}
      </Text>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FridgeCheckScreen — Main component
// ═══════════════════════════════════════════════════════════════════════════════
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const PANEL_HEIGHT = Math.min(windowHeight * 0.85, 580);

export const FridgeCheckScreen: React.FC = () => {
  const navigation       = useNavigation<any>();
  const fetchFridgeCheck  = useInventoryStore((st) => st.fetchFridgeCheck);

  const [items,      setItems]      = useState<FoodItem[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add'|'edit'>('add');
  const [modalItem, setModalItem] = useState<FoodItem | null>(null);
  
  // Custom morph state
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [storage, setStorage] = useState<'freezer'|'chiller'|'room_temp'>('room_temp');
  const [expiration, setExpiration] = useState(''); // YYYY-MM-DD
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shared Animation Values
  const progress = useSharedValue(0);
  const listScale = useSharedValue(1);
  const overlayOpacity = useSharedValue(0);
  const cardBounds = useSharedValue({ x: 0, y: 0, w: 0, h: 0 });
  const dragY = useSharedValue(0);

  // Sync edit/add states
  useEffect(() => {
    if (modalVisible) {
      if (modalMode === 'edit' && modalItem) {
        setName(modalItem.product_name);
        setQuantity(modalItem.quantity.toString());
        setUnit(modalItem.unit);
        setStorage(modalItem.storage_location);
        setExpiration(modalItem.expiration_date);
      } else {
        setName('');
        setQuantity('1');
        setUnit('pcs');
        setStorage('room_temp');
        
        // Default to +3 days
        const d = new Date();
        d.setDate(d.getDate() + 3);
        setExpiration(d.toISOString().split('T')[0]);
      }
    }
  }, [modalVisible, modalMode, modalItem]);

  const setDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiration(d.toISOString().split('T')[0]);
  };

  const handleAddManually = () => {
    // Start morph from bottom center
    cardBounds.value = {
      x: 0,
      y: windowHeight,
      w: windowWidth,
      h: 0,
    };
    setModalMode('add');
    setModalItem(null);
    setActiveCardId(null);
    setModalVisible(true);

    // Run animation
    dragY.value = 0;
    progress.value = 0;
    overlayOpacity.value = withTiming(0.35, { duration: 300 });
    listScale.value = withTiming(0.98, { duration: 300 });
    progress.value = withSpring(1, { damping: 22, stiffness: 200 });
  };

  const handleEditItem = (item: FoodItem, cardRef: React.RefObject<TouchableOpacity>) => {
    if (cardRef.current) {
      cardRef.current.measureInWindow((x, y, w, h) => {
        cardBounds.value = { x, y, w, h };
        setModalMode('edit');
        setModalItem(item);
        setActiveCardId(item.id);
        setModalVisible(true);

        // Run animation
        dragY.value = 0;
        progress.value = 0;
        overlayOpacity.value = withTiming(0.35, { duration: 300 });
        listScale.value = withTiming(0.98, { duration: 300 });
        progress.value = withSpring(1, { damping: 22, stiffness: 200 });
      });
    }
  };

  const handleClose = () => {
    overlayOpacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    listScale.value = withTiming(1, {
      duration: 300,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    dragY.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    progress.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }, (finished) => {
      if (finished) {
        runOnJS(cleanupAfterClose)();
      }
    });
  };

  const cleanupAfterClose = () => {
    setModalVisible(false);
    setModalItem(null);
    setActiveCardId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an ingredient name.');
      return;
    }
    if (!expiration.trim() || isNaN(Date.parse(expiration))) {
      Alert.alert('Error', 'Please enter a valid date (YYYY-MM-DD).');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { updateItem, addManualItem } = useInventoryStore.getState();
      if (modalMode === 'edit' && modalItem) {
        await updateItem(modalItem.id, {
          product_name: name.trim(),
          quantity: parseFloat(quantity) || 1,
          unit: unit.trim() || 'pcs',
          storage_location: storage,
          expiration_date: expiration,
        });
      } else {
        await addManualItem({
          product_name: name.trim(),
          quantity: parseFloat(quantity) || 1,
          unit: unit.trim() || 'pcs',
          storage_location: storage,
          expiration_date: expiration,
          is_scalable: true,
        });
      }
      await load();
      handleClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!modalItem) return;
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to remove ${modalItem.product_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const { deleteItem } = useInventoryStore.getState();
              await deleteItem(modalItem.id);
              await load();
              handleClose();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete item.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  // Drag Gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        dragY.value = Math.max(0, gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.6) {
          runOnJS(handleClose)();
        } else {
          dragY.value = withSpring(0, { damping: 26, stiffness: 220 });
        }
      },
    })
  ).current;

  // Animated Styles
  const animatedMainStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: listScale.value }],
      borderRadius: interpolate(listScale.value, [0.98, 1], [24, 0]),
      overflow: 'hidden',
    };
  });

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  const animatedMorphStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const start = cardBounds.value;

    const left = interpolate(p, [0, 1], [start.x, 0]);
    const top = interpolate(p, [0, 1], [start.y, windowHeight - PANEL_HEIGHT]);
    const width = interpolate(p, [0, 1], [start.w, windowWidth]);
    const height = interpolate(p, [0, 1], [start.h, PANEL_HEIGHT]);
    const borderRadius = interpolate(p, [0, 1], [20, 28]);

    return {
      position: 'absolute',
      left,
      top,
      width,
      height,
      borderRadius,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: FC.border,
      transform: [{ translateY: dragY.value }],
      elevation: interpolate(p, [0, 1], [3, 8]),
      shadowColor: '#1F2A24',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: interpolate(p, [0, 1], [0.06, 0.15]),
      shadowRadius: interpolate(p, [0, 1], [8, 16]),
      overflow: 'hidden',
    };
  });

  const animatedPreviewStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 0.25], [1, 0]),
    };
  });

  const animatedFormStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0.65, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(progress.value, [0.65, 1], [24, 0]),
        },
      ],
    };
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchFridgeCheck();
      setItems(data);
    } catch { /* handled by store */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // ─── Derived data ───────────────────────────────────────────────────────
  const classifiedItems = useMemo(() =>
    items.map(item => ({ item, category: classifyItem(item) }))
  , [items]);

  const filtered = useMemo(() => {
    let list = classifiedItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(({ item }) => item.product_name.toLowerCase().includes(q));
    }
    if (activeCategory !== 'All') {
      list = list.filter(({ category }) => category === activeCategory);
    }
    return list;
  }, [classifiedItems, search, activeCategory]);

  const expiringItems = useMemo(() =>
    filtered
      .filter(({ item }) => item.urgency_status === 'red' || item.urgency_status === 'yellow')
      .sort((a, b) =>
        urgencyOrder(a.item.urgency_status) - urgencyOrder(b.item.urgency_status) ||
        getDaysRemaining(a.item.expiration_date) - getDaysRemaining(b.item.expiration_date)
      )
  , [filtered]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, { item: FoodItem; category: Category }[]> = {};
    for (const entry of filtered) {
      const key = entry.category;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) =>
        urgencyOrder(a.item.urgency_status) - urgencyOrder(b.item.urgency_status) ||
        getDaysRemaining(a.item.expiration_date) - getDaysRemaining(b.item.expiration_date)
      );
    }
    return groups;
  }, [filtered]);

  const isEmpty = items.length === 0;
  const filteredEmpty = filtered.length === 0 && !isEmpty;

  // ─── Render sections as FlatList data ───────────────────────────────────
  type SectionData =
    | { type: 'expiring' }
    | { type: 'catHeader'; category: Category; count: number }
    | { type: 'catItem'; item: FoodItem; category: Category };

  const sectionData = useMemo<SectionData[]>(() => {
    const data: SectionData[] = [];
    data.push({ type: 'expiring' });
    const cats = activeCategory !== 'All'
      ? [activeCategory]
      : (Object.keys(groupedByCategory) as Category[]);
    for (const cat of cats) {
      const entries = groupedByCategory[cat];
      if (!entries || entries.length === 0) continue;
      data.push({ type: 'catHeader', category: cat, count: entries.length });
      for (const entry of entries) {
        data.push({ type: 'catItem', item: entry.item, category: entry.category });
      }
    }
    return data;
  }, [groupedByCategory, expiringItems, activeCategory]);

  return (
    <View style={s.screen}>
      <Animated.View style={[{ flex: 1, backgroundColor: FC.bg }, animatedMainStyle]}>
        {/* ─── Header ─── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color={FC.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Fridge Check</Text>
            <Text style={s.headerSubtitle}>Check what you have before buying more</Text>
          </View>
          <TouchableOpacity
            style={s.headerAction}
            onPress={handleAddManually}
            hitSlop={8}
          >
            <Feather name="plus-circle" size={24} color={FC.primary} />
          </TouchableOpacity>
        </View>

        {/* ─── Search ─── */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Feather name="search" size={16} color={FC.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search ingredients"
              placeholderTextColor={FC.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <Feather name="x" size={16} color={FC.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ─── Category Chips ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
          style={s.chipsScroll}
        >
          {CATEGORIES.map(cat => {
            const active = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                style={[s.chip, active && s.chipActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.7}
              >
                <Feather
                  name={CATEGORY_ICONS[cat]}
                  size={14}
                  color={active ? FC.white : FC.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text style={[s.chipText, active && s.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Loading ─── */}
        {isLoading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={FC.primary} />
            <Text style={s.loadingText}>Loading your kitchen...</Text>
          </View>
        ) : isEmpty ? (
          /* ─── Full Empty State ─── */
          <View style={s.emptyState}>
            <View style={s.emptyIconCircle}>
              <Feather name="inbox" size={40} color={FC.textMuted} />
            </View>
            <Text style={s.emptyTitle}>Your fridge is empty</Text>
            <Text style={s.emptyDesc}>
              Start tracking your ingredients before they expire.
            </Text>
            <TouchableOpacity
              style={s.emptyPrimaryBtn}
              onPress={() => navigation.navigate('Scan')}
              activeOpacity={0.85}
            >
              <Feather name="camera" size={18} color={FC.white} style={{ marginRight: 8 }} />
              <Text style={s.emptyPrimaryText}>Scan Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.emptySecondaryBtn}
              onPress={handleAddManually}
              activeOpacity={0.8}
            >
              <Feather name="edit-3" size={16} color={FC.primary} style={{ marginRight: 8 }} />
              <Text style={s.emptySecondaryText}>Add Manually</Text>
            </TouchableOpacity>
          </View>
        ) : filteredEmpty ? (
          /* ─── Category / search empty ─── */
          <View style={s.smallEmpty}>
            <Feather name="search" size={24} color={FC.textMuted} />
            <Text style={s.smallEmptyText}>No items in this category yet.</Text>
          </View>
        ) : (
          /* ─── Inventory list ─── */
          <FlatList
            data={sectionData}
            keyExtractor={(item, idx) => {
              if (item.type === 'expiring') return 'expiring-section';
              if (item.type === 'catHeader') return `cat-${item.category}`;
              return `item-${item.item.id}`;
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={FC.primary}
                colors={[FC.primary]}
              />
            }
            renderItem={({ item: row }) => {
              if (row.type === 'expiring') {
                return (
                  <View style={s.expiringSection}>
                    <View style={s.sectionTitleRow}>
                      <View>
                        <Text style={s.sectionTitle}>Expiring Soon</Text>
                        <Text style={s.sectionSubtitle}>Use these first to reduce waste</Text>
                      </View>
                    </View>
                    {expiringItems.length === 0 ? (
                      <View style={s.expiringPositive}>
                        <Feather name="check-circle" size={18} color={FC.primary} />
                        <Text style={s.expiringPositiveText}>
                          No urgent ingredients yet. Your kitchen is looking good.
                        </Text>
                      </View>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.expiringScroll}
                      >
                        {expiringItems.map(({ item }) => (
                          <ExpiringSoonCard
                            key={item.id}
                            item={item}
                            onPress={(ref) => handleEditItem(item, ref)}
                            style={{ opacity: activeCardId === item.id ? 0.01 : 1 }}
                          />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                );
              }
              if (row.type === 'catHeader') {
                return (
                  <View style={s.catHeaderRow}>
                    <Text style={s.catHeaderTitle}>{row.category}</Text>
                    <Text style={s.catHeaderCount}>
                      {row.count} item{row.count > 1 ? 's' : ''}
                    </Text>
                  </View>
                );
              }
              // catItem
              return (
                <FridgeItemCard
                  item={row.item}
                  category={row.category}
                  onPress={(ref) => handleEditItem(row.item, ref)}
                  style={{ opacity: activeCardId === row.item.id ? 0.01 : 1 }}
                />
              );
            }}
            contentContainerStyle={s.listContent}
          />
        )}
      </Animated.View>

      {/* ─── Backdrop Dim Overlay ─── */}
      {modalVisible && (
        <Animated.View style={[s.overlay, animatedOverlayStyle]}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>
      )}

      {/* ─── Morphing Panel ─── */}
      {modalVisible && (
        <Animated.View style={[s.morphContainer, animatedMorphStyle]}>
          {/* Card Preview Layer (Fades out early) */}
          {modalMode === 'edit' && modalItem && (
            <Animated.View style={[s.previewLayer, animatedPreviewStyle, { pointerEvents: 'none' }]}>
              <View style={s.itemIconBox}>
                <Feather name={CATEGORY_ICONS[classifyItem(modalItem)]} size={20} color={FC.primary} />
              </View>
              <View style={s.itemContent}>
                <View style={s.itemTopRow}>
                  <Text style={s.itemName} numberOfLines={1}>{modalItem.product_name}</Text>
                  <StatusBadge status={modalItem.urgency_status} />
                </View>
                <Text style={s.itemCategory}>{classifyItem(modalItem)}</Text>
                <Text style={s.itemMeta}>
                  {parseFloat(modalItem.quantity.toString()).toFixed(1)} {modalItem.unit}  ·  {expiryText(getDaysRemaining(modalItem.expiration_date))}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={FC.textMuted} style={{ marginLeft: 8 }} />
            </Animated.View>
          )}

          {/* Form Layer (Fades in & slides up) */}
          <Animated.View style={[s.formLayer, animatedFormStyle]}>
            {/* Gesture handle */}
            <View style={s.dragHandleRow} {...panResponder.panHandlers}>
              <View style={s.dragHandleBar} />
            </View>

            <View style={s.formHeader}>
              <Text style={s.formTitle}>{modalMode === 'add' ? 'Add Ingredient' : 'Edit Ingredient'}</Text>
              <TouchableOpacity onPress={handleClose} style={s.formCloseBtn} hitSlop={12}>
                <Feather name="x" size={22} color={FC.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={s.formContent} keyboardShouldPersistTaps="handled">
              <Text style={[s.formLabel, { marginTop: 0 }]}>Name</Text>
              <TextInput
                style={s.formInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Tomatoes"
                placeholderTextColor={FC.textMuted}
              />

              <View style={s.formRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={s.formLabel}>Quantity</Text>
                  <TextInput
                    style={s.formInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.formLabel}>Unit</Text>
                  <TextInput
                    style={s.formInput}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="pcs, kg, L..."
                    placeholderTextColor={FC.textMuted}
                  />
                </View>
              </View>

              <Text style={s.formLabel}>Storage Location</Text>
              <Text style={s.storageHint}>Choose where you store it so Fridgy can estimate freshness better.</Text>
              <View style={s.tabsRow}>
                {(['room_temp', 'chiller', 'freezer'] as const).map(loc => {
                  const locLabel = loc === 'room_temp' ? 'Room Temp' : loc === 'chiller' ? 'Chiller' : 'Freezer';
                  return (
                    <TouchableOpacity
                      key={loc}
                      style={[s.tab, storage === loc && s.tabActive]}
                      onPress={() => setStorage(loc)}
                    >
                      <Text style={[s.tabText, storage === loc && s.tabTextActive]}>
                        {locLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={s.formLabel}>Expiration Date</Text>
              <TextInput
                style={s.formInput}
                value={expiration}
                onChangeText={setExpiration}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={FC.textMuted}
              />
              <View style={s.quickDates}>
                {[3, 7, 14, 30].map(days => (
                  <TouchableOpacity key={days} style={s.quickDateBtn} onPress={() => setDays(days)}>
                    <Text style={s.quickDateText}>+{days}d</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={s.formFooter}>
              {modalMode === 'edit' && (
                <TouchableOpacity
                  style={s.formDeleteBtn}
                  onPress={handleDelete}
                  disabled={isSubmitting}
                >
                  <Feather name="trash-2" size={20} color={FC.urgent} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={s.formSaveBtn}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={FC.white} />
                ) : (
                  <Text style={s.formSaveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// Styles
// ═════════════════════════════════════════════════════════════════════════════
const SHADOW = Platform.select({
  ios: {
    shadowColor: '#1F2A24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
})!;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: FC.bg },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 12,
    backgroundColor: FC.bg,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: FC.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: FC.textSecondary,
    marginTop: 2,
  },
  headerAction: { padding: 4 },

  // ─── Search ───
  searchRow: { paddingHorizontal: 20, paddingBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FC.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FC.border,
    paddingHorizontal: 14,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: FC.textPrimary,
    paddingVertical: 0,
  },

  // ─── Chips ───
  chipsScroll: { maxHeight: 48 },
  chipsRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: FC.border,
    backgroundColor: FC.bg,
  },
  chipActive: {
    backgroundColor: FC.primary,
    borderColor: FC.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: FC.textSecondary,
  },
  chipTextActive: {
    color: FC.white,
    fontWeight: '600',
  },

  // ─── Loading & Empty ───
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: FC.textSecondary, marginTop: 12, fontSize: 14 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: FC.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: FC.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: FC.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: FC.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FC.primary,
    height: 48,
    borderRadius: 14,
    width: '100%',
    marginBottom: 10,
  },
  emptyPrimaryText: {
    color: FC.white,
    fontSize: 15,
    fontWeight: '600',
  },
  emptySecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FC.softGreen,
    height: 48,
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: FC.primary,
  },
  emptySecondaryText: {
    color: FC.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  smallEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  smallEmptyText: {
    color: FC.textSecondary,
    fontSize: 14,
  },

  // ─── Expiring Soon Section ───
  expiringSection: { paddingBottom: 8 },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: FC.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: FC.textSecondary,
    marginTop: 2,
  },
  expiringScroll: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 10,
  },
  expiringPositive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FC.softGreen,
    borderRadius: 14,
    marginHorizontal: 20,
    padding: 14,
  },
  expiringPositiveText: {
    flex: 1,
    fontSize: 13,
    color: FC.primary,
    lineHeight: 20,
  },

  // ─── Expiring Card (compact) ───
  expiringCard: {
    width: 150,
    backgroundColor: FC.white,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    ...SHADOW,
  },
  expiringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expiringName: {
    fontSize: 14,
    fontWeight: '600',
    color: FC.textPrimary,
    marginBottom: 4,
  },
  expiringMeta: {
    fontSize: 12,
    color: FC.textSecondary,
    marginBottom: 4,
  },
  expiringDays: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ─── Category Header ───
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  catHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: FC.textPrimary,
  },
  catHeaderCount: {
    fontSize: 12,
    color: FC.textSecondary,
  },

  // ─── Item Card ───
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FC.white,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FC.border,
    padding: 14,
    ...SHADOW,
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: FC.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: FC.textPrimary,
    marginRight: 8,
  },
  itemCategory: {
    fontSize: 12,
    color: FC.textSecondary,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: FC.textSecondary,
  },

  // ─── Status Badge ───
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // ─── List ───
  listContent: {
    paddingBottom: 32,
  },

  // ─── Custom Reanimated Panel Styles ───
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 10,
  },
  morphContainer: {
    position: 'absolute',
    zIndex: 11,
  },
  previewLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: FC.white,
  },
  formLayer: {
    flex: 1,
    backgroundColor: FC.white,
  },
  dragHandleRow: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FC.white,
  },
  dragHandleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: FC.border,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: FC.textPrimary,
  },
  formCloseBtn: {
    padding: 4,
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: FC.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    backgroundColor: FC.surface,
    borderWidth: 1,
    borderColor: FC.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: FC.textPrimary,
  },
  formRow: {
    flexDirection: 'row',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FC.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FC.surface,
  },
  tabActive: {
    backgroundColor: FC.primary,
    borderColor: FC.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: FC.textSecondary,
  },
  tabTextActive: {
    color: FC.white,
  },
  quickDates: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    marginBottom: 40,
  },
  quickDateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: FC.surface,
    borderWidth: 1,
    borderColor: FC.border,
  },
  quickDateText: {
    fontSize: 13,
    color: FC.textPrimary,
    fontWeight: '500',
  },
  formFooter: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1,
    borderTopColor: FC.border,
    backgroundColor: FC.white,
    gap: 12,
  },
  formSaveBtn: {
    flex: 1,
    backgroundColor: FC.primary,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSaveBtnText: {
    color: FC.white,
    fontSize: 15,
    fontWeight: '600',
  },
  formDeleteBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FDEDED', // urgentBg #FDEDED
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FC.urgent,
  },
  storageHint: {
    fontSize: 12,
    color: FC.textSecondary,
    marginBottom: 10,
    lineHeight: 17,
  },
});
