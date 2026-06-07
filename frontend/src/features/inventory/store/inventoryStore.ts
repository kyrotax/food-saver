import { create } from 'zustand';
import { apiClient, uploadImage } from '@core/api/apiClient';

export interface FoodItem {
  id:               number;
  user_id:          number;
  product_name:     string;
  quantity:         number;
  original_quantity: number;
  unit:             string;
  storage_location: 'freezer' | 'chiller' | 'room_temp';
  expiration_date:  string;
  urgency_status:   'green' | 'yellow' | 'red';
  is_scalable:      boolean;
  created_at:       string;
  updated_at:       string;
}

export interface DraftFoodItem {
  product_name:     string;
  quantity:         number;
  unit:             string;
  storage_location: 'freezer' | 'chiller' | 'room_temp';
  expiration_date:  string;
  is_scalable:      boolean;
  shelf_life?: {
    freezer: number;
    chiller: number;
    room_temp: number;
  };
}

interface InventoryState {
  items:        FoodItem[];
  isLoading:    boolean;
  isScanLoading: boolean;
  error:        string | null;
  lastUpdated:  Date | null;

  // Actions
  fetchInventory: () => Promise<void>;
  fetchFridgeCheck: () => Promise<FoodItem[]>;
  scanReceipt:    (imageUri: string) => Promise<DraftFoodItem[]>;
  addItems:       (items: DraftFoodItem[]) => Promise<void>;
  addManualItem:  (item: DraftFoodItem) => Promise<void>;
  updateSlider:   (id: number, state: '100' | '50' | '25' | '0') => Promise<void>;
  updateItem:     (id: number, data: Partial<FoodItem>) => Promise<void>;
  deleteItem:     (id: number) => Promise<void>;
  clearError:     () => void;
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  items:        [],
  isLoading:    false,
  isScanLoading: false,
  error:        null,
  lastUpdated:  null,

  fetchInventory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/inventory');
      set({
        items:       response.data.data,
        isLoading:   false,
        lastUpdated: new Date(),
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to load inventory.', isLoading: false });
    }
  },

  fetchFridgeCheck: async () => {
    const response = await apiClient.get('/inventory/check');
    return response.data.data as FoodItem[];
  },

  scanReceipt: async (imageUri) => {
    set({ isScanLoading: true, error: null });
    try {
      const response = await uploadImage('/inventory/scan', imageUri);
      set({ isScanLoading: false });
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Receipt scan failed. Please try again.';
      set({
        error: message,
        isScanLoading: false,
      });
      throw new Error(message);
    }
  },

  addItems: async (items) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/inventory', { items });
      set({ isLoading: false });
      await get().fetchInventory();
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to add items to your kitchen.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  addManualItem: async (item) => {
    await get().addItems([item]);
  },

  updateSlider: async (id, state) => {
    try {
      const response = await apiClient.put(`/inventory/${id}/slider`, { state });
      if (state === '0') {
        // Item consumed — remove from local state
        set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
      } else {
        // Update quantity in local state immediately (optimistic)
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id ? { ...item, ...response.data.data } : item
          ),
        }));
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to update quantity.' });
      throw err;
    }
  },

  updateItem: async (id, data) => {
    try {
      const response = await apiClient.put(`/inventory/${id}`, data);
      set((s) => ({
        items: s.items.map((item) =>
          item.id === id ? { ...item, ...response.data.data } : item
        ),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to update item.' });
      throw err;
    }
  },

  deleteItem: async (id) => {
    try {
      await apiClient.delete(`/inventory/${id}`);
      set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to delete item.' });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
