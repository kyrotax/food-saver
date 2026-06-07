import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInventoryStore, FoodItem, DraftFoodItem } from '@features/inventory/store/inventoryStore';

const C = {
  bg: '#FFFFFF',
  surface: '#F8FAF8',
  primary: '#3A9B68',
  border: '#E7EDE7',
  textPrimary: '#1F2A24',
  textSecondary: '#6F7D73',
  white: '#FFFFFF',
  danger: '#E75D5D'
};

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  item?: FoodItem | null;
}

export const AddEditItemModal: React.FC<Props> = ({ visible, onClose, mode, item }) => {
  const { addManualItem, updateItem } = useInventoryStore();
  
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [storage, setStorage] = useState<'freezer'|'chiller'|'room_temp'>('room_temp');
  const [expiration, setExpiration] = useState(''); // YYYY-MM-DD
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && item) {
        setName(item.product_name);
        setQuantity(item.quantity.toString());
        setUnit(item.unit);
        setStorage(item.storage_location);
        setExpiration(item.expiration_date);
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
  }, [visible, mode, item]);

  const setDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiration(d.toISOString().split('T')[0]);
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
      if (mode === 'edit' && item) {
        await updateItem(item.id, {
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
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{mode === 'add' ? 'Add Ingredient' : 'Edit Ingredient'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={24} color={C.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { marginTop: 0 }]}>Name</Text>
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={setName} 
              placeholder="e.g. Tomatoes" 
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput 
                  style={styles.input} 
                  value={quantity} 
                  onChangeText={setQuantity} 
                  keyboardType="numeric" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Unit</Text>
                <TextInput 
                  style={styles.input} 
                  value={unit} 
                  onChangeText={setUnit} 
                  placeholder="pcs, kg, L..." 
                />
              </View>
            </View>

            <Text style={styles.label}>Storage Location</Text>
            <Text style={styles.storageHint}>Choose where you store it so Fridgy can estimate freshness better.</Text>
            <View style={styles.tabsRow}>
              {(['room_temp', 'chiller', 'freezer'] as const).map(loc => {
                const locLabel = loc === 'room_temp' ? 'Room Temp' : loc === 'chiller' ? 'Chiller' : 'Freezer';
                return (
                  <TouchableOpacity 
                    key={loc}
                    style={[styles.tab, storage === loc && styles.tabActive]}
                    onPress={() => setStorage(loc)}
                  >
                    <Text style={[styles.tabText, storage === loc && styles.tabTextActive]}>
                      {locLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Expiration Date</Text>
            <TextInput 
              style={styles.input} 
              value={expiration} 
              onChangeText={setExpiration} 
              placeholder="YYYY-MM-DD" 
            />
            <View style={styles.quickDates}>
              {[3, 7, 14, 30].map(days => (
                <TouchableOpacity key={days} style={styles.quickDateBtn} onPress={() => setDays(days)}>
                  <Text style={styles.quickDateText}>+{days}d</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  storageHint: {
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 10,
    lineHeight: 17,
  },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    color: C.textPrimary,
  },
  row: {
    flexDirection: 'row',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  tabActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSecondary,
  },
  tabTextActive: {
    color: C.white,
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
    borderRadius: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickDateText: {
    fontSize: 13,
    color: C.textPrimary,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  saveBtn: {
    backgroundColor: C.primary,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
