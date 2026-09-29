/**
 * MigrationMap - Deterministic Multi-Signal URL Matching Engine
 * 
 * Computes deterministic confidence scores (0-100) using 11 distinct signals,
 * inverted candidate index for O(N) performance on large datasets, and generates
 * transparent, human-readable match explanations.
 */

import {
  NormalizedUrl,
  UrlMapping,
  MatchSignal,
  MatchExplanation,
  ConfidenceBand,
  ConfidenceThresholds,
} from '../types/migration';

export const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  veryStrongMin: 90,
  strongMin: 75,
  needsReviewMin: 50,
};

/**
 * Normalized Levenshtein similarity between two strings (0 to 1)
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  
  const lenA = a.length;
  const lenB = b.length;
  const maxLen = Math.max(lenA, lenB);
  if (maxLen === 0) return 1.0;

  // Optimize: single-row DP
  const dp: number[] = new Array(lenB + 1);
  for (let j = 0; j <= lenB; j++) dp[j] = j;

  for (let i = 1; i <= lenA; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= lenB; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }

  const distance = dp[lenB];
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Jaccard token overlap between two arrays of tokens (0 to 1)
 */
export function tokenOverlap(tokensA: string[], tokensB: string[]): {
  score: number;
  intersection: string[];
} {
  if (tokensA.length === 0 || tokensB.length === 0) {
    return { score: 0, intersection: [] };
  }

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection: string[] = [];

  for (const token of setA) {
    if (setB.has(token)) {
      intersection.push(token);
    }
  }

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  const score = unionSize > 0 ? intersection.length / unionSize : 0;

  return { score, intersection };
}

/**
 * Extracts numeric IDs from a path (e.g. "product-4921", "post/1042")
 */
function extractNumericIds(pathname: string): string[] {
  const matches = pathname.match(/\b\d{2,10}\b/g);
  return matches || [];
}

/**
 * Inverted Index for fast candidate retrieval
 */
export class UrlIndex {
  private exactPathMap = new Map<string, NormalizedUrl[]>();
  private slugMap = new Map<string, NormalizedUrl[]>();
  private tokenMap = new Map<string, Set<NormalizedUrl>>();
  private numericIdMap = new Map<string, Set<NormalizedUrl>>();
  public allUrls: NormalizedUrl[] = [];

  constructor(urls: NormalizedUrl[]) {
    this.allUrls = urls;
    this.buildIndex();
  }

  private buildIndex() {
    for (const url of this.allUrls) {
      // 1. Exact path
      const pathKey = url.pathname;
      const existingPaths = this.exactPathMap.get(pathKey) || [];
      existingPaths.push(url);
      this.exactPathMap.set(pathKey, existingPaths);

      // 2. Exact slug
      if (url.slug) {
        const existingSlugs = this.slugMap.get(url.slug) || [];
        existingSlugs.push(url);
        this.slugMap.set(url.slug, existingSlugs);
      }

      // 3. Tokens
      for (const token of url.tokens) {
        if (!this.tokenMap.has(token)) {
          this.tokenMap.set(token, new Set());
        }
        this.tokenMap.get(token)!.add(url);
      }

      // 4. Numeric IDs
      const ids = extractNumericIds(url.pathname);
      for (const id of ids) {
        if (!this.numericIdMap.has(id)) {
          this.numericIdMap.set(id, new Set());
        }
        this.numericIdMap.get(id)!.add(url);
      }
    }
  }

