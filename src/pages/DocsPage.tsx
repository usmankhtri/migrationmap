/**
 * MigrationMap - Documentation Page
 * Technical guide to URL mapping, status codes, heuristics, and export formats.
 */

import React from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  AlertTriangle,
  Cpu,
  ShieldCheck,
  FileCode,
  Terminal,
  CheckCircle2,
} from 'lucide-react';

interface DocsPageProps {
  onNavigate: (path: string) => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <button
          onClick={() => onNavigate('/app')}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to workspace
        </button>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Documentation &amp; Technical Reference
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Reference guide for website URL migrations, deterministic candidate scoring,
          redirect validation, and deployment rules.
        </p>
      </div>

      {/* Section 1: What is URL Mapping? */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          1. What is URL mapping?
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          When redesigning or re-platforming a website, page paths change. A URL map pairs every legacy URL on your old site to the appropriate destination page on your modern site to prevent 404 errors and preserve organic search signals.
        </p>
      </section>

      {/* Section 2: Understanding HTTP Redirects */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          2. Understanding HTTP redirects (301 vs 302 vs 308)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-1">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">301 Moved Permanently</span>
            <p className="text-neutral-500 dark:text-neutral-400">
              The standard for SEO migrations. Instructs search crawlers that link signals pass fully to the destination.
            </p>
          </div>
          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-1">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">308 Permanent Redirect</span>
            <p className="text-neutral-500 dark:text-neutral-400">
              Preserves request method (POST/PUT/GET) according to HTTP/2 standards.
            </p>
          </div>
          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-1">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">302 Found (Temporary)</span>
            <p className="text-neutral-500 dark:text-neutral-400">
              Used for temporary maintenance or split tests. Does not transfer organic ranking signals.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Why Migrations Require Validation */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          3. Why migrations require redirect validation
        </h2>
        <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <p>
            Manual spreadsheet edits frequently introduce circular dependencies:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
            <li><strong>Redirect loops:</strong> URL A redirects to URL B, while URL B redirects back to URL A. Browsers crash with ERR_TOO_MANY_REDIRECTS.</li>
            <li><strong>Redirect chains:</strong> URL A &rarr; URL B &rarr; URL C. Each intermediate hop increases latency and risks crawling drop-off.</li>
            <li><strong>Self-redirects:</strong> URL A &rarr; URL A. Wastes server resources and crawl budget.</li>
          </ul>
        </div>
      </section>

      {/* Section 4: Deterministic Scoring */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          4. How deterministic confidence scoring works (11 Signals)
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          MigrationMap computes deterministic scores (0 to 100) using mathematical distance and lexical tokenization metrics:
        </p>
        <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-xs font-mono grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-700 dark:text-neutral-300">
          <div>1. Exact path equality (100%)</div>
          <div>2. Terminal slug equality</div>
          <div>3. Levenshtein slug distance</div>
          <div>4. Path segment alignment</div>
          <div>5. Jaccard keyword overlap</div>
          <div>6. Legacy extension drop (.html)</div>
          <div>7. Full path string edit distance</div>
          <div>8. Hierarchy depth penalty</div>
          <div>9. Numeric entity SKU ID match</div>
          <div>10. Token map inversion</div>
          <div>11. Directory shift translation</div>
        </div>
      </section>

      {/* Section 5: Local Storage & Privacy */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          5. Local storage and privacy model
        </h2>
        <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <p>
            Your migration data is stored locally in your browser using high-capacity IndexedDB (with LocalStorage/Cookie fallback). MigrationMap supports large-scale migrations of 50,000+ URLs completely in-browser without sending your URLs to external servers.
          </p>
          <p>
            Clearing this site&apos;s browsing data will remove your saved project. Always export your configuration rules to CSV, JSON, or framework format when completing your work.
          </p>
        </div>
      </section>

      {/* Section 6: Limitations */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          6. Product limitations
        </h2>
        <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          MigrationMap performs structural and topological analysis on provided URL datasets. It does not execute live network probes against production servers. Test all generated rules on a staging domain prior to DNS cutover.
        </div>
      </section>
    </div>
  );
};
