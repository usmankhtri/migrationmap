/**
 * MigrationMap - Migration Health Check & Issue Validation Engine
 * 
 * Detects redirect loops, chains, self-redirects, unmapped URLs,
 * protocol/slash/www inconsistencies, and fan-in anomalies.
 */

import {
  UrlMapping,
  MigrationIssue,
  ImportInvalidRow,
} from '../types/migration';

/**
 * Normalizes path for redirect graph analysis (strips query, hash, trailing slashes)
 */
function cleanPathKey(path: string | null): string {
  if (!path) return '';
  try {
    const isAbs = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(path);
    const pathname = isAbs ? new URL(path).pathname : path.split(/[?#]/)[0];
    const stripped = pathname.replace(/\/+$/, '');
    return stripped === '' ? '/' : stripped.toLowerCase();
  } catch {
    return path.replace(/\/+$/, '').toLowerCase();
  }
}

/**
 * Validates mappings and input data for potential migration issues
 */
export function validateMigration(
  mappings: UrlMapping[],
  oldInvalidRows: ImportInvalidRow[] = [],
  newInvalidRows: ImportInvalidRow[] = []
): MigrationIssue[] {
  const issues: MigrationIssue[] = [];

  // Graph representation for cycle and chain detection: sourceKey -> targetKey
  const redirectGraph = new Map<string, { target: string; mappingId: string; rawSource: string; rawTarget: string }>();
  const destinationMap = new Map<string, string[]>(); // destinationKey -> mappingIds[]
  const sourceOccurrences = new Map<string, string[]>(); // sourceKey -> mappingIds[]

  // 1. Process mappings into lookup structures
  for (const m of mappings) {
    const srcKey = cleanPathKey(m.oldUrl);
    const tgtKey = m.newUrl ? cleanPathKey(m.newUrl) : '';

    // Source tracking
    const sources = sourceOccurrences.get(srcKey) || [];
    sources.push(m.id);
    sourceOccurrences.set(srcKey, sources);

    // Destination tracking
    if (tgtKey) {
      const dests = destinationMap.get(tgtKey) || [];
      dests.push(m.id);
      destinationMap.set(tgtKey, dests);

      redirectGraph.set(srcKey, {
        target: tgtKey,
        mappingId: m.id,
        rawSource: m.oldUrl,
        rawTarget: m.newUrl!,
      });
    }
  }

  // --- CHECK 1: Self Redirects (/a -> /a) ---
  const selfRedirectIds: string[] = [];
  const selfRedirectUrls: string[] = [];
  for (const m of mappings) {
    if (m.newUrl) {
      const srcKey = cleanPathKey(m.oldUrl);
      const tgtKey = cleanPathKey(m.newUrl);
      if (srcKey === tgtKey) {
        selfRedirectIds.push(m.id);
        selfRedirectUrls.push(m.oldUrl);
      }
    }
  }

  // --- CHECK 1B: Conflicting Mappings & Duplicate Source URLs ---
  const conflictingSourceMappingIds: string[] = [];
  const conflictingSourceUrls: string[] = [];
  const duplicateSourceMappingIds: string[] = [];
  const duplicateSourceUrls: string[] = [];

  for (const [srcKey, mIds] of sourceOccurrences.entries()) {
    if (mIds.length > 1) {
      const distinctTargets = new Set<string>();
      for (const mId of mIds) {
        const m = mappings.find(x => x.id === mId);
        if (m && m.newUrl) {
          distinctTargets.add(cleanPathKey(m.newUrl));
        }
      }

      if (distinctTargets.size > 1) {
        // Conflicting destinations for same source!
        for (const mId of mIds) conflictingSourceMappingIds.push(mId);
        const firstM = mappings.find(x => x.id === mIds[0]);
        if (firstM) conflictingSourceUrls.push(firstM.oldUrl);
      } else {
        // Redundant duplicate source
        for (const mId of mIds) duplicateSourceMappingIds.push(mId);
        const firstM = mappings.find(x => x.id === mIds[0]);
        if (firstM) duplicateSourceUrls.push(firstM.oldUrl);
      }
    }
  }

  if (conflictingSourceMappingIds.length > 0) {
    issues.push({
      id: 'issue-conflicting-sources',
      type: 'duplicate_source',
      severity: 'error',
      title: `${conflictingSourceUrls.length} Conflicting Mapping${conflictingSourceUrls.length > 1 ? 's' : ''} Detected`,
      description: 'The same source URL has multiple differing destination targets. Web servers will only execute the first rule encountered, leading to unpredictable traffic routing.',
      recommendation: 'Remove conflicting duplicate rows or standardize on a single destination for each source path.',
      affectedMappingIds: conflictingSourceMappingIds,
      affectedUrls: conflictingSourceUrls,
    });
  } else if (duplicateSourceMappingIds.length > 0) {
    issues.push({
      id: 'issue-duplicate-sources',
      type: 'duplicate_source',
      severity: 'warning',
      title: `${duplicateSourceUrls.length} Duplicate Source URL Rule${duplicateSourceUrls.length > 1 ? 's' : ''}`,
      description: 'Identical legacy URLs are mapped multiple times in this project. While they point to the same destination, duplicate rules inflate server configuration files.',
      recommendation: 'Enable URL deduplication in Settings or consolidate duplicate rows before deployment.',
      affectedMappingIds: duplicateSourceMappingIds,
      affectedUrls: duplicateSourceUrls,
    });
  }

  if (selfRedirectIds.length > 0) {
    issues.push({
      id: 'issue-self-redirect',
      type: 'self_redirect',
      severity: 'error',
      title: `${selfRedirectIds.length} Self-Redirect${selfRedirectIds.length > 1 ? 's' : ''} Detected`,
      description: 'The source URL points directly to itself. Browsers will trigger redirect loops or waste crawl budget.',
      recommendation: 'Remove these redirect rules or update the destination to a distinct new page.',
      affectedMappingIds: selfRedirectIds,
      affectedUrls: selfRedirectUrls,
    });
  }

  // --- CHECK 2: Redirect Loops / Cycles (A -> B -> A or longer cycles) ---
  const cycleMappingIds = new Set<string>();
  const cycleUrls = new Set<string>();
  const cycleDescriptions: string[] = [];

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const currentPath: string[] = [];

  function detectCycles(node: string) {
    visited.add(node);
    recStack.add(node);
    currentPath.push(node);

    const edge = redirectGraph.get(node);
    if (edge) {
      const neighbor = edge.target;
      if (!visited.has(neighbor)) {
        detectCycles(neighbor);
      } else if (recStack.has(neighbor)) {
        // Found a cycle!
        const cycleStartIndex = currentPath.indexOf(neighbor);
        const cycleNodes = currentPath.slice(cycleStartIndex);
        cycleNodes.push(neighbor); // complete loop display

        cycleDescriptions.push(cycleNodes.join(' → '));

        for (const cNode of cycleNodes) {
          const mInfo = redirectGraph.get(cNode);
          if (mInfo) {
            cycleMappingIds.add(mInfo.mappingId);
            cycleUrls.add(mInfo.rawSource);
          }
        }
      }
    }

    recStack.delete(node);
    currentPath.pop();
  }

  for (const node of redirectGraph.keys()) {
    if (!visited.has(node)) {
      detectCycles(node);
    }
  }

  if (cycleMappingIds.size > 0) {
    issues.push({
      id: 'issue-redirect-loop',
      type: 'redirect_loop',
      severity: 'error',
      title: `Potential Redirect Loop${cycleDescriptions.length > 1 ? 's' : ''} Found`,
      description: `Circular redirects detected: ${cycleDescriptions.slice(0, 3).join('; ')}. This causes browser ERR_TOO_MANY_REDIRECTS crashes.`,
      recommendation: 'Break the circular dependency so each old URL resolves directly to its final destination.',
      affectedMappingIds: Array.from(cycleMappingIds),
      affectedUrls: Array.from(cycleUrls),
      metadata: { cycles: cycleDescriptions },
    });
  }

  // --- CHECK 3: Redirect Chains (A -> B, B -> C) ---
  const chainMappingIds = new Set<string>();
  const chainUrls = new Set<string>();
  const chainExamples: string[] = [];

  for (const [src, edge] of redirectGraph.entries()) {
    // If the target of this mapping is also a source in redirectGraph, and not a self-redirect
    if (redirectGraph.has(edge.target) && edge.target !== src) {
      const nextEdge = redirectGraph.get(edge.target)!;
      // Ensure it's not already flagged as an exact 2-step loop
      if (nextEdge.target !== src) {
        chainMappingIds.add(edge.mappingId);
        chainMappingIds.add(nextEdge.mappingId);
        chainUrls.add(edge.rawSource);
        chainUrls.add(edge.rawTarget);
        if (chainExamples.length < 3) {
          chainExamples.push(`${src} → ${edge.target} → ${nextEdge.target}`);
        }
      }
    }
  }

  if (chainMappingIds.size > 0) {
    issues.push({
      id: 'issue-redirect-chain',
      type: 'redirect_chain',
      severity: 'warning',
      title: `${chainMappingIds.size} Possible Redirect Chain${chainMappingIds.size > 1 ? 's' : ''} Detected`,
      description: `Chained redirects hurt SEO ranking signals and delay page load times. Examples: ${chainExamples.join('; ')}`,
      recommendation: 'Point the initial old URL directly to the final destination in a single 301 redirect.',
      affectedMappingIds: Array.from(chainMappingIds),
      affectedUrls: Array.from(chainUrls),
      metadata: { examples: chainExamples },
    });
  }

  // --- CHECK 4: Unmapped Old URLs ---
  const unmappedMappings = mappings.filter(m => !m.newUrl || m.status === 'unmapped');
  if (unmappedMappings.length > 0) {
    issues.push({
      id: 'issue-unmapped-urls',
      type: 'unmapped_url',
      severity: 'warning',
      title: `${unmappedMappings.length} Unmapped Old URL${unmappedMappings.length > 1 ? 's' : ''}`,
      description: `${unmappedMappings.length} legacy URLs have no assigned destination. Users and crawlers hitting these URLs will encounter 404 Not Found errors.`,
      recommendation: 'Assign destinations manually or route to relevant category or parent pages.',
      affectedMappingIds: unmappedMappings.map(m => m.id),
      affectedUrls: unmappedMappings.map(m => m.oldUrl),
    });
  }

  // --- CHECK 5: High Fan-In (Many old URLs pointing to identical destination) ---
  const highFanInDests: Array<{ destination: string; count: number; mappingIds: string[] }> = [];
  for (const [dest, mappingIds] of destinationMap.entries()) {
    // If more than 6 mappings point to the same destination (excluding root / or homepage if intentional)
    if (mappingIds.length >= 6) {
      highFanInDests.push({ destination: dest, count: mappingIds.length, mappingIds });
    }
  }

  if (highFanInDests.length > 0) {
    const totalAffected = highFanInDests.reduce((acc, h) => acc + h.mappingIds.length, 0);
    const affectedIds = highFanInDests.flatMap(h => h.mappingIds);
    issues.push({
      id: 'issue-high-fan-in',
      type: 'high_fan_in',
      severity: 'info',
      title: `High Redirect Fan-in (${highFanInDests.length} Destination${highFanInDests.length > 1 ? 's' : ''})`,
      description: `Multiple old pages are consolidating into single destinations (e.g. ${highFanInDests[0].count} URLs pointing to "${highFanInDests[0].destination}"). Google may treat mass homepage redirects as soft 404s.`,
      recommendation: 'Verify whether specific 1:1 topic redirects can be created before using generic catch-all destinations.',
      affectedMappingIds: affectedIds,
      affectedUrls: highFanInDests.map(h => `${h.destination} (${h.count} sources)`),
      metadata: { destinations: highFanInDests },
    });
  }

  // --- CHECK 6: Low Confidence Mappings (< 50%) ---
  const lowConfidence = mappings.filter(m => m.newUrl && m.confidence < 50 && m.status !== 'approved');
  if (lowConfidence.length > 0) {
    issues.push({
      id: 'issue-low-confidence',
      type: 'low_confidence',
      severity: 'warning',
      title: `${lowConfidence.length} Low-Confidence Suggested Mapping${lowConfidence.length > 1 ? 's' : ''}`,
      description: 'These mappings scored below 50% confidence due to weak slug similarity or dissimilar URL paths.',
      recommendation: 'Review each destination manually before exporting production redirect rules.',
      affectedMappingIds: lowConfidence.map(m => m.id),
      affectedUrls: lowConfidence.map(m => `${m.oldUrl} → ${m.newUrl}`),
    });
  }

  // --- CHECK 7: Protocol, WWW, and Trailing Slash Inconsistencies ---
  const slashMismatchIds: string[] = [];
  const slashMismatchUrls: string[] = [];
  const wwwMismatchIds: string[] = [];
  const protocolMismatchIds: string[] = [];

  for (const m of mappings) {
    if (m.newUrl && m.newNormalized) {
      // Trailing slash mismatch
      if (m.oldNormalized.hasTrailingSlash !== m.newNormalized.hasTrailingSlash && !m.newNormalized.extension) {
        slashMismatchIds.push(m.id);
        slashMismatchUrls.push(`${m.oldUrl} vs ${m.newUrl}`);
      }
      // WWW mismatch
      if (m.oldNormalized.hasWww !== m.newNormalized.hasWww && m.oldNormalized.hostname && m.newNormalized.hostname) {
        wwwMismatchIds.push(m.id);
      }
      // HTTP vs HTTPS
      if (m.oldNormalized.protocol && m.newNormalized.protocol && m.oldNormalized.protocol !== m.newNormalized.protocol) {
        protocolMismatchIds.push(m.id);
      }
    }
  }

  if (slashMismatchIds.length > 0 && slashMismatchIds.length < mappings.length) {
    issues.push({
      id: 'issue-trailing-slash',
      type: 'trailing_slash_mismatch',
      severity: 'info',
      title: `${slashMismatchIds.length} Trailing Slash Inconsistenc${slashMismatchIds.length > 1 ? 'ies' : 'y'}`,
      description: 'Some mapped destinations differ in trailing-slash format compared to source URLs, which may cause secondary redirects if your server enforces a trailing-slash rule.',
      recommendation: 'Confirm server canonical trailing-slash conventions in Settings before generating rules.',
      affectedMappingIds: slashMismatchIds,
      affectedUrls: slashMismatchUrls.slice(0, 5),
    });
  }

  if (protocolMismatchIds.length > 0) {
    issues.push({
      id: 'issue-protocol-mismatch',
      type: 'protocol_mismatch',
      severity: 'warning',
      title: `${protocolMismatchIds.length} Protocol Inconsistenc${protocolMismatchIds.length > 1 ? 'ies' : 'y'} (HTTP vs HTTPS)`,
      description: 'Some source URLs use HTTPS while destinations use HTTP (or vice versa). Downgrading to HTTP can trigger browser security warnings.',
      recommendation: 'Ensure all modern destination URLs standardize on HTTPS protocol.',
      affectedMappingIds: protocolMismatchIds,
      affectedUrls: protocolMismatchIds.map(id => {
        const m = mappings.find(x => x.id === id);
        return m ? `${m.oldUrl} → ${m.newUrl}` : id;
      }).slice(0, 5),
    });
  }

  if (wwwMismatchIds.length > 0) {
    issues.push({
      id: 'issue-www-mismatch',
      type: 'www_mismatch',
      severity: 'info',
      title: `${wwwMismatchIds.length} Subdomain / WWW Difference${wwwMismatchIds.length > 1 ? 's' : ''}`,
      description: 'Mapped destinations differ in "www." subdomain prefix from the source URL host.',
      recommendation: 'Ensure your server has a canonical host rule (e.g. redirecting non-www to www, or vice-versa).',
      affectedMappingIds: wwwMismatchIds,
      affectedUrls: wwwMismatchIds.map(id => {
        const m = mappings.find(x => x.id === id);
        return m ? `${m.oldUrl} → ${m.newUrl}` : id;
      }).slice(0, 5),
    });
  }

  // --- CHECK 8: Invalid Input Rows Detected on Import ---
  const totalInvalidRows = oldInvalidRows.length + newInvalidRows.length;
  if (totalInvalidRows > 0) {
    issues.push({
      id: 'issue-invalid-rows',
      type: 'invalid_destination',
      severity: 'info',
      title: `${totalInvalidRows} Invalid Input Row${totalInvalidRows > 1 ? 's' : ''} Skipped`,
      description: `Found ${oldInvalidRows.length} invalid old rows and ${newInvalidRows.length} invalid new rows with malformed formatting or unsupported protocols.`,
      recommendation: 'You can download the invalid rows log to inspect and fix source records.',
      affectedMappingIds: [],
      affectedUrls: [
        ...oldInvalidRows.map(r => `Line ${r.line}: ${r.rawText.slice(0, 40)} (${r.reason})`),
        ...newInvalidRows.map(r => `Line ${r.line}: ${r.rawText.slice(0, 40)} (${r.reason})`),
      ].slice(0, 10),
    });
  }

  return issues;
}
