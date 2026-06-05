import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@core/api/apiClient';

export interface User {
  id:                number;
  name:              string;
  email:             string;
  persona:           'minimalist' | 'professional' | 'chef';
  notification_time: string;
}

interface AuthState {
  user:    User | null;
  token:   string | null;
  isLoading: boolean;
  error:   string | null;

  // Actions
  register: (data: RegisterPayload) => Promise<void>;
  login:    (email: string, password: string, fcmToken?: string) => Promise<void>;
  logout:   () => void;
  updateProfile: (data: Partial<User & { fcm_token: string }>) => Promise<void>;
}

interface RegisterPayload {
  name:               string;
  email:              string;
  password:           string;
  password_confirmation: string;
  persona?:           User['persona'];
  notification_time?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:      null,
      token:     null,
      isLoading: false,
      error:     null,

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', data);
          const { user, token } = response.data.data;
          set({ user, token, isLoading: false });
        } catch (err: any) {
          const message = err.response?.data?.message ?? 'Registration failed.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      login: async (email, password, fcmToken) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/login', {
            email,
            password,
            ...(fcmToken ? { fcm_token: fcmToken } : {}),
          });
          const { user, token } = response.data.data;
          set({ user, token, isLoading: false });
        } catch (err: any) {
          const message = err.response?.data?.message ?? 'Login failed.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        // Fire-and-forget server-side revocation
        if (get().token) {
          apiClient.post('/auth/logout').catch(() => {});
        }
        set({ user: null, token: null, error: null });
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.put('/auth/profile', data);
          set({ user: response.data.data.user, isLoading: false });
        } catch (err: any) {
          const message = err.response?.data?.message ?? 'Profile update failed.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },
    }),
    {
      name: 'food-saver-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
