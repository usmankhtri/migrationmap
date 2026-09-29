/**
 * MigrationMap - Cookie-Based Local Persistence
 * High-efficiency, chunked cookie storage engine.
 * Safely persists URL datasets, mappings, and project state locally
 * without leaking or truncating user data.
 */

import {
  NormalizationConfig,
  ConfidenceThresholds,
  ImportInvalidRow,
  MappingStatus,
} from '../types/migration';

export interface StoredProjectState {
  version: 1;
  savedAt: number;
  oldUrls: string[];
  newUrls: string[];
  mappings: Array<{
    id: string;
    oldUrl: string;
    newUrl: string | null;
    confidence: number;
    status: MappingStatus;
    manuallyEdited?: boolean;
    reason?: string;
    summaryPoints?: string[];
  }>;
  normalizationConfig: NormalizationConfig;
  thresholds: ConfidenceThresholds;
  oldInvalidRows: ImportInvalidRow[];
  newInvalidRows: ImportInvalidRow[];
  hasStarted: boolean;
}

// Compact wire format to maximize capacity in browser cookies
interface CompactWireFormat {
  v: 2;
  ts: number;
  o: string[];
  n: string[];
  m: Array<{
    o: string;
    n: string | null;
    c: number;
    s: 's' | 'a' | 'n' | 'r' | 'm' | 'u';
    e?: 1;
  }>;
  cfg?: NormalizationConfig;
  th?: ConfidenceThresholds;
  oir?: ImportInvalidRow[];
  nir?: ImportInvalidRow[];
  st?: 1;
}

const COOKIE_PREFIX = 'mm_data_';
const COOKIE_COUNT_KEY = 'mm_chunks';
const MAX_CHUNK_SIZE = 3600; // Safe byte threshold below 4096 browser cookie limit
const MAX_TOTAL_CHUNKS = 8;  // Up to ~28.8KB total cookie footprint
const MAX_SAFE_TOTAL_SIZE = MAX_CHUNK_SIZE * MAX_TOTAL_CHUNKS;

const STATUS_CODE_TO_CHAR: Record<MappingStatus, 's' | 'a' | 'n' | 'r' | 'm' | 'u'> = {
  suggested: 's',
  approved: 'a',
  needs_review: 'n',
  rejected: 'r',
  manually_mapped: 'm',
  unmapped: 'u',
};

const CHAR_TO_STATUS_CODE: Record<string, MappingStatus> = {
  s: 'suggested',
  a: 'approved',
  n: 'needs_review',
  r: 'rejected',
  m: 'manually_mapped',
  u: 'unmapped',
};

/**
 * Gets a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Sets a cookie with standard attributes
 */
