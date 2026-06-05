import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import { uploadImage } from '@core/api/apiClient';

/**
 * Offline Queue Store
 * Manages receipt image uploads queued while the device is offline.
 * Uses expo-sqlite as local persistent storage (max 5 images per NFR-08).
 */

const MAX_QUEUE_SIZE = 5;
const DB_NAME = 'food_saver_queue.db';

export interface QueuedImage {
  id:         number;
  imageUri:   string;
  queuedAt:   string;
  status:     'pending' | 'uploading' | 'failed';
}

interface OfflineQueueState {
  queue:     QueuedImage[];
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  initDb:             () => Promise<void>;
  enqueue:            (imageUri: string) => Promise<void>;
  syncPendingUploads: () => Promise<void>;
  clearCompleted:     () => Promise<void>;
}

let db: SQLite.SQLiteDatabase | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        imageUri TEXT NOT NULL,
        queuedAt TEXT NOT NULL,
        status   TEXT NOT NULL DEFAULT 'pending'
      );
    `);
  }
  return db;
};

export const useOfflineQueueStore = create<OfflineQueueState>()((set, get) => ({
  queue:     [],
  isLoading: false,
  isSyncing: false,

  initDb: async () => {
    set({ isLoading: true });
    try {
      const database = await getDb();
      const rows = await database.getAllAsync<QueuedImage>(
        `SELECT * FROM offline_queue WHERE status != 'uploaded' ORDER BY queuedAt ASC`
      );
      set({ queue: rows, isLoading: false });
    } catch (e) {
      console.error('OfflineQueue initDb error:', e);
      set({ isLoading: false });
    }
  },

  enqueue: async (imageUri) => {
    const currentQueue = get().queue.filter((q) => q.status === 'pending');

    if (currentQueue.length >= MAX_QUEUE_SIZE) {
      throw new Error(`Offline queue is full (max ${MAX_QUEUE_SIZE} images). Please connect to the internet to sync.`);
    }

    const database = await getDb();
    const result = await database.runAsync(
      `INSERT INTO offline_queue (imageUri, queuedAt, status) VALUES (?, ?, 'pending')`,
      [imageUri, new Date().toISOString()]
    );

    const newItem: QueuedImage = {
      id:       result.lastInsertRowId,
      imageUri,
      queuedAt: new Date().toISOString(),
      status:   'pending',
    };

    set((s) => ({ queue: [...s.queue, newItem] }));
  },

  syncPendingUploads: async () => {
    if (get().isSyncing) return;

    const pending = get().queue.filter((q) => q.status === 'pending');
    if (pending.length === 0) return;

    set({ isSyncing: true });
    const database = await getDb();

    for (const item of pending) {
      try {
        await uploadImage('/inventory/scan', item.imageUri);

        await database.runAsync(
          `UPDATE offline_queue SET status = 'uploaded' WHERE id = ?`,
          [item.id]
        );

        set((s) => ({
          queue: s.queue.filter((q) => q.id !== item.id),
        }));
      } catch (e) {
        await database.runAsync(
          `UPDATE offline_queue SET status = 'failed' WHERE id = ?`,
          [item.id]
        );
        set((s) => ({
          queue: s.queue.map((q) => q.id === item.id ? { ...q, status: 'failed' as const } : q),
        }));
      }
    }

    set({ isSyncing: false });
  },

  clearCompleted: async () => {
    const database = await getDb();
    await database.runAsync(`DELETE FROM offline_queue WHERE status = 'uploaded'`);
    set((s) => ({ queue: s.queue.filter((q) => q.status !== 'uploaded' as any) }));
  },
}));
