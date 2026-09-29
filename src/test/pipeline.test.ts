/**
 * MigrationMap - Internal Development Pipeline Test
 * 
 * Verifies the entire Import → Parse → Normalize → Match → Store → Refresh → Export pipeline.
 * Tests:
 * - At least 20 URLs through the complete pipeline
 * - All URLs parsed and normalized
 * - All old URLs receive a mapping result or Unmapped status
 * - No records disappear
 * - Export count matches application count
 * - Duplicate URLs
 * - Blank rows
 * - Invalid URLs
 * - CSV with headers
 * - CSV without headers
 * - Windows CRLF line endings
 * - Comma-separated CSV
 * - One-column CSV
 * - Multiple-column CSV
 */

import { parseCsv, parseCsvRaw, detectUrlColumns } from '../utils/parsers';
import { normalizeUrl, DEFAULT_NORMALIZATION_CONFIG } from '../utils/url';
import { matchUrlsBatch } from '../engine/matcher';
import {
  exportToCsv,
  exportToJson,
  exportToMarkdown,
  exportToNextJs,
  exportToVercel,
  exportToNetlify,
  exportToApache,
  exportToNginx,
  escapeCsv,
} from '../engine/exporters';
import { validateMigration } from '../engine/validator';
import { saveProjectToCookies, loadProjectFromCookies, clearProjectCookies, StoredProjectState } from '../utils/cookieStorage';

