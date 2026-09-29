/**
 * MigrationMap - Minimalist Navigation Bar
 * Professional monochrome branding, light/dark mode switcher, and clean workspace actions.
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
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Logo & Wordmark */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 rounded-md py-1 shrink-0"
              aria-label="MigrationMap Home"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold text-xs transition-colors shrink-0">
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 text-sm truncate">
                MigrationMap
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => onNavigate(link.path)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Actions & Theme Switcher */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {hasData && (
              <button
                onClick={() => setClearModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors min-h-[36px]"
              >
                <RotateCcw className="h-3 w-3" />
                Clear project
              </button>
            )}

            <button
              onClick={() => onNavigate('/app')}
              className="inline-flex items-center justify-center rounded-md bg-neutral-900 dark:bg-neutral-100 px-3.5 py-1.5 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity min-h-[36px]"
            >
              Open workspace
            </button>
          </div>

          {/* Mobile Right Controls (< 640px) */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-md border border-neutral-200 dark:border-neutral-800 p-2 text-neutral-600 dark:text-neutral-400 min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md border border-neutral-200 dark:border-neutral-800 p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 focus:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu with backdrop */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/98 dark:bg-neutral-950/98 backdrop-blur-md px-4 pt-3 pb-5 space-y-1.5 shadow-lg animate-in slide-in-from-top-2 duration-150">
            {navLinks.map(link => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    onNavigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded-md px-3.5 py-2.5 text-xs font-medium min-h-[42px] transition-colors ${
                    isActive
                      ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
              {hasData && (
                <button
                  onClick={() => {
                    setClearModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-800 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 min-h-[42px] hover:bg-neutral-50 dark:hover:bg-neutral-900"
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
                className="w-full flex items-center justify-center rounded-md bg-neutral-900 dark:bg-neutral-100 py-2.5 text-xs font-semibold text-white dark:text-neutral-900 min-h-[42px] hover:opacity-90"
              >
                Open workspace
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Clear Project Confirmation Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Clear this project?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              All locally stored migration data for this browser will be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setClearModalOpen(false)}
                className="rounded-md border border-neutral-200 dark:border-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 min-h-[38px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearProject();
                  setClearModalOpen(false);
                }}
                className="rounded-md bg-neutral-900 dark:bg-white px-3.5 py-2 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90 min-h-[38px]"
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
