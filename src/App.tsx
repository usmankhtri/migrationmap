/**
 * MigrationMap - Main Application Component & Client Router
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { MigrationProvider } from './context/MigrationContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { AppDashboardPage } from './pages/AppDashboardPage';
import { DocsPage } from './pages/DocsPage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { updatePageMetadata } from './utils/seo';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (['/app', '/docs', '/about', '/privacy'].includes(path)) {
        return path;
      }
      if (window.location.hash) {
        const hashPath = window.location.hash.replace(/^#/, '');
        if (['/app', '/docs', '/about', '/privacy'].includes(hashPath)) {
          return hashPath;
        }
      }
    }
    return '/';
  });

  // Sync SEO metadata and OpenGraph tags dynamically on route change
  useEffect(() => {
    updatePageMetadata(currentPath);
  }, [currentPath]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (['/app', '/docs', '/about', '/privacy'].includes(path)) {
        setCurrentPath(path);
      } else if (window.location.hash) {
        const hashPath = window.location.hash.replace(/^#/, '');
        if (['/app', '/docs', '/about', '/privacy'].includes(hashPath)) {
          setCurrentPath(hashPath);
        } else {
          setCurrentPath('/');
        }
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', path);
      } catch {
        // Fallback for sandboxed frames
        window.location.hash = path;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <ThemeProvider>
      <MigrationProvider>
        <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors duration-150">
          <Navbar currentPath={currentPath} onNavigate={navigate} />

          <main className="flex-1">
            {currentPath === '/' && <LandingPage onNavigate={navigate} />}
            {currentPath === '/app' && <AppDashboardPage />}
            {currentPath === '/docs' && <DocsPage onNavigate={navigate} />}
            {currentPath === '/about' && <AboutPage onNavigate={navigate} />}
            {currentPath === '/privacy' && <PrivacyPage onNavigate={navigate} />}
          </main>

          <Footer onNavigate={navigate} />
        </div>
      </MigrationProvider>
    </ThemeProvider>
  );
}
