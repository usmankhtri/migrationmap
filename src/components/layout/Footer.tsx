/**
 * MigrationMap - Minimalist Footer
 */

import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 text-xs transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: copyright & short notice */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            MigrationMap
          </span>
          <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">/</span>
          <span>Browser-side URL analysis and redirect generator.</span>
        </div>

        {/* Right: Essential links */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => onNavigate('/app')}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('/docs')}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            Docs
          </button>
          <button
            onClick={() => onNavigate('/about')}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            About
          </button>
          <button
            onClick={() => onNavigate('/privacy')}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            Privacy
          </button>
        </div>
      </div>
    </footer>
  );
};
