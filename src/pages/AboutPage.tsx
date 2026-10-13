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
      <div className="space-y-2 border-b border-neutral-200/80 dark:border-white/[0.08] pb-6">
        <button
          onClick={() => onNavigate('/app')}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to workspace
        </button>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          About MigrationMap
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          MigrationMap focuses on making essential website migration workflows accessible without expensive software subscriptions.
        </p>
      </div>

      {/* Philosophy Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Philosophy
        </h2>
        <div className="rounded-xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111215] p-5 space-y-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed shadow-xs">
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
        <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px] text-blue-600 dark:text-blue-400">
          Engineering principles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="rounded-3xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#191c22]/85 backdrop-blur-xl p-5 space-y-1.5 shadow-xs">
            <span className="font-bold text-neutral-900 dark:text-white block text-sm">Deterministic heuristics</span>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              No generative model hallucinations. Candidate scores are calculated using transparent mathematical distance and lexical tokenization metrics.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#191c22]/85 backdrop-blur-xl p-5 space-y-1.5 shadow-xs">
            <span className="font-bold text-neutral-900 dark:text-white block text-sm">Local browser execution</span>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Your staging URLs and private client data stay strictly on your device. Parsing, matching, and rule generation execute within your browser.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#191c22]/85 backdrop-blur-xl p-5 space-y-1.5 shadow-xs">
            <span className="font-bold text-neutral-900 dark:text-white block text-sm">Production-ready exports</span>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Syntactically verified configuration rules for Next.js, Vercel, Netlify, Apache, Nginx, CSV, and JSON.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#191c22]/85 backdrop-blur-xl p-5 space-y-1.5 shadow-xs">
            <span className="font-bold text-neutral-900 dark:text-white block text-sm">No paywalls or tracking</span>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Free to use, no signup forms, no export gating, and no advertising trackers.
            </p>
          </div>
        </div>
      </section>



      {/* Action banner */}
      <div className="rounded-3xl border border-neutral-200/90 dark:border-white/[0.1] bg-white/80 dark:bg-[#191c22]/90 backdrop-blur-xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Ready to start?</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">Import your old and new URL lists to begin mapping.</p>
        </div>
        <button
          onClick={() => onNavigate('/app')}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-6 py-2.5 text-xs font-semibold text-white dark:text-neutral-950 transition-all shadow-xs shrink-0 min-h-[40px] active:scale-[0.98]"
        >
          <span>Open workspace</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

