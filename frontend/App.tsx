import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }       from 'react-native-safe-area-context';
import { AppNavigator }           from '@app/navigation/AppNavigator';
import { useOfflineQueueStore }   from '@features/inventory/store/offlineQueueStore';
import { useAuthStore }           from '@features/auth/store/authStore';
import { startConnectivityListener } from '@core/connectivity/netInfo';
import { onUnauthorized } from '@core/auth/tokenStorage';
import { Colors } from '@app/theme/theme';

// ─── Fridgy Splash Screen ──────────────────────────────────────────────────
function SplashScreen() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const dotsAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(dotsAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const dotOpacity = dotsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.splash}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={require('./assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Bottom Loading Indicator */}
      <Animated.View style={[styles.loadingArea, { opacity: fadeAnim }]}>
        <ActivityIndicator size="small" color="#3A9B68" />
        <Text style={styles.loadingText}>Memuat aplikasi...</Text>
      </Animated.View>
    </View>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const initDb    = useOfflineQueueStore((s) => s.initDb);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const isReady   = useAuthStore((s) => s.isReady);
  const token     = useAuthStore((s) => s.token);
  const syncPendingUploads = useOfflineQueueStore((s) => s.syncPendingUploads);

  useEffect(() => {
    // Register global 401 callback to logout automatically on session expiry
    onUnauthorized(() => {
      useAuthStore.getState().logout();
    });

    bootstrap();
    initDb();
    const unsubscribe = startConnectivityListener();
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (isReady && token) {
      syncPendingUploads();
    }
  }, [isReady, token]);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={Colors.background} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 280,
    height: 160,
  },
  loadingArea: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});
