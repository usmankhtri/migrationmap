/**
 * MigrationMap - Minimalist SaaS Landing Page
 * Clean, restrained, Poppins typography, subtle monochrome aesthetic.
 */

import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Layers,
  Check,
  FileCode,
  ArrowRightLeft,
  ChevronRight,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useMigration } from '../context/MigrationContext';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { startMigration } = useMigration();

  const handleStartMigration = () => {
    startMigration();
    onNavigate('/app');
  };

  return (
    <div className="space-y-20 pb-20 pt-8 sm:pt-14">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <span>Browser-side URL matching and redirect doctor</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.15]">
          Website migration, <br className="hidden sm:inline" />
          without the busywork.
        </h1>

        <p className="mx-auto max-w-xl text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal">
          Map old URLs, review redirects, and export migration rules in minutes.
          Deterministic matching running locally in your browser.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={handleStartMigration}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 dark:bg-neutral-100 px-5 py-2.5 text-xs font-medium text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Start a migration
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onNavigate('/docs')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors"
          >
            View documentation
          </button>
        </div>

        {/* Minimal feature list */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" /> Free to use
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" /> No signup required
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" /> Runs locally in browser
          </span>
        </div>
      </section>

      {/* 6-Step Workflow Section */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
          <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-neutral-50/70 dark:bg-neutral-950/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              6-Step Migration Workflow
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Deterministic &bull; Local &bull; Accurate
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1.5">
              <span className="font-mono text-[11px] text-neutral-400 font-semibold block">STEP 1</span>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Import Old URLs</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Upload your legacy crawl or sitemap (CSV, TXT, XML) with automatic encoding cleanup.
              </p>
            </div>

            <div className="p-3.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1.5">
              <span className="font-mono text-[11px] text-neutral-400 font-semibold block">STEP 2</span>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Import New URLs</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Add the destination URLs from your new site architecture or staging build.
              </p>
            </div>

            <div className="p-3.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1.5">
              <span className="font-mono text-[11px] text-neutral-400 font-semibold block">STEP 3</span>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Run Matching</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Score candidate pairs using exact paths, slug tokens, prefix clusters, and mathematical distance.
              </p>
            </div>

            <div className="p-3.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1.5">
              <span className="font-mono text-[11px] text-neutral-400 font-semibold block">STEP 4</span>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Review Mappings</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Inspect confidence tiers, approve suggested matches, or manually pick alternative destinations.
              </p>
            </div>

            <div className="p-3.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1.5">
              <span className="font-mono text-[11px] text-neutral-400 font-semibold block">STEP 5</span>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Fix Issues</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Detect circular loops, multi-hop chains, self-redirects, and unmapped orphan URLs before launching.
              </p>
            </div>

            <div className="p-3.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1.5">
              <span className="font-mono text-[11px] text-neutral-400 font-semibold block">STEP 6</span>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Export Redirects</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Download verified redirect configurations for Next.js, Vercel, Netlify, Apache, Nginx, or CSV.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Value Grid */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Deterministic scoring
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Transparent, repeatable matching based on exact paths, slug tokens, prefix clusters, and Levenshtein distance.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
              <FileCode className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Direct server exports
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Export ready-to-commit code for Next.js, Vercel, Netlify, Apache .htaccess, Nginx, and standard CSV format.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              100% browser-side privacy
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Staging URLs and client data are parsed and scored directly in your browser. Data is never uploaded to remote servers.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Ready to map your website migration?
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Import your old and new URL lists to begin. No account or payment required.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={handleStartMigration}
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
            >
              Start a migration
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
