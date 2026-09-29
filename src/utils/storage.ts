/**
 * MigrationMap - High-Capacity Persistent Local Storage Engine
 * 
 * Uses browser IndexedDB as the primary storage mechanism to support
 * large-scale URL migrations (50,000+ URLs and mappings) without size
 * limits, cookie truncation, or server-side transmission.
 * 
 * Automatically falls back to LocalStorage and chunked Cookies if IndexedDB
 * is restricted in private browsing modes.
 */

import { StoredProjectState, saveProjectToCookies, loadProjectFromCookies, clearProjectCookies } from './cookieStorage';

const DB_NAME = 'migrationmap_db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const RECORD_KEY = 'active_project';
const LOCALSTORAGE_KEY = 'mm_project_backup';

function getIndexedDB(): IDBFactory | null {
  if (typeof window === 'undefined') return null;
  return window.indexedDB || (window as any).mozIndexedDB || (window as any).webkitIndexedDB || (window as any).msIndexedDB || null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const idb = getIndexedDB();
    if (!idb) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Saves project state to IndexedDB with fallback to localStorage and cookies.
 * Capable of storing 50,000+ URLs and mappings without size warnings.
 */
export async function saveProject(state: StoredProjectState): Promise<{
  success: boolean;
  storageType: 'indexeddb' | 'localstorage' | 'cookies';
  error?: string;
}> {
  // 1. Primary: Try IndexedDB (handles 50,000+ URLs easily)
  try {
    const idb = getIndexedDB();
    if (idb) {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(state, RECORD_KEY);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error || new Error('IndexedDB put failed'));
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
      });

      // Clear any legacy cookie chunks to prevent stale conflicts
      clearProjectCookies();

      return { success: true, storageType: 'indexeddb' };
    }
  } catch (idbErr) {
    console.warn('IndexedDB save failed, falling back to localStorage/cookies:', idbErr);
  }

  // 2. Secondary fallback: LocalStorage (typically ~5MB-10MB quota)
  try {
    if (typeof localStorage !== 'undefined') {
      const serialized = JSON.stringify(state);
      localStorage.setItem(LOCALSTORAGE_KEY, serialized);
      clearProjectCookies();
      return { success: true, storageType: 'localstorage' };
    }
  } catch (lsErr) {
    console.warn('LocalStorage save failed, falling back to cookies:', lsErr);
  }

  // 3. Final fallback: Compact chunked cookies
  const cookieResult = saveProjectToCookies(state);
  return {
    success: cookieResult.success,
    storageType: 'cookies',
    error: cookieResult.error,
  };
}

/**
 * Loads project state, checking IndexedDB first, then LocalStorage, then legacy Cookies.
 */
export async function loadProject(): Promise<{
  data: StoredProjectState | null;
  storageType?: 'indexeddb' | 'localstorage' | 'cookies';
  corrupted?: boolean;
}> {
  // 1. Try IndexedDB
  try {
    const idb = getIndexedDB();
    if (idb) {
      const db = await openDatabase();
      const record = await new Promise<StoredProjectState | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(RECORD_KEY);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error || new Error('IndexedDB get failed'));
      });

      if (record && record.oldUrls && record.oldUrls.length > 0) {
        return { data: record, storageType: 'indexeddb' };
      }
    }
  } catch (idbErr) {
    console.warn('IndexedDB load encountered an issue:', idbErr);
  }

  // 2. Try LocalStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const lsRaw = localStorage.getItem(LOCALSTORAGE_KEY);
      if (lsRaw) {
        const parsed = JSON.parse(lsRaw);
        if (parsed && Array.isArray(parsed.oldUrls) && parsed.oldUrls.length > 0) {
          return { data: parsed as StoredProjectState, storageType: 'localstorage' };
        }
      }
    }
  } catch (lsErr) {
    console.warn('LocalStorage load failed:', lsErr);
  }

  // 3. Try Cookies (migration from previous version)
  const cookieData = loadProjectFromCookies();
  if (cookieData.data && cookieData.data.oldUrls && cookieData.data.oldUrls.length > 0) {
    // Automatically migrate cookie data into IndexedDB for higher capacity!
    saveProject(cookieData.data).catch(() => {});
    return { data: cookieData.data, storageType: 'cookies' };
  }

  return { data: null, corrupted: cookieData.corrupted };
}

/**
 * Clears all stored project state across IndexedDB, LocalStorage, and Cookies.
 */
export async function clearProject(): Promise<void> {
  // 1. Clear IndexedDB
  try {
    const idb = getIndexedDB();
    if (idb) {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(RECORD_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  } catch (err) {
    console.warn('Failed to clear IndexedDB:', err);
  }

  // 2. Clear LocalStorage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  } catch {}

  // 3. Clear Cookies
  clearProjectCookies();
}
