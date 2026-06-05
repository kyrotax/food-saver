import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useOfflineQueueStore } from '@features/inventory/store/offlineQueueStore';

let isListenerRegistered = false;

/**
 * Start listening to network state changes.
 * When the device comes online, automatically triggers offline queue sync.
 * Call this once in App.tsx.
 */
export function startConnectivityListener(): () => void {
  if (isListenerRegistered) {
    return () => {};
  }

  isListenerRegistered = true;

  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isOnline = state.isConnected && state.isInternetReachable;
    if (isOnline) {
      console.log('[NetInfo] Online — syncing offline queue...');
      useOfflineQueueStore.getState().syncPendingUploads();
    }
  });

  return () => {
    isListenerRegistered = false;
    unsubscribe();
  };
}

/**
 * One-shot check for current connectivity.
 */
export async function isConnected(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable);
}
