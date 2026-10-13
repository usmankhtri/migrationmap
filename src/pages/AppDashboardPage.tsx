/**
 * MigrationMap v1.2 - Main Application Workspace
 * Linear/Vercel dark-first minimalist interface with 6-step guided workflow.
 */

import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  Upload,
  Sliders,
  AlertTriangle,
  Play,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { useMigration, WorkflowStep } from '../context/MigrationContext';
import { ImportWizard } from '../components/dashboard/ImportWizard';
import { MappingReviewTable } from '../components/dashboard/MappingReviewTable';
import { IssueDetectorView } from '../components/dashboard/IssueDetectorView';
import { ExportView } from '../components/dashboard/ExportView';
import { SettingsView } from '../components/dashboard/SettingsView';
import { normalizeUrl, DEFAULT_NORMALIZATION_CONFIG } from '../utils/url';

const DEMO_OLD_URLS = [
  'https://oldsite.com/',
  'https://oldsite.com/about-us',
  'https://oldsite.com/contact-us',
  'https://oldsite.com/blog/2023/seo-migration-guide',
  'https://oldsite.com/blog/2023/migrating-wordpress-to-nextjs',
  'https://oldsite.com/products/classic-leather-wallet',
  'https://oldsite.com/products/canvas-weekender-bag',
  'https://oldsite.com/products/polarized-sunglasses',
  'https://oldsite.com/categories/accessories',
  'https://oldsite.com/pricing',
  'https://oldsite.com/faq',
  'https://oldsite.com/terms-and-conditions',
];

const DEMO_NEW_URLS = [
  'https://newsite.com/',
  'https://newsite.com/about',
  'https://newsite.com/contact',
  'https://newsite.com/posts/seo-migration-guide',
  'https://newsite.com/posts/migrating-wordpress-to-nextjs',
  'https://newsite.com/shop/classic-leather-wallet',
  'https://newsite.com/shop/canvas-weekender-bag',
  'https://newsite.com/shop/polarized-sunglasses',
  'https://newsite.com/shop/accessories',
  'https://newsite.com/pricing',
  'https://newsite.com/support/faq',
  'https://newsite.com/legal/terms',
];

