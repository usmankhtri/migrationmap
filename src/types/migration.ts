/**
 * MigrationMap - Types & Data Models
 * Deterministic URL mapping, validation, and redirect generation.
 */

export type MappingStatus = 
  | 'suggested'
  | 'approved'
  | 'rejected'
  | 'needs_review'
  | 'manually_mapped'
  | 'unmapped';

export type ConfidenceBand = 'very_strong' | 'strong' | 'needs_review' | 'low';

export interface MatchSignal {
  id: string;
  name: string;
  score: number; // 0 - 100
  weight: number;
  description: string;
  matchedValue?: string;
}

export interface MatchExplanation {
  primaryReason: string;
  confidenceBand: ConfidenceBand;
  signals: MatchSignal[];
  summaryPoints: string[];
}

export interface NormalizedUrl {
  raw: string;
  normalized: string;
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  slug: string;
  segments: string[];
  tokens: string[];
  depth: number;
  hasTrailingSlash: boolean;
  hasWww: boolean;
  extension?: string;
  sourceLine?: number;
}

export interface UrlMapping {
  id: string;
  oldUrl: string;
  oldNormalized: NormalizedUrl;
  newUrl: string | null;
  newNormalized: NormalizedUrl | null;
  confidence: number; // 0 - 100
  explanation: MatchExplanation;
  status: MappingStatus;
  userNotes?: string;
  manuallyEdited?: boolean;
  alternativeCandidates?: Array<{
    url: string;
    confidence: number;
    explanation: MatchExplanation;
  }>;
  createdAt: number;
  updatedAt: number;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export type IssueType =
  | 'unmapped_url'
  | 'duplicate_destination'
  | 'self_redirect'
  | 'redirect_loop'
  | 'redirect_chain'
  | 'empty_destination'
  | 'invalid_destination'
  | 'protocol_mismatch'
  | 'www_mismatch'
  | 'trailing_slash_mismatch'
  | 'high_fan_in'
  | 'low_confidence'
  | 'duplicate_source';

export interface MigrationIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  recommendation: string;
  affectedMappingIds: string[];
  affectedUrls: string[];
  metadata?: Record<string, any>;
}

export interface NormalizationConfig {
  lowercaseHostname: boolean;
  lowercasePath: boolean;
  trailingSlash: 'keep' | 'remove' | 'enforce';
  stripProtocol: boolean;
  stripWww: boolean;
  stripFragments: boolean;
  stripQueryParameters: boolean;
  decodePercentEncoding: boolean;
  deduplicateUrls: boolean;
}

export interface ConfidenceThresholds {
  veryStrongMin: number; // default 90
  strongMin: number;     // default 75
  needsReviewMin: number;// default 50
}

export interface ImportInvalidRow {
  line: number;
  rawText: string;
  reason: string;
}

export interface ImportResult {
  validUrls: NormalizedUrl[];
  invalidRows: ImportInvalidRow[];
  duplicates: Array<{ url: string; count: number }>;
  totalProcessed: number;
  sourceType: 'csv' | 'txt' | 'sitemap_xml' | 'paste';
  filename?: string;
}

export type ExportFormat = 
  | 'csv'
  | 'json'
  | 'markdown'
  | 'nextjs'
  | 'vercel'
  | 'netlify'
  | 'apache'
  | 'nginx';

export interface ExportOptions {
  format: ExportFormat;
  includeStatus: MappingStatus[];
  includeLowConfidenceWarnings: boolean;
  statusCode: 301 | 308 | 302;
  domainPrefixOld?: string;
  domainPrefixNew?: string;
}

export interface MigrationProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  oldUrls: NormalizedUrl[];
  newUrls: NormalizedUrl[];
  mappings: UrlMapping[];
  issues: MigrationIssue[];
  normalizationConfig: NormalizationConfig;
  thresholds: ConfidenceThresholds;
  oldInvalidRows: ImportInvalidRow[];
  newInvalidRows: ImportInvalidRow[];
  stage: 'imported' | 'analyzing' | 'reviewing' | 'validated' | 'ready_to_export';
}

export interface EngineProgress {
  stage: string;
  current: number;
  total: number;
  percentage: number;
}

export interface ProjectBackupFile {
  format: 'migrationmap_project_backup';
  version: 1;
  exportedAt: string;
  sourceApp: string;
  project: {
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
  };
}