  /**
   * Retrieves candidate new URLs for an old URL to avoid O(N) comparisons
   */
  public getCandidates(oldUrl: NormalizedUrl, maxCandidates = 30): NormalizedUrl[] {
    const candidateScores = new Map<NormalizedUrl, number>();

    // Signal: Exact path match gets priority candidate
    const exactMatches = this.exactPathMap.get(oldUrl.pathname);
    if (exactMatches) {
      for (const match of exactMatches) {
        candidateScores.set(match, 1000);
      }
    }

    // Signal: Exact slug match
    if (oldUrl.slug) {
      const slugMatches = this.slugMap.get(oldUrl.slug);
      if (slugMatches) {
        for (const match of slugMatches) {
          candidateScores.set(match, (candidateScores.get(match) || 0) + 150);
        }
      }
    }

    // Signal: Numeric ID match
    const ids = extractNumericIds(oldUrl.pathname);
    for (const id of ids) {
      const idMatches = this.numericIdMap.get(id);
      if (idMatches) {
        for (const match of idMatches) {
          candidateScores.set(match, (candidateScores.get(match) || 0) + 120);
        }
      }
    }

    // Signal: Token overlap
    for (const token of oldUrl.tokens) {
      const tokenMatches = this.tokenMap.get(token);
      if (tokenMatches) {
        for (const match of tokenMatches) {
          candidateScores.set(match, (candidateScores.get(match) || 0) + 20);
        }
      }
    }

    // If dataset is moderate (<= 500 URLs), evaluate all candidates to guarantee optimal pairing
    if (this.allUrls.length <= 500) {
      return this.allUrls;
    }

    // If candidate set is small, fallback to sampling first URLs to ensure candidate list
    if (candidateScores.size < 5) {
      const sampleLimit = Math.min(this.allUrls.length, 30);
      for (let i = 0; i < sampleLimit; i++) {
        const u = this.allUrls[i];
        if (!candidateScores.has(u)) {
          candidateScores.set(u, 1);
        }
      }
    }

    // Sort by candidate preliminary score
    return Array.from(candidateScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCandidates)
      .map(entry => entry[0]);
  }
}

/**
 * Calculates 11 deterministic signals between an old and new URL
 */