export async function runPipelineTests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      results.push(`PASS: ${testName}`);
    } else {
      allPassed = false;
      results.push(`FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      console.error(`TEST FAILED: ${testName}`, detail);
    }
  }

  // --- TEST 1: CSV with headers, Windows CRLF, and >20 URLs ---
  const oldUrls25 = [
    'https://example.com/',
    'https://example.com/about-us',
    'https://example.com/contact',
    'https://example.com/team',
    'https://example.com/careers',
    'https://example.com/services',
    'https://example.com/services/web-development',
    'https://example.com/services/mobile-apps',
    'https://example.com/services/seo-optimization',
    'https://example.com/services/cloud-consulting',
    'https://example.com/blog',
    'https://example.com/blog/2023/how-to-migrate',
    'https://example.com/blog/2023/seo-best-practices',
    'https://example.com/blog/2023/react-performance',
    'https://example.com/blog/2023/nextjs-routing',
    'https://example.com/products/item-101',
    'https://example.com/products/item-102',
    'https://example.com/products/item-103',
    'https://example.com/products/item-104',
    'https://example.com/products/item-105',
    'https://example.com/pricing',
    'https://example.com/faq',
    'https://example.com/terms',
    'https://example.com/privacy-policy',
    'https://example.com/legacy-page-no-match',
  ];

  const newUrls25 = [
    'https://new-site.com/',
    'https://new-site.com/company/about',
    'https://new-site.com/company/contact',
    'https://new-site.com/company/team',
    'https://new-site.com/company/careers',
    'https://new-site.com/solutions',
    'https://new-site.com/solutions/web-development',
    'https://new-site.com/solutions/mobile-apps',
    'https://new-site.com/solutions/search-optimization',
    'https://new-site.com/solutions/cloud-advisory',
    'https://new-site.com/articles',
    'https://new-site.com/articles/how-to-migrate-website',
    'https://new-site.com/articles/seo-best-practices-guide',
    'https://new-site.com/articles/react-performance-tips',
    'https://new-site.com/articles/nextjs-routing-guide',
    'https://new-site.com/store/item-101',
    'https://new-site.com/store/item-102',
    'https://new-site.com/store/item-103',
    'https://new-site.com/store/item-104',
    'https://new-site.com/store/item-105',
    'https://new-site.com/plans',
    'https://new-site.com/help/faq',
    'https://new-site.com/legal/terms',
    'https://new-site.com/legal/privacy',
  ];

  // 1. CRLF line endings + headers
  const csvOldContent = 'url,notes\r\n' + oldUrls25.map((u, i) => `${u},note-${i + 1}`).join('\r\n') + '\r\n';
  const csvNewContent = 'url,status\r\n' + newUrls25.map(u => `${u},active`).join('\r\n') + '\r\n';

  const oldParsed = parseCsv(csvOldContent, 0, DEFAULT_NORMALIZATION_CONFIG, 'old.csv', 'old');
  const newParsed = parseCsv(csvNewContent, 0, DEFAULT_NORMALIZATION_CONFIG, 'new.csv', 'new');

  assert(oldParsed.validUrls.length === 25, 'Parse Old CSV (>20 URLs with CRLF & headers)', `Expected 25, got ${oldParsed.validUrls.length}`);
  assert(newParsed.validUrls.length === 24, 'Parse New CSV (>20 URLs with CRLF & headers)', `Expected 24, got ${newParsed.validUrls.length}`);

  // 2. Normalization verification
  const normalizedSample = oldParsed.validUrls[1];
  assert(normalizedSample.pathname === '/about-us' && normalizedSample.slug === 'about-us', 'Normalization preserves path and slug', `Got path=${normalizedSample.pathname}, slug=${normalizedSample.slug}`);

  // 3. Matching pipeline
  const mappings = await matchUrlsBatch(oldParsed.validUrls, newParsed.validUrls);
  assert(mappings.length === 25, 'Matching preserves every single old URL', `Expected 25 mappings, got ${mappings.length}`);

  const exactHomepage = mappings.find(m => m.oldUrl === 'https://example.com/');
  assert(Boolean(exactHomepage && exactHomepage.newUrl === 'https://new-site.com/'), 'Homepage mapped', `Homepage match: ${exactHomepage?.newUrl}`);

  const slugMatch = mappings.find(m => m.oldUrl === 'https://example.com/about-us');
  assert(Boolean(slugMatch && slugMatch.newUrl === 'https://new-site.com/company/about'), 'About page slug match', `About mapped to: ${slugMatch?.newUrl}`);

  const unmappedMatch = mappings.find(m => m.oldUrl === 'https://example.com/legacy-page-no-match');
  assert(Boolean(unmappedMatch && unmappedMatch.status === 'unmapped'), 'Unrelated page marked as unmapped', `Status: ${unmappedMatch?.status}`);

  // Verify all statuses are valid
  const validStatuses = new Set(['suggested', 'needs_review', 'unmapped', 'approved', 'manually_mapped', 'rejected']);
  const allStatusesValid = mappings.every(m => validStatuses.has(m.status));
  assert(allStatusesValid, 'All mappings have valid status');

  // 4. Export verification
  const csvExport = exportToCsv(mappings, {
    format: 'csv',
    includeStatus: ['suggested', 'needs_review', 'unmapped', 'approved', 'manually_mapped'],
    includeLowConfidenceWarnings: true,
    statusCode: 301,
  });

  assert(csvExport.count === 25, 'CSV export count matches application mappings count', `Expected 25, got ${csvExport.count}`);

  const csvLines = csvExport.code.trim().split('\n');
  assert(csvLines.length === 26, 'CSV export lines include header + 25 rows', `Expected 26 lines, got ${csvLines.length}`);

  // 5. Test CSV without headers
  const noHeaderCsv = oldUrls25.slice(0, 20).join('\n');
  const noHeaderParsed = parseCsv(noHeaderCsv, 0, DEFAULT_NORMALIZATION_CONFIG);
  assert(noHeaderParsed.validUrls.length === 20, 'CSV without headers preserves row 0 as data', `Expected 20, got ${noHeaderParsed.validUrls.length}`);

  // 6. Test Blank rows & Whitespace
  const blankRowsCsv = '\n\nhttps://example.com/page-1\n   \nhttps://example.com/page-2\n\n';
  const blankParsed = parseCsv(blankRowsCsv, 0, DEFAULT_NORMALIZATION_CONFIG);
  assert(blankParsed.validUrls.length === 2, 'Blank rows correctly ignored without error', `Expected 2, got ${blankParsed.validUrls.length}`);

  // 7. Test Invalid URLs
  const invalidCsv = 'url\nhttps://example.com/valid-1\nnot-a-url\nmailto:user@example.com\njavascript:alert(1)\nhttps://example.com/valid-2\n';
  const invalidParsed = parseCsv(invalidCsv, 0, DEFAULT_NORMALIZATION_CONFIG);
  assert(invalidParsed.validUrls.length === 2, 'Invalid rows filtered out from validUrls', `Expected 2, got ${invalidParsed.validUrls.length}`);
  assert(invalidParsed.invalidRows.length === 3, 'Invalid rows reported with reasons', `Expected 3, got ${invalidParsed.invalidRows.length}`);

  // 8. Test Duplicate URLs
  const dupCsv = 'url\nhttps://example.com/page-1\nhttps://example.com/page-1\nhttps://example.com/page-2\n';
  const dupParsed = parseCsv(dupCsv, 0, { ...DEFAULT_NORMALIZATION_CONFIG, deduplicateUrls: true });
  assert(dupParsed.validUrls.length === 2, 'Duplicate URLs deduplicated when enabled', `Expected 2, got ${dupParsed.validUrls.length}`);
  assert(dupParsed.duplicates.length === 1, 'Duplicate URLs reported in duplicates array', `Expected 1, got ${dupParsed.duplicates.length}`);

  // 9. Test Multiple-column CSV with Old & New columns
  const multiColCsv = 'old_url,new_url,extra\nhttps://example.com/p1,https://new.com/p1,ok\nhttps://example.com/p2,https://new.com/p2,ok\n';
  const detectedOld = detectUrlColumns(parseCsvRaw(multiColCsv).rows, 'old');
  const detectedNew = detectUrlColumns(parseCsvRaw(multiColCsv).rows, 'new');
  assert(detectedOld.bestIndex === 0, 'Detects old_url column for Old side', `Got col ${detectedOld.bestIndex}`);
  assert(detectedNew.bestIndex === 1, 'Detects new_url column for New side', `Got col ${detectedNew.bestIndex}`);

  // 10. Test One-column CSV
  const oneColCsv = 'https://example.com/item-1\nhttps://example.com/item-2\nhttps://example.com/item-3\n';
  const oneColParsed = parseCsv(oneColCsv);
  assert(oneColParsed.validUrls.length === 3, 'One-column CSV parses successfully', `Expected 3, got ${oneColParsed.validUrls.length}`);

  // 11. Test Cookie Persistence Save & Restore with 25 mappings
  let cookieJar: Record<string, string> = {};
  const mockDocument = {
    get cookie() {
      return Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
    },
    set cookie(val: string) {
      const parts = val.split(';')[0].split('=');
      const key = parts[0].trim();
      const value = parts.slice(1).join('=');
      if (val.includes('expires=Thu, 01 Jan 1970')) {
        delete cookieJar[key];
      } else {
        cookieJar[key] = value;
      }
    }
  };

  (globalThis as any).document = mockDocument;

  const stateToPersist: StoredProjectState = {
    version: 1,
    savedAt: Date.now(),
    oldUrls: oldUrls25,
    newUrls: newUrls25,
    mappings: mappings.map(m => ({
      id: m.id,
      oldUrl: m.oldUrl,
      newUrl: m.newUrl,
      confidence: m.confidence,
      status: m.status,
    })),
    normalizationConfig: DEFAULT_NORMALIZATION_CONFIG,
    thresholds: { veryStrongMin: 90, strongMin: 75, needsReviewMin: 50 },
    oldInvalidRows: [],
    newInvalidRows: [],
    hasStarted: true,
  };

  const saveResult = saveProjectToCookies(stateToPersist);
  assert(saveResult.success, 'Save 25 URLs and mappings to cookies successfully without oversized error', `Error: ${saveResult.error}`);

  const loadResult = loadProjectFromCookies();
  assert(Boolean(loadResult.data && loadResult.data.oldUrls.length === 25), 'Load 25 URLs from cookies', `Expected 25, got ${loadResult.data?.oldUrls.length}`);
  assert(Boolean(loadResult.data && loadResult.data.mappings.length === 25), 'Load 25 mappings from cookies', `Expected 25, got ${loadResult.data?.mappings.length}`);

  const reExportAfterRestore = exportToCsv(
    (loadResult.data?.mappings || []).map(m => ({
      id: m.id,
      oldUrl: m.oldUrl,
      oldNormalized: normalizeUrl(m.oldUrl, DEFAULT_NORMALIZATION_CONFIG),
      newUrl: m.newUrl,
      newNormalized: m.newUrl ? normalizeUrl(m.newUrl, DEFAULT_NORMALIZATION_CONFIG) : null,
      confidence: m.confidence,
      explanation: { primaryReason: m.reason || 'Restored', confidenceBand: 'strong', signals: [], summaryPoints: [] },
      status: m.status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })),
    {
      format: 'csv',
      includeStatus: ['suggested', 'needs_review', 'unmapped', 'approved', 'manually_mapped'],
      includeLowConfidenceWarnings: true,
      statusCode: 301,
    }
  );
  assert(reExportAfterRestore.count === 25, 'Export after cookie restore maintains all 25 records', `Expected 25, got ${reExportAfterRestore.count}`);

  // --- TEST 12: CSV Formula Injection Safety ---
  const unsafeFormulaCell = '=cmd|"/C calc"!A0';
  const escapedFormula = escapeCsv(unsafeFormulaCell);
  assert(escapedFormula.startsWith("''=cmd") || escapedFormula.startsWith("'=cmd") || escapedFormula.includes("'="), 'CSV formula injection escaped with single quote', `Got: ${escapedFormula}`);

  const plusFormula = '+12345';
  const escapedPlus = escapeCsv(plusFormula);
  assert(escapedPlus.startsWith("'+"), 'CSV + formula symbol escaped', `Got: ${escapedPlus}`);

  const atFormula = '@SUM(A1:A10)';
  const escapedAt = escapeCsv(atFormula);
  assert(escapedAt.startsWith("'@"), 'CSV @ formula symbol escaped', `Got: ${escapedAt}`);

  // --- TEST 13: All 8 Exporter Formats Output Generation ---
  const activeMappings = mappings.filter(m => m.newUrl);
  const nextJsRes = exportToNextJs(activeMappings, { format: 'nextjs', includeStatus: ['suggested', 'approved', 'needs_review'], includeLowConfidenceWarnings: true, statusCode: 301 });
  assert(nextJsRes.count === activeMappings.length && nextJsRes.code.includes('async redirects()'), 'Next.js redirects exporter generates valid syntax');

  const vercelRes = exportToVercel(activeMappings, { format: 'vercel', includeStatus: ['suggested', 'approved', 'needs_review'], includeLowConfidenceWarnings: true, statusCode: 301 });
  assert(vercelRes.count === activeMappings.length && vercelRes.code.includes('openapi.vercel.sh'), 'Vercel exporter generates valid schema');

  const netlifyRes = exportToNetlify(activeMappings, { format: 'netlify', includeStatus: ['suggested', 'approved', 'needs_review'], includeLowConfidenceWarnings: true, statusCode: 301 });
  assert(netlifyRes.count === activeMappings.length && netlifyRes.code.includes('301!'), 'Netlify exporter generates valid _redirects');

  const apacheRes = exportToApache(activeMappings, { format: 'apache', includeStatus: ['suggested', 'approved', 'needs_review'], includeLowConfidenceWarnings: true, statusCode: 301 });
  assert(apacheRes.count === activeMappings.length && apacheRes.code.includes('RewriteRule'), 'Apache exporter generates valid RewriteRule directives');

  const nginxRes = exportToNginx(activeMappings, { format: 'nginx', includeStatus: ['suggested', 'approved', 'needs_review'], includeLowConfidenceWarnings: true, statusCode: 301 });
  assert(nginxRes.count === activeMappings.length && nginxRes.code.includes('return 301'), 'Nginx exporter generates valid location blocks');

  const jsonRes = exportToJson(mappings, { format: 'json', includeStatus: ['suggested', 'approved', 'needs_review', 'unmapped'], includeLowConfidenceWarnings: true, statusCode: 301 });
  assert(jsonRes.count === mappings.length && JSON.parse(jsonRes.code).redirects.length === mappings.length, 'JSON exporter preserves all mappings');

  const mdRes = exportToMarkdown(mappings, { format: 'markdown', includeStatus: ['suggested', 'approved', 'needs_review', 'unmapped'], includeLowConfidenceWarnings: true, statusCode: 301 });
  assert(mdRes.count === mappings.length && mdRes.code.includes('# Website Migration Redirect Report'), 'Markdown report exporter generates valid markdown');

  // --- TEST 14: Conflicting Mappings & Redirect Cycles Validation ---
  const conflictingMappings = [
    {
      id: 'c1',
      oldUrl: 'https://example.com/same-path',
      oldNormalized: normalizeUrl('https://example.com/same-path'),
      newUrl: 'https://new.com/target-a',
      newNormalized: normalizeUrl('https://new.com/target-a'),
      confidence: 100,
      explanation: { primaryReason: 'Exact', confidenceBand: 'very_strong' as const, signals: [], summaryPoints: [] },
      status: 'suggested' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'c2',
      oldUrl: 'https://example.com/same-path',
      oldNormalized: normalizeUrl('https://example.com/same-path'),
      newUrl: 'https://new.com/target-b',
      newNormalized: normalizeUrl('https://new.com/target-b'),
      confidence: 90,
      explanation: { primaryReason: 'Exact', confidenceBand: 'very_strong' as const, signals: [], summaryPoints: [] },
      status: 'suggested' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
  const detectedIssues = validateMigration(conflictingMappings);
  assert(detectedIssues.some(i => i.type === 'duplicate_source' && i.severity === 'error'), 'Validator detects conflicting mappings for identical source URL');

  return { passed: allPassed, results };
}

// Auto-run when executed directly via CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('pipeline.test')) {
  runPipelineTests().then(({ passed, results }) => {
    console.log(results.join('\n'));
    console.log(`\n================================`);
    console.log(`SUMMARY: ${results.length} tests executed, PASSED: ${passed}`);
    console.log(`================================`);
    if (!passed) {
      process.exit(1);
    }
  }).catch(err => {
    console.error('Test run failed with unexpected error:', err);
    process.exit(1);
  });
}
