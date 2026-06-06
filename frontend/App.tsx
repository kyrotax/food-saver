import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }       from 'react-native-safe-area-context';
import { AppNavigator }           from '@app/navigation/AppNavigator';
import { useOfflineQueueStore }   from '@features/inventory/store/offlineQueueStore';
import { useAuthStore }           from '@features/auth/store/authStore';
import { startConnectivityListener } from '@core/connectivity/netInfo';
import { Colors } from '@app/theme/theme';

export default function App() {
  const initDb = useOfflineQueueStore((s) => s.initDb);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const isReady = useAuthStore((s) => s.isReady);

  useEffect(() => {
    // Bootstrap secure token store
    bootstrap();

    // Initialize local SQLite DB for offline queue
    initDb();

    // Start connectivity listener for auto-sync
    const unsubscribe = startConnectivityListener();

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3A9B68" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
