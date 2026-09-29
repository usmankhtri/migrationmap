/**
 * MigrationMap - User-Friendly Issue Detector View
 * Groups issues into 5 understandable categories:
 * - Needs review
 * - Redirect problems
 * - Duplicate URLs
 * - Unmapped URLs
 * - Invalid URLs
 * Displays for each issue: What happened, Why it matters, What the user can do.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { useMigration } from '../../context/MigrationContext';
import { MigrationIssue, IssueType } from '../../types/migration';

type IssueCategory = 'all' | 'needs_review' | 'redirect_problems' | 'duplicate_urls' | 'unmapped_urls' | 'invalid_urls';

export const IssueDetectorView: React.FC = () => {
  const {
    issues,
    updateMappingDestination,
    setActiveTab,
    setCurrentStep,
    oldInvalidRows,
    newInvalidRows,
  } = useMigration();

  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>('all');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleDownloadReport = () => {
    const report = {
      title: 'MigrationMap - Redirect Validation & Health Report',
      generatedAt: new Date().toISOString(),
      totalIssues: issues.length,
      criticalErrors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      issues: issues.map(i => ({
        id: i.id,
        type: i.type,
        severity: i.severity,
        title: i.title,
        description: i.description,
        recommendation: i.recommendation,
        affectedCount: i.affectedUrls.length,
        affectedUrls: i.affectedUrls,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-validation-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = async () => {
    const errCount = issues.filter(i => i.severity === 'error').length;
    const warnCount = issues.filter(i => i.severity === 'warning').length;
    const summaryText = [
      `MigrationMap Validation Summary:`,
      `- Total Issues: ${issues.length}`,
      `- Critical Errors: ${errCount}`,
      `- Warnings: ${warnCount}`,
      ...issues.map(i => `• [${i.severity.toUpperCase()}] ${i.title}: ${i.description}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {}
  };

  // Group issue types into user-friendly categories
  const getIssueCategory = (type: IssueType): IssueCategory => {
    switch (type) {
      case 'redirect_loop':
      case 'redirect_chain':
      case 'self_redirect':
        return 'redirect_problems';
      case 'duplicate_destination':
      case 'high_fan_in':
      case 'duplicate_source':
        return 'duplicate_urls';
      case 'unmapped_url':
      case 'empty_destination':
        return 'unmapped_urls';
      case 'invalid_destination':
        return 'invalid_urls';
      case 'low_confidence':
      case 'protocol_mismatch':
      case 'www_mismatch':
      case 'trailing_slash_mismatch':
      default:
        return 'needs_review';
    }
  };

  const getCategoryLabel = (cat: IssueCategory): string => {
    switch (cat) {
      case 'needs_review':
        return 'Needs review';
      case 'redirect_problems':
        return 'Redirect problems';
      case 'duplicate_urls':
        return 'Duplicate URLs';
      case 'unmapped_urls':
        return 'Unmapped URLs';
      case 'invalid_urls':
        return 'Invalid URLs';
      case 'all':
      default:
        return 'All issues';
    }
  };

  // Human-friendly "Why it matters" and "What you can do" generator
  const getIssueDetails = (issue: MigrationIssue) => {
    switch (issue.type) {
      case 'redirect_loop':
        return {
          whatHappened: 'Two or more URLs redirect back to each other in an infinite cycle.',
          whyItMatters: 'Visitors and search crawlers will see an ERR_TOO_MANY_REDIRECTS error and cannot access the page.',
          whatYouCanDo: 'Assign the final target destination URL directly to break the loop.',
        };
      case 'redirect_chain':
        return {
          whatHappened: 'A URL redirects to a path that subsequently redirects to another destination.',
          whyItMatters: 'Each additional hop slows down page speed and dilutes SEO ranking equity.',
          whatYouCanDo: 'Point the original legacy URL directly to the final landing URL in a single 301 hop.',
        };
      case 'self_redirect':
        return {
          whatHappened: 'The old URL redirects to the exact same URL.',
          whyItMatters: 'Pointless redirect overhead that can trigger browser warnings and wasted crawl budget.',
          whatYouCanDo: 'Remove the destination or map it to a distinct new URL.',
        };
      case 'duplicate_destination':
      case 'high_fan_in':
        return {
          whatHappened: 'Multiple distinct old URLs redirect to the exact same destination page.',
          whyItMatters: 'Acceptable for merged categories, but can accidentally canonicalize separate products into one.',
          whatYouCanDo: 'Verify if these pages should truly merge, or assign specific new pages for each.',
        };
      case 'duplicate_source':
        return {
          whatHappened: 'The same source URL has conflicting or duplicate mapping entries.',
          whyItMatters: 'Web servers cannot determine which redirect rule takes precedence and may serve unpredictable destinations.',
          whatYouCanDo: 'Review the conflicting entries in the mapping table and assign one unambiguous destination.',
        };
      case 'protocol_mismatch':
        return {
          whatHappened: 'The source and destination URLs switch between HTTP and HTTPS protocols.',
          whyItMatters: 'Downgrading to HTTP degrades security, while an accidental protocol shift can break SSL policies.',
          whatYouCanDo: 'Ensure modern destination URLs standardize on secure HTTPS.',
        };
      case 'www_mismatch':
        return {
          whatHappened: 'The source and destination URLs have differing www subdomain configurations.',
          whyItMatters: 'Can cause unnecessary secondary redirect hops if your host enforces canonical www or non-www.',
          whatYouCanDo: 'Standardize destination domains to match your target server canonical rules.',
        };
      case 'trailing_slash_mismatch':
        return {
          whatHappened: 'Trailing slashes differ between source and destination URLs.',
          whyItMatters: 'Can trigger an extra hop on frameworks that enforce strict slash conventions.',
          whatYouCanDo: 'Align trailing slashes according to your destination web framework guidelines.',
        };
      case 'unmapped_url':
      case 'empty_destination':
        return {
          whatHappened: 'This old URL does not have a new destination assigned.',
          whyItMatters: 'Users and backlinks pointing to this old URL will land on a 404 Not Found error.',
          whatYouCanDo: 'Select a matching destination in the review table, or leave as 410 Gone if obsolete.',
        };
      case 'invalid_destination':
        return {
          whatHappened: 'The destination URL contains invalid syntax, disallowed protocols, or broken characters.',
          whyItMatters: 'Server web configurations will fail to compile or will redirect visitors to invalid addresses.',
          whatYouCanDo: 'Correct the destination URL format to a valid absolute or relative path.',
        };
      case 'low_confidence':
      default:
        return {
          whatHappened: issue.description || 'Candidate score is below the high confidence threshold.',
          whyItMatters: 'Automatic match may not match user intent or product line.',
          whatYouCanDo: 'Inspect the suggested URL and click Approve or Edit.',
        };
    }
  };

  const filteredIssues = issues.filter(i => {
    if (selectedCategory === 'all') return true;
    return getIssueCategory(i.type) === selectedCategory;
  });

  const categoryCounts: Record<IssueCategory, number> = {
    all: issues.length,
    needs_review: issues.filter(i => getIssueCategory(i.type) === 'needs_review').length,
    redirect_problems: issues.filter(i => getIssueCategory(i.type) === 'redirect_problems').length,
    duplicate_urls: issues.filter(i => getIssueCategory(i.type) === 'duplicate_urls').length,
    unmapped_urls: issues.filter(i => getIssueCategory(i.type) === 'unmapped_urls').length,
    invalid_urls: issues.filter(i => getIssueCategory(i.type) === 'invalid_urls').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Fix Issues
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Resolve redirect problems and review questionable mappings before launching.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {issues.length > 0 && (
            <>
              <button
                onClick={handleCopySummary}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors min-h-[38px]"
                title="Copy validation summary to clipboard"
              >
                {copiedSummary ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSummary ? 'Copied' : 'Copy summary'}</span>
              </button>

              <button
                onClick={handleDownloadReport}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors min-h-[38px]"
                title="Download complete validation report as JSON"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download report</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              setCurrentStep(6);
              setActiveTab('exports');
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 transition-opacity min-h-[38px]"
          >
            Proceed to export
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Category Pills (Requirement #17) */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'needs_review', 'redirect_problems', 'duplicate_urls', 'unmapped_urls', 'invalid_urls'] as IssueCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            {getCategoryLabel(cat)} ({categoryCounts[cat]})
          </button>
        ))}
      </div>

      {/* Issues List or Clean State */}
      {filteredIssues.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              No issues in this category
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              Your mappings pass all checks for loops, chains, and integrity.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setCurrentStep(6);
                setActiveTab('exports');
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90"
            >
              Export redirects
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map(issue => {
            const isExpanded = expandedIssueId === issue.id;
            const details = getIssueDetails(issue);

            return (
              <div
                key={issue.id}
                className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs"
              >
                {/* Issue Summary Header */}
                <div
                  onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3 cursor-pointer select-none hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold ${
                          issue.severity === 'error'
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                            : 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-[11px] font-medium text-neutral-400">
                        {getCategoryLabel(getIssueCategory(issue.type))}
                      </span>
                      <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 break-words">
                        {issue.title}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {details.whatHappened}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-neutral-500 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                    <span className="font-mono text-[11px]">
                      {issue.affectedUrls.length} affected
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* Expanded Details: What Happened, Why It Matters, What The User Can Do (Requirement #17) */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800 p-3.5 sm:p-4 space-y-4 bg-neutral-50/50 dark:bg-neutral-950/50 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* What happened */}
                      <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block text-[11px]">
                          What happened
                        </span>
                        <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                          {details.whatHappened}
                        </p>
                      </div>

                      {/* Why it matters */}
                      <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block text-[11px]">
                          Why it matters
                        </span>
                        <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                          {details.whyItMatters}
                        </p>
                      </div>

                      {/* What you can do */}
                      <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block text-[11px]">
                          What you can do
                        </span>
                        <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                          {details.whatYouCanDo}
                        </p>
                      </div>
                    </div>

                    {/* Affected URLs list */}
                    <div className="space-y-1.5">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300 block text-[11px]">
                        Affected URLs ({issue.affectedUrls.length}):
                      </span>
                      <div className="max-h-48 overflow-y-auto rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
                        {issue.affectedUrls.map((urlStr, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 font-mono text-[11px] text-neutral-800 dark:text-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                          >
                            <span className="break-all select-all leading-snug">{urlStr}</span>
                            {issue.type === 'self_redirect' && issue.affectedMappingIds[idx] && (
                              <button
                                onClick={() => updateMappingDestination(issue.affectedMappingIds[idx], null)}
                                className="self-end sm:self-auto rounded border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 text-[10px] font-sans hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0 min-h-[28px]"
                              >
                                Fix
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setCurrentStep(4);
                          setActiveTab('mappings');
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 min-h-[38px]"
                      >
                        Inspect in review table
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