export function evaluateSignals(oldUrl: NormalizedUrl, newUrl: NormalizedUrl): {
  signals: MatchSignal[];
  totalConfidence: number;
} {
  const signals: MatchSignal[] = [];

  // 1. Exact Path Match (Signal 1)
  const isExactPath = oldUrl.pathname === newUrl.pathname;
  if (isExactPath) {
    signals.push({
      id: 'exact_path',
      name: 'Exact Path Match',
      score: 100,
      weight: 1.0,
      description: 'The path structure matches identical character-for-character.',
      matchedValue: oldUrl.pathname,
    });
    // Direct path match is 100% confidence
    return { signals, totalConfidence: 100 };
  }

  // 2. Exact Slug Match (Signal 2)
  const isExactSlug = Boolean(oldUrl.slug && newUrl.slug && oldUrl.slug === newUrl.slug);
  const slugSim = stringSimilarity(oldUrl.slug, newUrl.slug);
  signals.push({
    id: 'slug_match',
    name: isExactSlug ? 'Exact Slug Match' : 'Slug Similarity',
    score: isExactSlug ? 100 : Math.round(slugSim * 100),
    weight: 0.35,
    description: isExactSlug
      ? `Both URLs share the exact same slug: "${oldUrl.slug}"`
      : `Page slugs have ${Math.round(slugSim * 100)}% string similarity ("${oldUrl.slug}" vs "${newUrl.slug}")`,
    matchedValue: isExactSlug ? oldUrl.slug : undefined,
  });

  // 3. Path Segment Similarity (Signal 3)
  let segmentMatchCount = 0;
  const maxSegs = Math.max(oldUrl.segments.length, newUrl.segments.length, 1);
  for (let i = 0; i < Math.min(oldUrl.segments.length, newUrl.segments.length); i++) {
    if (oldUrl.segments[i] === newUrl.segments[i]) {
      segmentMatchCount++;
    } else if (stringSimilarity(oldUrl.segments[i], newUrl.segments[i]) > 0.8) {
      segmentMatchCount += 0.7;
    }
  }
  const segmentScore = Math.min(100, Math.round((segmentMatchCount / maxSegs) * 100));
  signals.push({
    id: 'path_segments',
    name: 'Path Segment Alignment',
    score: segmentScore,
    weight: 0.20,
    description: `${Math.round(segmentMatchCount)} of ${maxSegs} path segments match closely in position`,
  });

  // 4. Token Similarity & Keyword Overlap (Signals 4 & 5)
  const { score: overlapScore, intersection } = tokenOverlap(oldUrl.tokens, newUrl.tokens);
  signals.push({
    id: 'keyword_overlap',
    name: 'Keyword Overlap',
    score: Math.round(overlapScore * 100),
    weight: 0.20,
    description: intersection.length > 0
      ? `Shared meaningful keywords: [${intersection.slice(0, 4).join(', ')}${intersection.length > 4 ? '...' : ''}]`
      : 'No common keywords detected between paths',
    matchedValue: intersection.join(', '),
  });

  // 5. Filename & Extension Transformation (Signal 6)
  const oldExt = oldUrl.extension;
  const newExt = newUrl.extension;
  let extSignalScore = 50;
  let extDesc = 'No file extensions involved';
  if (oldExt && !newExt) {
    extSignalScore = 95;
    extDesc = `Legacy extension ".${oldExt}" was cleanly dropped for clean modern URL`;
  } else if (oldExt && newExt && oldExt === newExt) {
    extSignalScore = 90;
    extDesc = `Both URLs retain extension ".${oldExt}"`;
  } else if (oldExt && newExt && oldExt !== newExt) {
    extSignalScore = 30;
    extDesc = `Mismatched extensions: ".${oldExt}" vs ".${newExt}"`;
  }
  signals.push({
    id: 'extension_transformation',
    name: 'Extension Handling',
    score: extSignalScore,
    weight: 0.05,
    description: extDesc,
  });

  // 6. Overall Full-Path Edit Distance (Signal 7)
  const fullPathSim = stringSimilarity(oldUrl.pathname, newUrl.pathname);
  signals.push({
    id: 'edit_distance',
    name: 'Full Path Similarity',
    score: Math.round(fullPathSim * 100),
    weight: 0.10,
    description: `Overall path string similarity is ${Math.round(fullPathSim * 100)}%`,
  });

  // 7. URL Depth Similarity (Signal 8)
  const depthDiff = Math.abs(oldUrl.depth - newUrl.depth);
  let depthScore = 100;
  if (depthDiff === 1) depthScore = 80;
  else if (depthDiff === 2) depthScore = 55;
  else if (depthDiff > 2) depthScore = Math.max(10, 50 - depthDiff * 15);
  signals.push({
    id: 'depth_similarity',
    name: 'URL Depth Hierarchy',
    score: depthScore,
    weight: 0.05,
    description: depthDiff === 0
      ? `Identical hierarchy depth (${oldUrl.depth} levels)`
      : `Hierarchy depth difference of ${depthDiff} level(s) (${oldUrl.depth} vs ${newUrl.depth})`,
  });

  // 8. Numeric ID Alignment (Signal 9)
  const oldIds = extractNumericIds(oldUrl.pathname);
  const newIds = extractNumericIds(newUrl.pathname);
  let numericScore = 50;
  let numericDesc = 'No unique numeric identifiers found';
  if (oldIds.length > 0 && newIds.length > 0) {
    const matchedId = oldIds.find(id => newIds.includes(id));
    if (matchedId) {
      numericScore = 100;
      numericDesc = `Matching entity ID preserved: #${matchedId}`;
    } else {
      numericScore = 20;
      numericDesc = `Differing numeric IDs found: ${oldIds.join(', ')} vs ${newIds.join(', ')}`;
    }
  }
  signals.push({
    id: 'numeric_id',
    name: 'Entity ID Match',
    score: numericScore,
    weight: 0.05,
    description: numericDesc,
  });

  // Compute weighted composite score
  let weightedSum = 0;
  let totalWeight = 0;

  for (const s of signals) {
    weightedSum += s.score * s.weight;
    totalWeight += s.weight;
  }

  let finalScore = Math.round(weightedSum / totalWeight);

  // Bonus for exact slug match with good keyword overlap
  if (isExactSlug && overlapScore > 0.4) {
    finalScore = Math.max(finalScore, 92);
  }

  // Bonus for ID match + slug similarity
  if (numericScore === 100 && slugSim > 0.6) {
    finalScore = Math.max(finalScore, 95);
  }

  // Penalty if both slug similarity and keyword overlap are very low
  if (slugSim < 0.25 && overlapScore < 0.2) {
    finalScore = Math.min(finalScore, 40);
  }

  finalScore = Math.max(0, Math.min(100, finalScore));

  return { signals, totalConfidence: finalScore };
}

