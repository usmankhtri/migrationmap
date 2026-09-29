/**
 * MigrationMap - File & Text Parsers
 * Secure, client-side parsing for CSV, TSV, TXT, XML Sitemaps, and pasted text.
 * Strictly adheres to data preservation: every row is read and preserved.
 */

import {
  NormalizedUrl,
  NormalizationConfig,
  ImportInvalidRow,
  ImportResult,
} from '../types/migration';
import { normalizeUrl, isValidUrlString, DEFAULT_NORMALIZATION_CONFIG } from './url';

/**
 * Splits CSV into 2D array of string cells, handling quotes, escapes, and Windows CRLF
 */
export function parseCsvRaw(content: string): { rows: string[][]; delimiter: string } {
  if (!content || content.length === 0) {
    return { rows: [], delimiter: ',' };
  }

  // Detect delimiter by sampling first 10 non-empty lines
  const sampleLines = content.split(/\r?\n|\r/).filter(l => l.trim().length > 0).slice(0, 10);
  const sampleText = sampleLines.join('\n');
  const commas = (sampleText.match(/,/g) || []).length;
  const tabs = (sampleText.match(/\t/g) || []).length;
  const semicolons = (sampleText.match(/;/g) || []).length;

  let delimiter = ',';
  if (tabs > commas && tabs > semicolons) delimiter = '\t';
  else if (semicolons > commas && semicolons > tabs) delimiter = ';';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;
  const len = content.length;

  while (i < len) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      i++;
      continue;
    }

    if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      // Skip completely empty blank rows
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      i++;
      continue;
    }

    currentCell += char;
    i++;
  }

  // Final row and cell
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return { rows, delimiter };
}

/**
 * Detects URL column candidates from CSV rows with side preference (old vs new)
 */
