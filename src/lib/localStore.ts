/**
 * localStore.ts
 * ─────────────────────────────────────────────────────────────
 * Single source-of-truth for ALL localStorage operations.
 *
 * Features:
 *  • In-memory cache → reads never hit JSON.parse twice
 *  • Type-safe helpers  get<T> / set / remove / clear
 *  • StorageEvent listener → syncs across browser tabs
 *  • All keys centralised in KEYS enum → no magic strings scattered in code
 * ─────────────────────────────────────────────────────────────
 */

// ── 1. Centralised key names ──────────────────────────────────
export const KEYS = {
  PROFILE:          'dummy_profile',
  SLEEP_RECORDS:    'sleep_records_dummy-user-id',
  ANALYSIS_RESULTS: 'analysis_results_dummy-user-id',
  DRIVER_ALERT_HISTORY: 'DRIVER_ALERT_HISTORY',
  DRIVER_LAST_ALERT_TIME: 'DRIVER_LAST_ALERT_TIME',
  THEME:            'ls_theme',
  SEEDED:           'ls_seeded',
} as const;

type StoreKey = (typeof KEYS)[keyof typeof KEYS];

// ── 2. In-memory cache ────────────────────────────────────────
const memCache = new Map<string, unknown>();

// ── 3. Core helpers ───────────────────────────────────────────

/** Read a value. Returns from memory if available, else parses localStorage. */
export function lsGet<T>(key: StoreKey, fallback: T): T {
  if (memCache.has(key)) return memCache.get(key) as T;

  const raw = localStorage.getItem(key);
  if (raw === null) {
    memCache.set(key, fallback);
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as T;
    memCache.set(key, parsed);
    return parsed;
  } catch {
    memCache.set(key, fallback);
    return fallback;
  }
}

/** Write a value. Updates both memory cache and localStorage. */
export function lsSet<T>(key: StoreKey, value: T): void {
  memCache.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[localStore] Failed to persist:', key, e);
  }
}

/** Delete a key from both layers. */
export function lsRemove(key: StoreKey): void {
  memCache.delete(key);
  localStorage.removeItem(key);
}

/** Wipe ALL app keys (logout / reset). */
export function lsClearAll(): void {
  Object.values(KEYS).forEach((k) => {
    memCache.delete(k);
    localStorage.removeItem(k);
  });
}

// ── 4. Cross-tab sync ─────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && Object.values(KEYS).includes(e.key as StoreKey)) {
      // Invalidate memory cache so next read re-hydrates from localStorage
      memCache.delete(e.key as StoreKey);
    }
  });
}
