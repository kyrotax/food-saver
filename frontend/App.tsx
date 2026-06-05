import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }       from 'react-native-safe-area-context';
import { AppNavigator }           from '@app/navigation/AppNavigator';
import { useOfflineQueueStore }   from '@features/inventory/store/offlineQueueStore';
import { startConnectivityListener } from '@core/connectivity/netInfo';
import { Colors } from '@app/theme/theme';

export default function App() {
  const initDb = useOfflineQueueStore((s) => s.initDb);

  useEffect(() => {
    // Initialize local SQLite DB for offline queue
    initDb();

    // Start connectivity listener for auto-sync
    const unsubscribe = startConnectivityListener();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
