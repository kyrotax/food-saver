import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getToken, setToken, triggerUnauthorized } from '@core/auth/tokenStorage';

import Constants from 'expo-constants';

/**
 * Food Saver API Client
 * Axios instance pre-configured with:
 * - Base URL pointing to the Laravel backend
 * - Laravel Sanctum Bearer Token injection via tokenStorage (no circular dep)
 * - 15s timeout
 * - JSON content type
 */

// Use the dynamically configured IP from app.json (e.g. 192.168.1.4)
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://192.168.1.4:8000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request interceptor — injects Sanctum Bearer token from tokenStorage.
 * tokenStorage is populated by authStore after login / bootstrap.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — handles global 401 Unauthenticated errors.
 * Clears the in-memory token on session expiry.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear cached token and trigger subscriber to log out in authStore
      setToken(null);
      triggerUnauthorized();
    }
    return Promise.reject(error);
  }
);

/**
 * Helper for multipart/form-data uploads (receipt image scanning).
 */
export async function uploadImage(
  endpoint: string,
  imageUri: string,
  extraFields?: Record<string, string>
) {
  const token = getToken();

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
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    timeout: 30000, // Longer timeout for OCR pipeline
  });
}
