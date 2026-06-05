# Food Saver — Frontend Setup Guide
## React Native + Expo (TypeScript)

---

## Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for emulator) OR a physical Android/iOS device with Expo Go

---

## 1. Install Dependencies

```bash
cd app_build/frontend
npm install
```

---

## 2. Configure API Base URL

Edit `src/core/api/apiClient.ts`:

```typescript
// For Android emulator (maps to localhost on host machine):
const API_BASE_URL = 'http://10.0.2.2:8000/api';

// For physical device (replace with your PC's LAN IP):
const API_BASE_URL = 'http://192.168.x.x:8000/api';
```

Also update the `apiBaseUrl` in `app.json`:

```json
"extra": {
  "apiBaseUrl": "http://192.168.x.x:8000/api"
}
```

---

## 3. Run the Application

```bash
# Start Expo dev server
npx expo start

# Android (emulator or device)
npx expo start --android

# iOS (Mac only)
npx expo start --ios

# With Expo Go (physical device)
# Scan the QR code shown in the terminal
npx expo start
```

---

## 4. Project Structure

```
src/
├── app/
│   ├── navigation/AppNavigator.tsx   ← Route tree
│   └── theme/theme.ts                ← Design tokens
├── features/
│   ├── auth/                         ← Login, Register, authStore
│   ├── inventory/                    ← Dashboard, Scan, FridgeCheck
│   └── recipe/                       ← AI Recipe Generator
└── core/
    ├── api/apiClient.ts              ← Axios + Sanctum
    ├── connectivity/netInfo.ts       ← Auto-sync trigger
    └── localStorage/db.ts            ← SQLite offline queue
```

---

## 5. Key Libraries

| Library | Purpose |
|---------|---------|
| `expo-camera` + `expo-image-picker` | Receipt capture |
| `expo-sqlite` | Offline queue storage |
| `expo-notifications` | Push notification reception |
| `@react-native-community/netinfo` | Connectivity detection |
| `zustand` | State management |
| `axios` | HTTP client |
| `@react-navigation/stack` | Screen navigation |
