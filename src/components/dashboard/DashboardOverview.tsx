/**
 * MigrationMap - Dashboard Overview Component
 * Minimalist, restrained metrics, coverage progress, and health summary.
 */

import React from 'react';
import {
  ArrowRight,
  TrendingUp,
  Sparkles,
  ArrowRightLeft,
  AlertTriangle,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { useMigration } from '../../context/MigrationContext';

export const DashboardOverview: React.FC = () => {
  const { metrics, issues, setActiveTab, oldUrls, newUrls, mappings, runAnalysis, isAnalyzing } = useMigration();

  const highPct = metrics.totalOld > 0 ? Math.round((metrics.highConfidenceCount / metrics.totalOld) * 100) : 0;
  const medPct = metrics.totalOld > 0 ? Math.round((metrics.mediumConfidenceCount / metrics.totalOld) * 100) : 0;
  const lowPct = metrics.totalOld > 0 ? Math.round((metrics.lowConfidenceCount / metrics.totalOld) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Run matching callout if URLs are imported but matching hasn't run yet */}
      {oldUrls.length > 0 && mappings.length === 0 && (
        <div className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Datasets loaded: {oldUrls.length.toLocaleString()} source URLs &bull; {newUrls.length.toLocaleString()} destination URLs
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Run deterministic matching to score candidate pairings and detect redirect issues.
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 min-h-[38px]"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run matching engine'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">Total Old URLs</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.totalOld.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500 truncate">Source dataset</div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">Total New URLs</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.totalNew.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500 truncate">Destination dataset</div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">Suggested</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.suggestedCount.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500 truncate">Auto-matched</div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">Approved</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.approvedCount.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500 truncate">Ready to ship</div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">Needs Review</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.needsReviewCount.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500 truncate">Review recommended</div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">Migration Issues</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.totalIssuesCount.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
            {metrics.errorIssuesCount > 0 ? `${metrics.errorIssuesCount} critical` : 'Checks clean'}
          </div>
        </div>
      </div>

      {/* Coverage & Confidence Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Mapping Coverage */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Mapping coverage
            </h3>
            <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {metrics.coveragePercent}%
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {metrics.mappedCount} of {metrics.totalOld} legacy URLs have assigned destinations.
          </p>

          {/* Minimal progress bar */}
          <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex">
            <div
              className="bg-neutral-900 dark:bg-white transition-all duration-300"
              style={{ width: `${metrics.totalOld > 0 ? (metrics.approvedCount / metrics.totalOld) * 100 : 0}%` }}
              title={`Approved: ${metrics.approvedCount}`}
            />
            <div
              className="bg-neutral-500 dark:bg-neutral-400 transition-all duration-300"
              style={{ width: `${metrics.totalOld > 0 ? (metrics.suggestedCount / metrics.totalOld) * 100 : 0}%` }}
              title={`Suggested: ${metrics.suggestedCount}`}
            />
            <div
              className="bg-neutral-300 dark:bg-neutral-600 transition-all duration-300"
              style={{ width: `${metrics.totalOld > 0 ? (metrics.needsReviewCount / metrics.totalOld) * 100 : 0}%` }}
              title={`Needs Review: ${metrics.needsReviewCount}`}
            />
          </div>

          {/* Clean Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white inline-block" />
              Approved ({metrics.approvedCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-500 dark:bg-neutral-400 inline-block" />
              Suggested ({metrics.suggestedCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-600 inline-block" />
              Needs review ({metrics.needsReviewCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 inline-block" />
              Unmapped ({metrics.unmappedCount})
            </span>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Confidence distribution
            </h3>
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              Deterministic score
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Calculated across path alignment, slug distance, entity IDs, and keyword tokens.
          </p>

          <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex">
            <div
              className="bg-neutral-800 dark:bg-neutral-200 transition-all duration-300"
              style={{ width: `${highPct}%` }}
              title={`High: ${metrics.highConfidenceCount}`}
            />
            <div
              className="bg-neutral-400 dark:bg-neutral-500 transition-all duration-300"
              style={{ width: `${medPct}%` }}
              title={`Medium: ${metrics.mediumConfidenceCount}`}
            />
            <div
              className="bg-neutral-200 dark:bg-neutral-700 transition-all duration-300"
              style={{ width: `${lowPct}%` }}
              title={`Low: ${metrics.lowConfidenceCount}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="rounded border border-neutral-200 dark:border-neutral-800 p-2 text-center">
              <div className="text-xs font-semibold font-mono text-neutral-900 dark:text-neutral-100">
                {metrics.highConfidenceCount}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">High (&ge;90%)</div>
            </div>
            <div className="rounded border border-neutral-200 dark:border-neutral-800 p-2 text-center">
              <div className="text-xs font-semibold font-mono text-neutral-900 dark:text-neutral-100">
                {metrics.mediumConfidenceCount}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Medium (50-89%)</div>
            </div>
            <div className="rounded border border-neutral-200 dark:border-neutral-800 p-2 text-center">
              <div className="text-xs font-semibold font-mono text-neutral-900 dark:text-neutral-100">
                {metrics.lowConfidenceCount}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Low (&lt;50%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Notification if any */}
      {issues.length > 0 && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {issues.length} migration issue{issues.length > 1 ? 's' : ''} require attention
              </span>
            </div>
            <button
              onClick={() => setActiveTab('issues')}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Inspect issues
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {issues.slice(0, 3).map(issue => (
              <div
                key={issue.id}
                className="rounded border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 p-2.5 space-y-1 text-xs"
              >
                <div className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                  <span>{issue.title}</span>
                  <span className="text-[10px] font-mono text-neutral-400">{issue.severity}</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {issue.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('mappings')}
          className="group rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-left hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Review mappings table
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Inspect suggested pairs, edit destinations, and bulk approve redirect rules.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className="group rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-left hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Migration health checks
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Identify circular loops, chains, self-redirects, and unmapped URLs.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('exports')}
          className="group rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-left hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Export redirect rules
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Generate rules for Next.js, Vercel, Netlify, Apache .htaccess, Nginx, or CSV.
          </p>
        </button>
      </div>
    </div>
  );
};
