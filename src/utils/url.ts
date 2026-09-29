/**
 * MigrationMap - URL Parsing & Normalization Utilities
 * Safe, robust URL extraction and tokenization.
 */

import { NormalizedUrl, NormalizationConfig } from '../types/migration';

export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  lowercaseHostname: true,
  lowercasePath: true,
  trailingSlash: 'remove',
  stripProtocol: true,
  stripWww: true,
  stripFragments: true,
  stripQueryParameters: false,
  decodePercentEncoding: true,
  deduplicateUrls: true,
};

/**
 * Safely decodes a URI component without throwing on invalid percent sequences
 */
export function safeDecodeURI(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str.replace(/%([0-9a-fA-F]{2})/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return `%${hex}`;
      }
    });
  }
}

/**
 * Validates whether a raw string looks like a web URL or valid path
 */
export function isValidUrlString(input: string): { valid: boolean; reason?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, reason: 'Empty or non-string value' };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: 'Empty string or whitespace' };
  }

  // Filter out javascript:, mailto:, data:, tel:
  if (/^(javascript|mailto|data|tel|sms|ftp|file):/i.test(trimmed)) {
    return { valid: false, reason: 'Unsupported URL protocol (only http/https/relative paths supported)' };
  }

  // Filter out clearly invalid junk
  if (trimmed.startsWith('#') || trimmed.startsWith('//') && trimmed.length < 4) {
    return { valid: false, reason: 'Fragment-only or invalid protocol-relative path' };
  }

  // Check for spaces
  if (/\s/.test(trimmed)) {
    return { valid: false, reason: 'URL cannot contain whitespace' };
  }

  // Check if it has a protocol, starts with /, or looks like a domain (supporting internationalized domains)
  const isAbsolute = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed);
  const isRootRelative = trimmed.startsWith('/');
  const isDomainLike = /^[a-zA-Z0-9\u00A0-\uFFFF][a-zA-Z0-9\u00A0-\uFFFF-]*\.[a-zA-Z\u00A0-\uFFFF]{2,}(?:\/.*)?$/i.test(trimmed);

  if (!isAbsolute && !isRootRelative && !isDomainLike) {
    return { valid: false, reason: 'Must be an absolute URL (http/https), a relative path starting with /, or a domain' };
  }

  // Check if it parses as standard URL or relative path
  try {
    if (isAbsolute) {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol.toLowerCase())) {
        return { valid: false, reason: `Disallowed protocol: ${parsed.protocol}` };
      }
      if (!parsed.hostname || parsed.hostname.length === 0) {
        return { valid: false, reason: 'Missing hostname' };
      }
    } else if (isDomainLike) {
      new URL(`https://${trimmed}`);
    } else {
      // Relative path: must start with /
      new URL(`https://placeholder.internal${trimmed}`);
    }
    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: err?.message || 'Malformed URL structure' };
  }
}

/**
 * Tokenizes a string (slug or path) into word units, stripping punctuation
 */
export function tokenizePath(text: string): string[] {
  if (!text) return [];
  
  // Split on slashes, hyphens, underscores, dots, pluses, percent signs
  const parts = text
    .toLowerCase()
    .replace(/[._\-+/=]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(p => p.trim())
    .filter(p => p.length > 1 && !isStopWord(p));

  return Array.from(new Set(parts));
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'html', 'htm', 'php', 'aspx', 'jsp'
]);

function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word);
}

/**
 * Extracts file extension if present (.html, .php, .aspx, .pdf)
 */
export function extractExtension(pathname: string): string | undefined {
  const lastSegment = pathname.split('/').filter(Boolean).pop() || '';
  const match = lastSegment.match(/\.([a-zA-Z0-9]{2,5})$/);
  return match ? match[1].toLowerCase() : undefined;
}

/**
 * Normalizes a URL string using the specified normalization rules
 */
export function normalizeUrl(
  rawInput: string,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
  sourceLine?: number
): NormalizedUrl {
  const trimmed = rawInput.trim();
  let protocol = '';
  let hostname = '';
  let port = '';
  let pathname = '';
  let search = '';
  let hash = '';

  const isAbsolute = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed);

  try {
    if (isAbsolute) {
      const urlObj = new URL(trimmed);
      protocol = urlObj.protocol.toLowerCase();
      hostname = urlObj.hostname;
      port = urlObj.port ? `:${urlObj.port}` : '';
      pathname = urlObj.pathname;
      search = urlObj.search;
      hash = urlObj.hash;
    } else {
      const dummy = new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, 'https://migrationmap.local');
      pathname = dummy.pathname;
      search = dummy.search;
      hash = dummy.hash;
    }
  } catch {
    pathname = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // Percent decoding
  if (config.decodePercentEncoding) {
    pathname = safeDecodeURI(pathname);
    search = safeDecodeURI(search);
  }

  // Casing
  if (config.lowercaseHostname && hostname) {
    hostname = hostname.toLowerCase();
  }
  if (config.lowercasePath) {
    pathname = pathname.toLowerCase();
  }

  // Strip WWW
  const hasWww = hostname.startsWith('www.');
  if (config.stripWww && hasWww) {
    hostname = hostname.slice(4);
  }

  // Trailing slash handling
  const hadTrailingSlash = pathname.length > 1 && pathname.endsWith('/');
  if (config.trailingSlash === 'remove') {
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.replace(/\/+$/, '');
    }
  } else if (config.trailingSlash === 'enforce') {
    // Only add trailing slash if it doesn't look like a file with extension
    const hasExt = /\.[a-zA-Z0-9]{2,5}$/.test(pathname);
    if (!pathname.endsWith('/') && !hasExt) {
      pathname = `${pathname}/`;
    }
  }

  // Clean empty pathname
  if (!pathname) {
    pathname = '/';
  }

  // Fragments
  if (config.stripFragments) {
    hash = '';
  }

  // Query parameters
  if (config.stripQueryParameters) {
    search = '';
  }

  // Build the clean normalized representation
  let normalized = '';
  if (!config.stripProtocol && protocol) {
    normalized += `${protocol}//`;
  }
  if (hostname) {
    normalized += `${hostname}${port}`;
  }
  normalized += pathname;
  if (search) {
    normalized += search;
  }
  if (hash) {
    normalized += hash;
  }

  // Ensure leading slash if no host
  if (!hostname && !normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  // Extract path segments (ignoring empty)
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map(seg => safeDecodeURI(seg));

  // Extract slug: last segment without extension
  let rawSlug = segments.length > 0 ? segments[segments.length - 1] : '';
  const ext = extractExtension(rawSlug);
  if (ext) {
    rawSlug = rawSlug.replace(new RegExp(`\\.${ext}$`, 'i'), '');
  }
  const slug = rawSlug.toLowerCase();

  // Extract word tokens from path and query
  const tokens = tokenizePath(`${pathname} ${search}`);

  return {
    raw: trimmed,
    normalized,
    protocol,
    hostname,
    pathname,
    search,
    hash,
    slug,
    segments,
    tokens,
    depth: segments.length,
    hasTrailingSlash: hadTrailingSlash,
    hasWww,
    extension: ext,
    sourceLine,
  };
}

/**
 * Formats a clean relative or absolute path for redirect exports
 */
export function getCleanExportPath(url: NormalizedUrl, preserveDomain = false): string {
  if (preserveDomain && url.hostname) {
    const proto = url.protocol ? `${url.protocol}//` : 'https://';
    return `${proto}${url.hostname}${url.pathname}${url.search}`;
  }
  return `${url.pathname}${url.search}`;
}
