import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@features/auth/store/authStore';

/**
 * Food Saver API Client
 * Axios instance pre-configured with:
 * - Base URL from Expo Constants
 * - Laravel Sanctum Bearer Token injection
 * - 15s timeout
 * - JSON content type
 */

const API_BASE_URL = 'https://vqhffv4oxa.sharedwithexpose.com/api';// Replace with LAN IP for physical device / emulator
// const API_BASE_URL = 'http://192.168.x.x:8000/api'; // Replace with LAN IP for physical device

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request interceptor — injects Sanctum Bearer token from Zustand auth store.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — handles global 401 Unauthenticated errors.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — force logout
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

/**
 * Helper for multipart/form-data uploads (receipt image scanning).
 */
export async function uploadImage(endpoint: string, imageUri: string, extraFields?: Record<string, string>) {
  const token = useAuthStore.getState().token;

  const formData = new FormData();
  const filename = imageUri.split('/').pop() ?? 'receipt.jpg';
  const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

  formData.append('receipt_image', {
    uri: imageUri,
    name: filename,
    type: mimeType,
  } as any);

  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return axios.post(`${API_BASE_URL}${endpoint}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    timeout: 30000, // Longer timeout for OCR pipeline (NFR-02: ≤ 7s target)
  });
}
