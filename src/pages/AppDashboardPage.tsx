/**
 * MigrationMap - Main Application Workspace
 * Implements the 6-Step Guided Workflow:
 * STEP 1: Import Old URLs
 * STEP 2: Import New URLs
 * STEP 3: Run Matching
 * STEP 4: Review Mappings
 * STEP 5: Fix Issues
 * STEP 6: Export Redirects
 *
 * Provides a clean empty first experience ("Start a migration" / "Import URLs"),
 * subtle progress indicator, clear "what to do next" guidance, and calm visual hierarchy.
 */

import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ArrowRight,
  Upload,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Play,
  ArrowRightLeft,
} from 'lucide-react';
import { useMigration, WorkflowStep } from '../context/MigrationContext';
import { ImportWizard } from '../components/dashboard/ImportWizard';
import { MappingReviewTable } from '../components/dashboard/MappingReviewTable';
import { IssueDetectorView } from '../components/dashboard/IssueDetectorView';
import { ExportView } from '../components/dashboard/ExportView';
import { SettingsView } from '../components/dashboard/SettingsView';

export const AppDashboardPage: React.FC = () => {
  const {
    oldUrls,
    newUrls,
    mappings,
    issues,
    metrics,
    currentStep,
    setCurrentStep,
    runAnalysis,
    isAnalyzing,
    progress,
    hasStarted,
    startMigration,
    storageStatus,
    storageWarningDismissed,
    dismissStorageWarning,
  } = useMigration();

  const [showSettings, setShowSettings] = useState(false);

  // Requirement #3: Empty First Experience
  if (!hasStarted && oldUrls.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs">
          <ArrowRightLeft className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Start a migration
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Import your old and new URL lists to begin.
          </p>
        </div>

        <div>
          <button
            onClick={startMigration}
            className="inline-flex items-center gap-2 rounded-md bg-neutral-900 dark:bg-neutral-100 px-5 py-2.5 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Import URLs
          </button>
        </div>

        <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800/80 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-neutral-400 font-semibold block">1. IMPORT</span>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Add old site URLs and new site destinations.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-neutral-400 font-semibold block">2. MATCH &amp; REVIEW</span>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Deterministic scoring and cycle checking.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-neutral-400 font-semibold block">3. EXPORT</span>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Download CSV, Next.js, Vercel, or Nginx rules.
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Storage Alert (if cookies full) */}
      {storageStatus === 'oversized' && !storageWarningDismissed && (
        <div className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                Browser storage limit reached for this session.
              </span>
              <p className="text-neutral-600 dark:text-neutral-400">
                All URL matching, validation, and calculations continue actively in memory. Make sure to export your redirect rules when done.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentStep(6)}
              className="rounded bg-neutral-900 dark:bg-white px-3 py-1 font-medium text-white dark:text-neutral-900 hover:opacity-90"
            >
              Export now
            </button>
            <button
              onClick={dismissStorageWarning}
              className="rounded border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 text-neutral-600 dark:text-neutral-400"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 6-STEP WORKFLOW BAR (Requirement #2) */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Migration Workflow
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
              showSettings
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Sliders className="h-3 w-3" />
            {showSettings ? 'Hide settings' : 'Advanced settings'}
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
                className={`flex items-center gap-2 rounded-md p-2 sm:p-2.5 text-left transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold'
                    : isDone
                    ? 'bg-neutral-50 dark:bg-neutral-800/40 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/20'
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-medium ${
                    isActive
                      ? 'bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'border border-neutral-300 dark:border-neutral-700 text-neutral-500'
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : step.number}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs truncate">
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
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-neutral-400">STEP 3</span>
                    <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      Run Matching
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Compare legacy URLs against destination URLs using deterministic path, slug, and token heuristics.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Old URLs (source)</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                      {oldUrls.length.toLocaleString()} URLs
                    </span>
                  </div>
                  <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">New URLs (destinations)</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                      {newUrls.length.toLocaleString()} URLs
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                  <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2.5 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[40px]"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="h-3 w-3 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin" />
                        <span>{progress?.stage || 'Running matching...'}</span>
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
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 min-h-[40px]"
                    >
                      Go to Review Mappings
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
                  <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    Review Mappings
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Review candidate pairs, approve valid matches, and manually adjust targets.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentStep(5)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90 min-h-[38px]"
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
