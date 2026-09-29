/**
 * MigrationMap - Privacy Policy & Local Storage Model
 * Clear, truthful documentation on browser-only persistence, cookie lifecycle, and security boundaries.
 */

import React from 'react';
import { HardDrive, EyeOff, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
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
          Privacy &amp; Local Storage Model
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          MigrationMap operates without a backend database. Your migration data is stored locally in your browser.
        </p>
      </div>

      {/* Core Privacy Facts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-xs text-neutral-900 dark:text-neutral-100">
            <EyeOff className="h-3.5 w-3.5" />
            Where URL processing occurs
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            All CSV, TXT, and XML parsing, candidate matching, and code generation execute exclusively inside your local browser session.
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-xs text-neutral-900 dark:text-neutral-100">
            <HardDrive className="h-3.5 w-3.5" />
            Cookie-based local storage
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Your saved project state is stored in your browser cookies. Clearing this site&apos;s cookies/data will remove your saved project.
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-xs text-neutral-900 dark:text-neutral-100">
            <Lock className="h-3.5 w-3.5" />
            No cloud database
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            MigrationMap does not use a cloud database for your migration data. We cannot access or restore deleted local projects.
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-xs text-neutral-900 dark:text-neutral-100">
            <Lock className="h-3.5 w-3.5" />
            No third-party data sharing
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Your migration dataset is never sent to external AI APIs, tracking vendors, or cloud advertising services.
          </p>
        </div>
      </div>

      {/* What Data is Stored Locally */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          What is stored locally in your cookies
        </h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <p>
            When you import URLs, the application stores your imported source URLs, destination URLs, generated mappings, review statuses (Approved, Review, Rejected), and normalization preferences in cookie chunks.
          </p>
          <p>
            This allows your work to persist when you refresh or revisit the site on the same device and browser.
          </p>
        </div>
      </section>

      {/* Storage and Persistence */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          High-capacity local persistence
        </h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <p>
            MigrationMap uses browser-level IndexedDB to store your migration project locally, comfortably supporting datasets with 50,000+ URLs and mappings without relying on restrictive cookie storage.
          </p>
          <p>
            Your URLs and mapping decisions never leave your browser or device. All calculations, matching, and exports are conducted entirely on the client side.
          </p>
        </div>
      </section>
    </div>
  );
};
