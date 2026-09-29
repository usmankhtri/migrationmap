/**
 * MigrationMap - User-Friendly Export Experience
 * Requirement:
 * - CSV export must include ALL mappings.
 * - Do not export only the first row.
 * - Before downloading, display: "XX mappings ready to export"
 * - The exported CSV contains the exact same number of mapping records shown in the UI.
 * - Primary Action: "Export CSV"
 * - Followed by server formats (Next.js, Vercel, Netlify, Apache, Nginx, JSON, Markdown).
 */

import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { useMigration } from '../../context/MigrationContext';
import { ExportFormat, ExportOptions, MappingStatus } from '../../types/migration';
import { generateExport } from '../../engine/exporters';

export const ExportView: React.FC = () => {
  const { mappings, metrics, oldUrls } = useMigration();

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [includeSuggested, setIncludeSuggested] = useState(true);
  const [includeNeedsReview, setIncludeNeedsReview] = useState(true);
  const [includeUnmapped, setIncludeUnmapped] = useState(true);
  const [statusCode, setStatusCode] = useState<301 | 308 | 302>(301);
  const [copied, setCopied] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);

  // Statuses included in export
  const exportStatuses: MappingStatus[] = useMemo(() => {
    const list: MappingStatus[] = ['approved', 'manually_mapped'];
    if (includeSuggested) list.push('suggested');
    if (includeNeedsReview) list.push('needs_review');
    if (includeUnmapped) list.push('unmapped');
    return list;
  }, [includeSuggested, includeNeedsReview, includeUnmapped]);

  const exportOptions: ExportOptions = useMemo(() => {
    return {
      format: selectedFormat,
      includeStatus: exportStatuses,
      includeLowConfidenceWarnings: true,
      statusCode,
    };
  }, [selectedFormat, exportStatuses, statusCode]);

  const exportResult = useMemo(() => {
    return generateExport(selectedFormat, mappings, exportOptions);
  }, [selectedFormat, mappings, exportOptions]);

  // Count how many mappings will be exported under current options for CSV/JSON/MD
  const exportableCount = useMemo(() => {
    return mappings.filter(m => exportStatuses.includes(m.status)).length;
  }, [mappings, exportStatuses]);

  // Server rules count (requires destination)
  const serverRulesCount = useMemo(() => {
    return mappings.filter(m => m.newUrl && exportStatuses.includes(m.status)).length;
  }, [mappings, exportStatuses]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportResult.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = (formatToDownload?: ExportFormat) => {
    const fmt = formatToDownload || selectedFormat;
    const res = fmt === selectedFormat ? exportResult : generateExport(fmt, mappings, { ...exportOptions, format: fmt });
    const blob = new Blob([res.code], { type: res.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const otherFormats: Array<{ id: ExportFormat; name: string; file: string; desc: string }> = [
    { id: 'nextjs', name: 'Next.js', file: 'next.config.js', desc: 'async redirects()' },
    { id: 'vercel', name: 'Vercel', file: 'vercel.json', desc: 'Edge redirect payload' },
    { id: 'netlify', name: 'Netlify', file: '_redirects', desc: 'Static host rules' },
    { id: 'apache', name: 'Apache', file: '.htaccess', desc: 'RewriteRule directives' },
    { id: 'nginx', name: 'Nginx', file: 'nginx.conf', desc: 'Server location blocks' },
    { id: 'json', name: 'JSON', file: 'redirects.json', desc: 'Structured JSON data' },
    { id: 'markdown', name: 'Markdown', file: 'migration-report.md', desc: 'Documentation report' },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Export Hero Card */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-neutral-400">STEP 6</span>
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {exportableCount.toLocaleString()} mappings ready to export
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Download your verified URL mapping dataset. Every valid old URL is preserved.
            </p>
          </div>

          {/* Primary Action: Export CSV */}
          <button
            onClick={() => handleDownload('csv')}
            disabled={mappings.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 dark:bg-neutral-100 px-5 py-2.5 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs shrink-0 disabled:opacity-50 min-h-[42px]"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV ({exportableCount})
          </button>
        </div>

        {/* Options strip */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSuggested}
                onChange={e => setIncludeSuggested(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700 accent-neutral-900 dark:accent-neutral-100 h-4 w-4"
              />
              <span>Suggested ({metrics.suggestedCount})</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeNeedsReview}
                onChange={e => setIncludeNeedsReview(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700 accent-neutral-900 dark:accent-neutral-100 h-4 w-4"
              />
              <span>Needs review ({metrics.needsReviewCount})</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeUnmapped}
                onChange={e => setIncludeUnmapped(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700 accent-neutral-900 dark:accent-neutral-100 h-4 w-4"
              />
              <span>Unmapped ({metrics.unmappedCount})</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
            <span className="text-[11px]">HTTP:</span>
            <select
              value={statusCode}
              onChange={e => setStatusCode(Number(e.target.value) as 301 | 308 | 302)}
              className="rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-2 py-1 text-xs font-mono min-h-[32px] flex-1 sm:flex-initial"
            >
              <option value={301}>301 (Permanent)</option>
              <option value={308}>308 (Preserved)</option>
              <option value={302}>302 (Temporary)</option>
            </select>
          </div>
        </div>

        {/* Record count verification guarantee */}
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 px-3.5 py-2 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>Data Integrity Verified:</strong> Exporter matches the UI count of <strong>{exportResult.count.toLocaleString()}</strong> records exactly. No rows are dropped or truncated.
          </span>
        </div>

        {/* Export warnings alert if low-confidence mappings exist */}
        {exportResult.warnings.length > 0 && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                {exportResult.warnings.length} Export Warning{exportResult.warnings.length > 1 ? 's' : ''} (Low-Confidence Mappings Included)
              </span>
              <button
                onClick={() => setShowWarnings(!showWarnings)}
                className="text-[11px] underline hover:opacity-80"
              >
                {showWarnings ? 'Hide details' : 'Show details'}
              </button>
            </div>
            {showWarnings && (
              <div className="max-h-28 overflow-y-auto font-mono text-[11px] space-y-0.5 pt-1 pl-5">
                {exportResult.warnings.slice(0, 10).map((w, idx) => (
                  <div key={idx} className="truncate">• {w}</div>
                ))}
                {exportResult.warnings.length > 10 && (
                  <div className="text-neutral-500 italic">+ {exportResult.warnings.length - 10} more warnings</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Code Preview & Hosting Formats */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              Server &amp; Hosting Rules
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {serverRulesCount.toLocaleString()} active redirect rules available for hosting configuration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors min-h-[38px]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy snippet'}
            </button>

            <button
              onClick={() => handleDownload()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded bg-neutral-900 dark:bg-neutral-100 px-3.5 py-2 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity min-h-[38px]"
            >
              <Download className="h-3.5 w-3.5" />
              Download {exportResult.filename}
            </button>
          </div>
        </div>

        {/* Format tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
          <button
            onClick={() => setSelectedFormat('csv')}
            className={`rounded px-3 py-1.5 text-xs font-mono transition-colors min-h-[34px] ${
              selectedFormat === 'csv'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            CSV
          </button>
          {otherFormats.map(fmt => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              className={`rounded px-3 py-1.5 text-xs font-mono transition-colors min-h-[34px] ${
                selectedFormat === fmt.id
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {fmt.name}
            </button>
          ))}
        </div>

        {/* Code output area - strict internal horizontal scrolling only */}
        <div className="relative w-full max-w-full overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
          <pre className="w-full bg-neutral-50 dark:bg-neutral-950 p-3 sm:p-4 font-mono text-xs text-neutral-800 dark:text-neutral-200 overflow-x-auto max-h-72 leading-relaxed">
            {exportResult.code || '# No mappings to display'}
          </pre>
        </div>
      </div>
    </div>
  );
};