/**
 * Creates user-friendly match explanation with bullet points
 */
export function buildMatchExplanation(
  signals: MatchSignal[],
  confidence: number,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): MatchExplanation {
  let confidenceBand: ConfidenceBand = 'low';
  if (confidence >= thresholds.veryStrongMin) confidenceBand = 'very_strong';
  else if (confidence >= thresholds.strongMin) confidenceBand = 'strong';
  else if (confidence >= thresholds.needsReviewMin) confidenceBand = 'needs_review';

  const summaryPoints: string[] = [];

  // Sort signals by relevance to display
  const topSignals = [...signals].sort((a, b) => (b.score * b.weight) - (a.score * a.weight));

  for (const signal of topSignals) {
    if (signal.score >= 80) {
      if (signal.id === 'exact_path') summaryPoints.push('Identical exact path');
      else if (signal.id === 'slug_match' && signal.score === 100) summaryPoints.push('Exact matching page slug');
      else if (signal.id === 'slug_match') summaryPoints.push(`Strong slug similarity (${signal.score}%)`);
      else if (signal.id === 'keyword_overlap') summaryPoints.push('Strong keyword overlap');
      else if (signal.id === 'numeric_id' && signal.score === 100) summaryPoints.push('Matching numeric entity ID');
      else if (signal.id === 'extension_transformation' && signal.score >= 90) summaryPoints.push('Clean legacy extension removal');
      else if (signal.id === 'depth_similarity' && signal.score === 100) summaryPoints.push('Matching URL hierarchy depth');
    }
  }

  if (summaryPoints.length === 0) {
    if (confidence >= 50) {
      summaryPoints.push('Partial path and slug correspondence');
      summaryPoints.push('Manual review recommended before deployment');
    } else {
      summaryPoints.push('Low structural and semantic similarity');
      summaryPoints.push('Manual destination mapping required');
    }
  }

  let primaryReason = 'Suggested match based on path and slug similarity';
  if (confidence === 100) {
    primaryReason = 'Exact path match';
  } else if (confidence >= thresholds.veryStrongMin) {
    primaryReason = 'High confidence slug and keyword match';
  } else if (confidence >= thresholds.strongMin) {
    primaryReason = 'Strong semantic similarity';
  } else if (confidence >= thresholds.needsReviewMin) {
    primaryReason = 'Partial match - review recommended';
  } else {
    primaryReason = 'Low confidence match';
  }

  return {
    primaryReason,
    confidenceBand,
    signals,
    summaryPoints: summaryPoints.slice(0, 4),
  };
}

/**
 * Runs full deterministic matching of old URLs against new URLs
 */