export const AppDashboardPage: React.FC = () => {
  const {
    oldUrls,
    newUrls,
    mappings,
    metrics,
    currentStep,
    setCurrentStep,
    runAnalysis,
    isAnalyzing,
    progress,
    hasStarted,
    startMigration,
    importBothUrls,
    storageStatus,
    storageWarningDismissed,
    dismissStorageWarning,
  } = useMigration();

  const [showSettings, setShowSettings] = useState(false);

  const handleLoadDemoDataset = () => {
    const parsedOld = DEMO_OLD_URLS.map(u => normalizeUrl(u, DEFAULT_NORMALIZATION_CONFIG));
    const parsedNew = DEMO_NEW_URLS.map(u => normalizeUrl(u, DEFAULT_NORMALIZATION_CONFIG));
    importBothUrls(parsedOld, parsedNew);
    startMigration();
    setCurrentStep(3);
  };

  // Requirement #3: Clean Empty First Experience
  if (!hasStarted && oldUrls.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10 backdrop-blur-md text-blue-600 dark:text-blue-400 shadow-sm">
          <ArrowRightLeft className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Start a migration
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Import your old and new URL lists to map paths, resolve redirect chains, and export deployment rules.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={startMigration}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-6 py-3 text-xs font-semibold text-white dark:text-neutral-950 transition-all shadow-md active:scale-[0.98] min-h-[44px]"
          >
            <Upload className="h-4 w-4" />
            Import your URLs
          </button>
          <button
            onClick={handleLoadDemoDataset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300/80 dark:border-white/15 bg-white/80 dark:bg-[#191c22]/80 backdrop-blur-md px-5 py-3 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-all shadow-xs min-h-[44px] active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Try demo dataset
          </button>
        </div>

        <div className="pt-10 border-t border-neutral-200/80 dark:border-white/[0.08] max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold block">1. IMPORT</span>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
              Add legacy URLs and modern destination paths.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold block">2. MATCH &amp; REVIEW</span>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
              Deterministic scoring and cycle checking.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold block">3. EXPORT</span>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
              Export verified rules for Next.js, Vercel, or Nginx.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determine completion of steps
  const stepCompleted = {
    1: oldUrls.length > 0,
    2: newUrls.length > 0,
    3: mappings.length > 0,
    4: mappings.length > 0,
    5: mappings.length > 0 && metrics.errorIssuesCount === 0,
    6: mappings.length > 0,
  };

  const steps: Array<{
    number: WorkflowStep;
    title: string;
    completed: boolean;
  }> = [
    { number: 1, title: 'Import Old URLs', completed: stepCompleted[1] },
    { number: 2, title: 'Import New URLs', completed: stepCompleted[2] },
    { number: 3, title: 'Run Matching', completed: stepCompleted[3] },
    { number: 4, title: 'Review Mappings', completed: stepCompleted[4] },
    { number: 5, title: 'Fix Issues', completed: stepCompleted[5] },
    { number: 6, title: 'Export Redirects', completed: stepCompleted[6] },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Storage Alert (if storage limit reached) */}
      {storageStatus === 'oversized' && !storageWarningDismissed && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-neutral-900 dark:text-amber-200">
                Browser storage limit reached for this session.
              </span>
              <p className="text-neutral-600 dark:text-amber-300/80">
                All URL matching, validation, and calculations continue actively in memory. Make sure to export your redirect rules when done.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentStep(6)}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 font-semibold transition-all"
            >
              Export now
            </button>
            <button
              onClick={dismissStorageWarning}
              className="rounded-full border border-neutral-300 dark:border-white/10 px-3 py-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-white/50"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 6-STEP WORKFLOW BAR (Google Material Design 3) */}
      <div className="rounded-3xl border border-neutral-200/90 dark:border-white/[0.09] bg-white/80 dark:bg-[#191c22]/90 backdrop-blur-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/[0.06] pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Migration Workflow
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
              Step {currentStep} of 6
            </span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors py-1.5 px-3 rounded-full ${
              showSettings
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{showSettings ? 'Hide settings' : 'Settings'}</span>
          </button>
        </div>

        {/* Responsive Step Progress Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map(step => {
            const isActive = currentStep === step.number && !showSettings;
            const isDone = step.completed;

            return (
              <button
                key={step.number}
                onClick={() => {
                  setShowSettings(false);
                  setCurrentStep(step.number);
                }}
                className={`flex items-center gap-2.5 rounded-2xl p-2.5 sm:p-3 text-left transition-all min-h-[48px] ${
                  isActive
                    ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-neutral-950 font-bold shadow-sm'
                    : isDone
                    ? 'bg-neutral-100/80 dark:bg-white/[0.05] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-white/[0.08]'
                    : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-white/[0.03] hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-mono font-bold transition-colors ${
                    isActive
                      ? 'bg-white text-blue-600 dark:bg-neutral-950 dark:text-blue-400'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'border border-neutral-300 dark:border-white/10 text-neutral-400'
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : step.number}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs truncate font-medium">
                    {step.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Workspace Content */}
      {showSettings ? (
        <SettingsView />
      ) : (
        <>
          {/* STEP 1 or STEP 2: Import */}
          {(currentStep === 1 || currentStep === 2) && (
            <ImportWizard />
          )}

          {/* STEP 3: Run Matching */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Guidance card */}
              <div className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#111215]/75 backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-neutral-400">STEP 3</span>
                    <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white">
                      Deterministic Matching Engine
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Compares legacy URLs against destination URLs using multi-stage heuristics: exact path normalization, slug token overlap, prefix cluster analysis, and Levenshtein distance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-neutral-200/60 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-[#0c0d10]/50 backdrop-blur-md p-3.5 flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Old URLs (source)</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                      {oldUrls.length.toLocaleString()} URLs
                    </span>
                  </div>
                  <div className="rounded-xl border border-neutral-200/60 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-[#0c0d10]/50 backdrop-blur-md p-3.5 flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">New URLs (destinations)</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                      {newUrls.length.toLocaleString()} URLs
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[42px] shadow-xs"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="h-3 w-3 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin" />
                        <span>{progress?.stage || 'Running matching engine...'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>{mappings.length > 0 ? 'Re-run matching engine' : 'Run matching engine'}</span>
                      </>
                    )}
                  </button>

                  {mappings.length > 0 && (
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-[#111215]/75 backdrop-blur-md px-4 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-white/[0.08] transition-all min-h-[42px] active:scale-[0.98]"
                    >
                      <span>Go to Review Mappings</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* If mappings already exist, also show preview table */}
              {mappings.length > 0 && <MappingReviewTable />}
            </div>
          )}

          {/* STEP 4: Review Mappings */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white">
                    Review Mappings
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Review candidate pairs, approve valid matches, and manually adjust targets.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentStep(5)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs min-h-[38px]"
                >
                  Proceed to Fix Issues
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <MappingReviewTable />
            </div>
          )}

          {/* STEP 5: Fix Issues */}
          {currentStep === 5 && (
            <IssueDetectorView />
          )}

          {/* STEP 6: Export Redirects */}
          {currentStep === 6 && (
            <ExportView />
          )}
        </>
      )}
    </div>
  );
};
