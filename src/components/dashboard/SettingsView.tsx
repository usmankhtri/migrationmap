/**
 * MigrationMap - Settings View
 * Configures URL normalization heuristics, confidence threshold bands, cookie storage status, and clear project.
 */

import React, { useState, useRef } from 'react';
import {
  Sliders,
  RotateCcw,
  Check,
  ShieldCheck,
  AlertTriangle,
  HardDrive,
  Download,
  Upload,
  FileCode,
} from 'lucide-react';
import { useMigration } from '../../context/MigrationContext';

export const SettingsView: React.FC = () => {
  const {
    normalizationConfig,
    updateNormalizationConfig,
    thresholds,
    updateThresholds,
    clearProject,
    runAnalysis,
    mappings,
    oldUrls,
    isAnalyzing,
    storageStatus,
    exportProjectBackup,
    importProjectBackup,
  } = useMigration();

  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const triggerSaveNotice = (msg = 'Settings updated and saved.') => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importProjectBackup(content);
      if (res.success) {
        triggerSaveNotice('Project successfully restored from backup.');
      } else {
        setImportError(res.error || 'Failed to restore project backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Normalization &amp; Scoring Settings
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Configure how URLs are sanitized and compared before generating candidate matches.
          </p>
        </div>

        {mappings.length > 0 && (
          <button
            onClick={async () => {
              await runAnalysis();
              triggerSaveNotice();
            }}
            disabled={isAnalyzing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 min-h-[38px]"
          >
            <RotateCcw className="h-3 w-3" /> Re-run matching
          </button>
        )}
      </div>

      {savedNotice && (
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-neutral-900 dark:text-neutral-100" />
          Settings updated and saved.
        </div>
      )}

      {/* Local Storage & Privacy Notice */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
          <HardDrive className="h-4 w-4" />
          <span>Local browser storage</span>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Your migration data is stored locally in your browser using persistent IndexedDB (with LocalStorage/Cookie fallback).
          MigrationMap does not use a cloud database or transmit your URL datasets across the network.
          Clearing this site&apos;s browsing data will remove your saved project.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
          <span>Storage status:</span>
          {storageStatus === 'saved' && (
            <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-neutral-800 dark:text-neutral-200 font-medium">
              Saved locally in browser IndexedDB
            </span>
          )}
          {storageStatus === 'oversized' && (
            <span className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 text-neutral-800 dark:text-neutral-200 font-medium">
              Large dataset active in memory
            </span>
          )}
          {storageStatus === 'corrupted' && (
            <span className="rounded bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 text-neutral-800 dark:text-neutral-200 font-medium">
              Data reset
            </span>
          )}
          {storageStatus === 'none' && (
            <span className="text-neutral-400">Empty workspace</span>
          )}
        </div>
      </div>

      {/* Project Backup & Restore Card */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-4">
        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Project Backup &amp; Restore
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Export a full project backup file (JSON) to save on your disk, share with a colleague, or restore later.
          </p>
        </div>

        {importError && (
          <div className="rounded border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-2.5 text-xs text-red-700 dark:text-red-300">
            {importError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <button
            onClick={exportProjectBackup}
            disabled={oldUrls.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 min-h-[38px]"
          >
            <Download className="h-3.5 w-3.5" />
            Export project backup (JSON)
          </button>

          <button
            onClick={() => backupFileInputRef.current?.click()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors min-h-[38px]"
          >
            <Upload className="h-3.5 w-3.5" />
            Import project backup
          </button>
          <input
            ref={backupFileInputRef}
            type="file"
            accept=".json"
            onChange={handleBackupFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Normalization Settings Card */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            URL Normalization Rules
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Applied during import to detect duplicates and eliminate trivial differences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <label className="flex items-start gap-2.5 p-2.5 rounded border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
            <input
              type="checkbox"
              checked={normalizationConfig.lowercaseHostname}
              onChange={e => updateNormalizationConfig({ lowercaseHostname: e.target.checked })}
              className="mt-0.5 rounded text-neutral-900 focus:ring-neutral-500"
            />
            <div>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">Lowercase hostname</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Transforms EXAMPLE.COM to example.com.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
            <input
              type="checkbox"
              checked={normalizationConfig.lowercasePath}
              onChange={e => updateNormalizationConfig({ lowercasePath: e.target.checked })}
              className="mt-0.5 rounded text-neutral-900 focus:ring-neutral-500"
            />
            <div>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">Lowercase URL path</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Converts /Products/Item to /products/item.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
            <input
              type="checkbox"
              checked={normalizationConfig.stripWww}
              onChange={e => updateNormalizationConfig({ stripWww: e.target.checked })}
              className="mt-0.5 rounded text-neutral-900 focus:ring-neutral-500"
            />
            <div>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">Strip www subdomain</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Normalizes www.example.com to example.com.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
            <input
              type="checkbox"
              checked={normalizationConfig.decodePercentEncoding}
              onChange={e => updateNormalizationConfig({ decodePercentEncoding: e.target.checked })}
              className="mt-0.5 rounded text-neutral-900 focus:ring-neutral-500"
            />
            <div>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">Decode percent-encoding</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Converts %20 to spaces for keyword matching.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
            <input
              type="checkbox"
              checked={normalizationConfig.stripFragments}
              onChange={e => updateNormalizationConfig({ stripFragments: e.target.checked })}
              className="mt-0.5 rounded text-neutral-900 focus:ring-neutral-500"
            />
            <div>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">Strip anchor fragments (#hash)</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Fragments are client-side only.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
            <input
              type="checkbox"
              checked={normalizationConfig.deduplicateUrls}
              onChange={e => updateNormalizationConfig({ deduplicateUrls: e.target.checked })}
              className="mt-0.5 rounded text-neutral-900 focus:ring-neutral-500"
            />
            <div>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">Deduplicate imported rows</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Collapses identical normalized URLs into a single row.
              </div>
            </div>
          </label>
        </div>

        {/* Trailing Slash Mode */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
            Trailing slash convention
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'remove', label: 'Remove trailing slashes (/path)', desc: 'Strip trailing slash on directory paths' },
              { id: 'enforce', label: 'Enforce trailing slashes (/path/)', desc: 'Append slash to non-file pathnames' },
              { id: 'keep', label: 'Preserve verbatim', desc: 'Leave slashes exactly as imported' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => updateNormalizationConfig({ trailingSlash: opt.id as any })}
                className={`p-2.5 rounded border text-left text-xs transition-colors ${
                  normalizationConfig.trailingSlash === opt.id
                    ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/60 font-semibold text-neutral-900 dark:text-neutral-100'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/20'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confidence Threshold Sliders Card */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            Confidence Score Thresholds
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Controls how candidate matches are categorized into High, Medium, or Needs Review.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                High confidence minimum: {thresholds.veryStrongMin}%
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">Default: 90%</span>
            </div>
            <input
              type="range"
              min={70}
              max={99}
              value={thresholds.veryStrongMin}
              onChange={e => updateThresholds({ veryStrongMin: Number(e.target.value) })}
              className="w-full accent-neutral-900 dark:accent-neutral-100"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                Medium confidence minimum: {thresholds.strongMin}%
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">Default: 75%</span>
            </div>
            <input
              type="range"
              min={60}
              max={85}
              value={thresholds.strongMin}
              onChange={e => updateThresholds({ strongMin: Number(e.target.value) })}
              className="w-full accent-neutral-900 dark:accent-neutral-100"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                Needs review minimum: {thresholds.needsReviewMin}%
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">Default: 50%</span>
            </div>
            <input
              type="range"
              min={30}
              max={65}
              value={thresholds.needsReviewMin}
              onChange={e => updateThresholds({ needsReviewMin: Number(e.target.value) })}
              className="w-full accent-neutral-900 dark:accent-neutral-100"
            />
          </div>
        </div>
      </div>

      {/* Clear Project Action */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
          Clear project
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Deletes all locally stored URL datasets, mappings, and validation results from browser cookies.
          Make sure to export your redirect rules first.
        </p>
        <button
          onClick={() => setClearModalOpen(true)}
          className="mt-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Clear project
        </button>
      </div>

      {/* Clear Project Confirmation Dialog */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Clear this project?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              All locally stored migration data for this browser will be deleted.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setClearModalOpen(false)}
                className="rounded border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearProject();
                  setClearModalOpen(false);
                }}
                className="rounded bg-neutral-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90"
              >
                Clear project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