export async function matchUrlsBatch(
  oldUrls: NormalizedUrl[],
  newUrls: NormalizedUrl[],
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS,
  onProgress?: (progress: { stage: string; current: number; total: number; percentage: number }) => void
): Promise<UrlMapping[]> {
  const mappings: UrlMapping[] = [];

  if (oldUrls.length === 0) {
    return [];
  }

  if (newUrls.length === 0) {
    return oldUrls.map((oldUrl, idx) => ({
      id: `map-${idx}-${Date.now()}`,
      oldUrl: oldUrl.raw,
      oldNormalized: oldUrl,
      newUrl: null,
      newNormalized: null,
      confidence: 0,
      explanation: {
        primaryReason: 'No new URLs available for mapping',
        confidenceBand: 'low',
        signals: [],
        summaryPoints: ['No destination URLs provided in dataset'],
      },
      status: 'unmapped',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  // 1. Build Index
  if (onProgress) {
    onProgress({
      stage: 'Building URL index & candidate maps...',
      current: 0,
      total: oldUrls.length,
      percentage: 5,
    });
  }
  const index = new UrlIndex(newUrls);

  // 2. Iterate and match with adaptive yielding to maintain high responsiveness
  const total = oldUrls.length;
  // Adaptive chunk size: updates progress smoothly in ~100 steps even with 50,000+ URLs
  const CHUNK_SIZE = Math.max(50, Math.min(500, Math.ceil(total / 100)));

  for (let i = 0; i < total; i++) {
    const oldUrl = oldUrls[i];
    const candidates = index.getCandidates(oldUrl, 30);

    let bestCandidate: NormalizedUrl | null = null;
    let bestConfidence = -1;
    let bestSignals: MatchSignal[] = [];
    const alternativeCandidates: Array<{
      url: string;
      confidence: number;
      explanation: MatchExplanation;
    }> = [];

    for (const candidate of candidates) {
      const { signals, totalConfidence } = evaluateSignals(oldUrl, candidate);
      
      if (totalConfidence > bestConfidence) {
        if (bestCandidate) {
          // Push previous best to alternatives
          alternativeCandidates.push({
            url: bestCandidate.raw,
            confidence: bestConfidence,
            explanation: buildMatchExplanation(bestSignals, bestConfidence, thresholds),
          });
        }
        bestConfidence = totalConfidence;
        bestCandidate = candidate;
        bestSignals = signals;
      } else if (totalConfidence >= thresholds.needsReviewMin) {
        alternativeCandidates.push({
          url: candidate.raw,
          confidence: totalConfidence,
          explanation: buildMatchExplanation(signals, totalConfidence, thresholds),
        });
      }
    }

    // Sort alternative candidates
    alternativeCandidates.sort((a, b) => b.confidence - a.confidence);

    // Status assignment
    let status: UrlMapping['status'] = 'suggested';
    let assignedCandidate: NormalizedUrl | null = bestCandidate;
    let assignedConfidence = bestConfidence >= 0 ? bestConfidence : 0;

    if (!bestCandidate || bestConfidence < 25) {
      status = 'unmapped';
      assignedCandidate = null;
      assignedConfidence = 0;
    } else if (bestConfidence >= thresholds.veryStrongMin) {
      status = 'suggested';
    } else {
      status = 'needs_review';
    }

    const explanation = status === 'unmapped'
      ? {
          primaryReason: 'No reasonable destination match found',
          confidenceBand: 'low' as const,
          signals: bestSignals,
          summaryPoints: ['No destination URL met similarity threshold (25%)'],
        }
      : buildMatchExplanation(bestSignals, bestConfidence, thresholds);

    mappings.push({
      id: `map-${i}-${Math.random().toString(36).slice(2, 8)}`,
      oldUrl: oldUrl.raw,
      oldNormalized: oldUrl,
      newUrl: assignedCandidate ? assignedCandidate.raw : null,
      newNormalized: assignedCandidate,
      confidence: assignedConfidence,
      explanation,
      status,
      alternativeCandidates: alternativeCandidates.slice(0, 5),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (i % CHUNK_SIZE === 0 || i === total - 1) {
      if (onProgress) {
        onProgress({
          stage: 'Evaluating URL matching signals...',
          current: i + 1,
          total,
          percentage: Math.round(5 + ((i + 1) / total) * 90),
        });
      }
      // Small tick yield
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return mappings;
}