export function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return;
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Lax`;
}

/**
 * Deletes a cookie by name
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Clears all project cookie chunks
 */
export function clearProjectCookies(): void {
  if (typeof document === 'undefined') return;
  const countStr = getCookie(COOKIE_COUNT_KEY);
  const count = countStr ? parseInt(countStr, 10) : 10;
  for (let i = 0; i < Math.max(count, 12); i++) {
    deleteCookie(`${COOKIE_PREFIX}${i}`);
  }
  deleteCookie(COOKIE_COUNT_KEY);
}

/**
 * Saves project state into chunked cookies using compact representation
 */
export function saveProjectToCookies(state: StoredProjectState): {
  success: boolean;
  error?: 'oversized' | 'write_failed';
  totalBytes?: number;
} {
  if (typeof document === 'undefined') {
    return { success: false, error: 'write_failed' };
  }

  try {
    // Convert to compact wire format
    const compact: CompactWireFormat = {
      v: 2,
      ts: state.savedAt || Date.now(),
      o: state.oldUrls,
      n: state.newUrls,
      m: state.mappings.map(m => ({
        o: m.oldUrl,
        n: m.newUrl,
        c: m.confidence,
        s: STATUS_CODE_TO_CHAR[m.status] || 's',
        e: m.manuallyEdited ? 1 : undefined,
      })),
      cfg: state.normalizationConfig,
      th: state.thresholds,
      oir: state.oldInvalidRows.slice(0, 50),
      nir: state.newInvalidRows.slice(0, 50),
      st: state.hasStarted ? 1 : undefined,
    };

    const jsonStr = JSON.stringify(compact);
    const encoded = encodeURIComponent(jsonStr);

    if (encoded.length > MAX_SAFE_TOTAL_SIZE) {
      // Oversized dataset for safe cookie storage
      return {
        success: false,
        error: 'oversized',
        totalBytes: encoded.length,
      };
    }

    // Split into chunks
    const chunks: string[] = [];
    for (let i = 0; i < encoded.length; i += MAX_CHUNK_SIZE) {
      chunks.push(encoded.slice(i, i + MAX_CHUNK_SIZE));
    }

    if (chunks.length > MAX_TOTAL_CHUNKS) {
      return {
        success: false,
        error: 'oversized',
        totalBytes: encoded.length,
      };
    }

    // Clear previous surplus chunks
    const prevCountStr = getCookie(COOKIE_COUNT_KEY);
    const prevCount = prevCountStr ? parseInt(prevCountStr, 10) : 0;
    for (let i = chunks.length; i < Math.max(prevCount, 12); i++) {
      deleteCookie(`${COOKIE_PREFIX}${i}`);
    }

    // Write current chunks
    for (let i = 0; i < chunks.length; i++) {
      setCookie(`${COOKIE_PREFIX}${i}`, chunks[i], 30);
    }
    setCookie(COOKIE_COUNT_KEY, chunks.length.toString(), 30);

    return { success: true, totalBytes: encoded.length };
  } catch (err) {
    console.error('Failed to serialize project state to cookies:', err);
    return { success: false, error: 'write_failed' };
  }
}

/**
 * Loads and validates project state from chunked cookies
 */
export function loadProjectFromCookies(): {
  data: StoredProjectState | null;
  corrupted?: boolean;
} {
  if (typeof document === 'undefined') {
    return { data: null };
  }

  const countStr = getCookie(COOKIE_COUNT_KEY);
  if (!countStr) {
    return { data: null };
  }

  const count = parseInt(countStr, 10);
  if (isNaN(count) || count <= 0) {
    return { data: null };
  }

  let fullEncoded = '';
  for (let i = 0; i < count; i++) {
    const chunk = getCookie(`${COOKIE_PREFIX}${i}`);
    if (chunk === null) {
      // Incomplete or corrupted chunk sequence
      clearProjectCookies();
      return { data: null, corrupted: true };
    }
    fullEncoded += chunk;
  }

  try {
    const jsonStr = decodeURIComponent(fullEncoded);
    const parsed = JSON.parse(jsonStr);

    if (!parsed || typeof parsed !== 'object') {
      clearProjectCookies();
      return { data: null, corrupted: true };
    }

    // Handle v2 compact format
    if (parsed.v === 2 && Array.isArray(parsed.o)) {
      const mappings: StoredProjectState['mappings'] = (parsed.m || []).map((m: any, idx: number) => ({
        id: `map-${idx}`,
        oldUrl: m.o,
        newUrl: m.n || null,
        confidence: typeof m.c === 'number' ? m.c : 0,
        status: CHAR_TO_STATUS_CODE[m.s] || 'suggested',
        manuallyEdited: m.e === 1,
      }));

      const state: StoredProjectState = {
        version: 1,
        savedAt: parsed.ts || Date.now(),
        oldUrls: parsed.o,
        newUrls: parsed.n || [],
        mappings,
        normalizationConfig: parsed.cfg,
        thresholds: parsed.th,
        oldInvalidRows: parsed.oir || [],
        newInvalidRows: parsed.nir || [],
        hasStarted: parsed.st === 1 || parsed.o.length > 0,
      };

      return { data: state };
    }

    // Handle legacy v1 format
    if (parsed.version === 1 && Array.isArray(parsed.oldUrls)) {
      return { data: parsed as StoredProjectState };
    }

    clearProjectCookies();
    return { data: null, corrupted: true };
  } catch (err) {
    console.warn('Corrupted MigrationMap cookie data detected. Discarding:', err);
    clearProjectCookies();
    return { data: null, corrupted: true };
  }
}
