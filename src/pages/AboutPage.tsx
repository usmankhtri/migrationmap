/**
 * MigrationMap - About Page
 * Philosophy, mission, and transparent open-source foundation.
 */

import React from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
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
          About MigrationMap
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          MigrationMap focuses on making essential website migration workflows accessible without expensive software subscriptions.
        </p>
      </div>

      {/* Philosophy Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Philosophy
        </h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <p>
            Website migrations are one of the highest-risk moments in a business&apos;s digital presence.
            A broken redirect map or circular loop can eliminate organic search equity and break user bookmarks overnight.
          </p>
          <p>
            Historically, developers, freelancers, and agencies faced a frustrating choice:
            either pay monthly fees for enterprise SEO suites just to use a URL matcher,
            or manually correlate URLs in error-prone spreadsheets.
          </p>
          <p>
            MigrationMap was built to provide a modern, deterministic alternative:
            transparent multi-signal heuristics, directed graph cycle detection, and multi-platform redirect exports, running directly in the browser.
          </p>
        </div>
      </section>

      {/* Architectural Principles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Core principles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 space-y-1.5">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">Deterministic heuristics</span>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              No generative model hallucinations. Candidate scores are calculated using transparent mathematical distance and lexical tokenization metrics.
            </p>
          </div>

          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 space-y-1.5">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">Local browser execution</span>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Your staging URLs and private client data stay strictly on your device. Parsing, matching, and rule generation execute within your browser.
            </p>
          </div>

          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 space-y-1.5">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">Production-ready exports</span>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Syntactically verified configuration rules for Next.js, Vercel, Netlify, Apache, Nginx, CSV, and JSON.
            </p>
          </div>

          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 space-y-1.5">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">No paywalls or tracking</span>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Free to use, no signup forms, no export gating, and no advertising trackers.
            </p>
          </div>
        </div>
      </section>

      {/* Action banner */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Ready to start?</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Import your old and new URL lists to begin mapping.</p>
        </div>
        <button
          onClick={() => onNavigate('/app')}
          className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 px-3.5 py-2 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity shrink-0"
        >
          Open workspace
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

