/**
 * MigrationMap v1.2 - Minimalist SaaS Navigation Bar
 * Refined Linear/Vercel aesthetic, dark-first monochrome palette, v1.2 release badge.
 */

import React, { useState } from 'react';
import {
  ArrowRightLeft,
  RotateCcw,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useMigration } from '../../context/MigrationContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { clearProject, hasStarted, oldUrls } = useMigration();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const hasData = hasStarted || oldUrls.length > 0;

  const navLinks = [
    { label: 'Workspace', path: '/app' },
    { label: 'Documentation', path: '/docs' },
    { label: 'About', path: '/about' },
    { label: 'Privacy', path: '/privacy' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0e1014]/85 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
          {/* Logo, Wordmark & Version Badge */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button
              onClick={() => onNavigate('/')}
              className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full py-1 shrink-0"
              aria-label="MigrationMap Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/10 dark:bg-blue-500/15 backdrop-blur-md text-blue-600 dark:text-blue-400 font-bold text-xs transition-colors shrink-0 group-hover:scale-105">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-neutral-900 dark:text-white text-base">
                  MigrationMap
                </span>
                <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10">
                  v1.2
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links — M3 Tonal Capsule */}
            <nav className="hidden md:flex items-center gap-1 bg-neutral-100/70 dark:bg-white/[0.04] p-1 rounded-full border border-neutral-200/60 dark:border-white/[0.06]">
              {navLinks.map(link => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => onNavigate(link.path)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-full border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.05] backdrop-blur-md p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-white/[0.08] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Clear Project Action */}
            {hasData && (
              <button
                onClick={() => setClearModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.05] backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-white/[0.08] transition-colors min-h-[38px]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>
            )}

            {/* Primary Action Button — M3 Filled Pill */}
            <button
              onClick={() => onNavigate('/app')}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-5 py-2 text-xs font-semibold text-white dark:text-neutral-950 transition-all shadow-xs min-h-[38px] active:scale-[0.98]"
            >
              Open workspace
            </button>
          </div>

          {/* Mobile Right Controls (< 640px) */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-lg border border-neutral-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] backdrop-blur-md p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-neutral-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] backdrop-blur-md p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/70 dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu with backdrop */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#090a0c]/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-1.5 shadow-xl animate-in slide-in-from-top-2 duration-150">
            {navLinks.map(link => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    onNavigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-3.5 py-2.5 text-xs font-medium min-h-[42px] transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/70 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            <div className="pt-3 border-t border-neutral-200/80 dark:border-white/[0.08] flex flex-col gap-2">
              {hasData && (
                <button
                  onClick={() => {
                    setClearModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#111215]/80 backdrop-blur-md py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 min-h-[42px] hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear project
                </button>
              )}
              <button
                onClick={() => {
                  onNavigate('/app');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center rounded-lg bg-neutral-900 dark:bg-white py-2.5 text-xs font-semibold text-white dark:text-neutral-950 min-h-[42px] hover:opacity-90 shadow-xs"
              >
                Open workspace
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Clear Project Confirmation Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200/80 dark:border-white/[0.1] bg-white/95 dark:bg-[#111215]/95 backdrop-blur-2xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Clear this project?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              All locally stored migration data, pairings, and custom overrides for this browser session will be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setClearModalOpen(false)}
                className="rounded-lg border border-neutral-200/80 dark:border-white/[0.08] px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.04] min-h-[38px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearProject();
                  setClearModalOpen(false);
                }}
                className="rounded-lg bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 px-3.5 py-2 text-xs font-medium text-white transition-colors min-h-[38px] shadow-xs"
              >
                Clear project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
