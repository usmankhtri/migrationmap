/**
 * MigrationMap v1.2 - Minimalist Footer
 * Subtle monochrome typography, system status indicator, zero fluff.
 */

import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-neutral-200/80 dark:border-white/[0.08] bg-white/75 dark:bg-[#090a0c]/80 backdrop-blur-xl text-neutral-500 dark:text-neutral-400 text-xs transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: copyright & short notice */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-center sm:text-left">
          <div className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-white">
            <span>MigrationMap</span>
            <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">v1.2</span>
          </div>
          <span className="text-neutral-300 dark:text-neutral-700">·</span>
          <span className="text-neutral-500 dark:text-neutral-400">
            Client-side deterministic redirect mapping engine.
          </span>
          <span className="text-neutral-300 dark:text-neutral-700 hidden md:inline">·</span>
          <div className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Local sandbox</span>
          </div>
        </div>

        {/* Right: Essential links */}
        <div className="flex items-center gap-5 text-xs font-medium">
          <button
            onClick={() => onNavigate('/app')}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Workspace
          </button>
          <button
            onClick={() => onNavigate('/docs')}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Docs
          </button>
          <button
            onClick={() => onNavigate('/about')}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            About
          </button>
          <button
            onClick={() => onNavigate('/privacy')}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Privacy
          </button>
        </div>
      </div>
    </footer>
  );
};