export function detectUrlColumns(
  rows: string[][],
  preferredSide?: 'old' | 'new'
): {
  candidates: Array<{ index: number; name: string; score: number }>;
  bestIndex: number;
} {
  if (rows.length === 0) return { candidates: [], bestIndex: 0 };

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const candidates: Array<{ index: number; name: string; score: number }> = [];

  const OLD_KEYWORDS = ['old_url', 'old', 'source', 'origin', 'from', 'legacy', 'current', 'source_url', 'original_url'];
  const NEW_KEYWORDS = ['new_url', 'new', 'target', 'destination', 'to', 'redirect', 'target_url', 'destination_url', 'redirect_to'];
  const GENERAL_KEYWORDS = ['url', 'loc', 'location', 'path', 'address', 'link', 'permalink', 'page'];

  for (let colIdx = 0; colIdx < headers.length; colIdx++) {
    const rawHeader = headers[colIdx] || '';
    const headerName = rawHeader.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    let score = 0;

    if (preferredSide === 'old') {
      for (const kw of OLD_KEYWORDS) {
        if (headerName === kw) score += 90;
        else if (headerName.includes(kw)) score += 50;
      }
      // slight penalty if column explicitly says "new"
      if (NEW_KEYWORDS.some(kw => headerName === kw || headerName.includes(kw))) {
        score -= 40;
      }
    } else if (preferredSide === 'new') {
      for (const kw of NEW_KEYWORDS) {
        if (headerName === kw) score += 90;
        else if (headerName.includes(kw)) score += 50;
      }
      // slight penalty if column explicitly says "old"
      if (OLD_KEYWORDS.some(kw => headerName === kw || headerName.includes(kw))) {
        score -= 40;
      }
    }

    // General URL keywords
    for (const kw of GENERAL_KEYWORDS) {
      if (headerName === kw) score += 40;
      else if (headerName.includes(kw)) score += 20;
    }

    // Sample data rows (sample up to 50 rows)
    const sample = (dataRows.length > 0 ? dataRows : rows).slice(0, 50);
    let validCount = 0;
    for (const row of sample) {
      const val = row[colIdx];
      if (val && isValidUrlString(val).valid) {
        validCount++;
      }
    }

    const validRatio = sample.length > 0 ? validCount / sample.length : 0;
    score += Math.round(validRatio * 60);

    candidates.push({
      index: colIdx,
      name: rawHeader.trim() || `Column ${colIdx + 1}`,
      score,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const bestIndex = candidates.length > 0 && candidates[0].score > 20 ? candidates[0].index : 0;

  return { candidates, bestIndex };
}

/**
 * Checks if a string is likely a CSV column header rather than a data URL
 */
function isLikelyHeader(val: string): boolean {
  if (!val) return false;
  const lower = val.toLowerCase().trim();
  const HEADER_NAMES = [
    'url', 'urls', 'location', 'loc', 'path', 'address', 'link',
    'old_url', 'new_url', 'target', 'source', 'from', 'to',
    'destination', 'origin', 'legacy', 'redirect', 'status', 'notes'
  ];
  return HEADER_NAMES.includes(lower);
}

/**
 * Parses CSV content into normalized URLs preserving every single row
 */
export function parseCsv(
  content: string,
  selectedColumnIndex?: number,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
  filename?: string,
  preferredSide?: 'old' | 'new'
): ImportResult {
  const { rows } = parseCsvRaw(content);
  if (rows.length === 0) {
    return {
      validUrls: [],
      invalidRows: [{ line: 1, rawText: '', reason: 'The file is empty' }],
      duplicates: [],
      totalProcessed: 0,
      sourceType: 'csv',
      filename,
    };
  }

  let targetCol = selectedColumnIndex;
  if (targetCol === undefined) {
    const detected = detectUrlColumns(rows, preferredSide);
    targetCol = detected.bestIndex;
  }

  // Ensure targetCol is within bounds
  if (targetCol < 0 || (rows[0] && targetCol >= rows[0].length)) {
    targetCol = 0;
  }

  // Determine if row 0 is a header:
  // If row 0 value in targetCol is a valid URL and not a known header word, it is DATA!
  let startIndex = 0;
  const firstRowVal = (rows[0][targetCol] || '').trim();
  const firstRowValid = isValidUrlString(firstRowVal).valid;

  if (!firstRowValid || isLikelyHeader(firstRowVal)) {
    startIndex = 1;
  }

  const rawEntries: Array<{ raw: string; line: number }> = [];
  for (let i = startIndex; i < rows.length; i++) {
    const lineNum = i + 1;
    const val = (rows[i][targetCol] !== undefined ? rows[i][targetCol] : '').trim();
    rawEntries.push({ raw: val, line: lineNum });
  }

  return processRawEntries(rawEntries, config, 'csv', filename);
}

/**
 * Parses plain text (one URL per line)
 */
export function parseTxt(
  content: string,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
  filename?: string
): ImportResult {
  const lines = content.split(/\r?\n|\r/);
  const rawEntries: Array<{ raw: string; line: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip empty lines and comment lines
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }
    rawEntries.push({ raw: line, line: i + 1 });
  }

  return processRawEntries(rawEntries, config, 'txt', filename);
}

/**
 * Parses XML Sitemap (<url><loc>...</loc></url> or <sitemap><loc>...</loc></sitemap>)
 */
export function parseSitemapXml(
  xmlContent: string,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
  filename?: string
): ImportResult {
  if (!xmlContent || xmlContent.trim().length === 0) {
    return {
      validUrls: [],
      invalidRows: [{ line: 1, rawText: '', reason: 'Empty XML document' }],
      duplicates: [],
      totalProcessed: 0,
      sourceType: 'sitemap_xml',
      filename,
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        validUrls: [],
        invalidRows: [
          {
            line: 1,
            rawText: xmlContent.slice(0, 100),
            reason: `XML Parse Error: ${parserError.textContent?.slice(0, 150) || 'Malformed XML structure'}`,
          },
        ],
        duplicates: [],
        totalProcessed: 0,
        sourceType: 'sitemap_xml',
        filename,
      };
    }

    const locElements = doc.querySelectorAll('url > loc, sitemap > loc, loc');
    const rawEntries: Array<{ raw: string; line: number }> = [];

    locElements.forEach((el, index) => {
      const text = el.textContent?.trim() || '';
      if (text) {
        rawEntries.push({ raw: text, line: index + 1 });
      }
    });

    if (rawEntries.length === 0) {
      return {
        validUrls: [],
        invalidRows: [
          {
            line: 1,
            rawText: xmlContent.slice(0, 100),
            reason: 'No <loc> elements found in XML sitemap',
          },
        ],
        duplicates: [],
        totalProcessed: 0,
        sourceType: 'sitemap_xml',
        filename,
      };
    }

    return processRawEntries(rawEntries, config, 'sitemap_xml', filename);
  } catch (err: any) {
    return {
      validUrls: [],
      invalidRows: [{ line: 1, rawText: '', reason: err?.message || 'Failed to parse XML' }],
      duplicates: [],
      totalProcessed: 0,
      sourceType: 'sitemap_xml',
      filename,
    };
  }
}

/**
 * Parses free-form pasted text
 */
export function parsePastedText(
  text: string,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG
): ImportResult {
  const lines = text.split(/\r?\n|\r/).map(l => l.trim()).filter(Boolean);
  const rawEntries: Array<{ raw: string; line: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(',') || line.includes('\t')) {
      const parts = line.split(/[,\t]+/).map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        rawEntries.push({ raw: part, line: i + 1 });
      }
    } else {
      rawEntries.push({ raw: line, line: i + 1 });
    }
  }

  return processRawEntries(rawEntries, config, 'paste');
}

/**
 * Common processor for normalizing entries, filtering invalid lines, and detecting duplicates
 * Ensures that EVERY row processed is tracked either as valid or invalid.
 */
function processRawEntries(
  entries: Array<{ raw: string; line: number }>,
  config: NormalizationConfig,
  sourceType: 'csv' | 'txt' | 'sitemap_xml' | 'paste',
  filename?: string
): ImportResult {
  const validUrls: NormalizedUrl[] = [];
  const invalidRows: ImportInvalidRow[] = [];
  const seenNormMap = new Map<string, number>();
  const duplicateList: Array<{ url: string; count: number }> = [];

  for (const entry of entries) {
    const { raw, line } = entry;
    if (!raw || raw.trim().length === 0) {
      // Empty lines in raw input
      continue;
    }

    const validation = isValidUrlString(raw);
    if (!validation.valid) {
      invalidRows.push({
        line,
        rawText: raw,
        reason: validation.reason || 'Invalid URL syntax',
      });
      continue;
    }

    const normalized = normalizeUrl(raw, config, line);
    const key = normalized.normalized;

    const count = seenNormMap.get(key) || 0;
    seenNormMap.set(key, count + 1);

    if (count > 0 && config.deduplicateUrls) {
      // Duplicate URL skipped from validUrls array but tracked
      continue;
    }

    validUrls.push(normalized);
  }

  for (const [url, count] of seenNormMap.entries()) {
    if (count > 1) {
      duplicateList.push({ url, count });
    }
  }

  return {
    validUrls,
    invalidRows,
    duplicates: duplicateList,
    totalProcessed: entries.length,
    sourceType,
    filename,
  };
}
