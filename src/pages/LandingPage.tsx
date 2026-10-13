/**
 * MigrationMap v1.2 - Landing Page
 * Google Material Design 3 (M3) bold typography, rounded-3xl surfaces,
 * minimalist layout, interactive simulator, and Core UI Principles.
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Layers,
  Check,
  FileCode,
  ChevronDown,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useMigration } from '../context/MigrationContext';
import { normalizeUrl, DEFAULT_NORMALIZATION_CONFIG } from '../utils/url';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

const SAMPLE_OLD_URLS = [
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

const SAMPLE_NEW_URLS = [
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

interface DemoPair {
  id: string;
  category: string;
  oldUrl: string;
  newUrl: string;
  confidence: number;
  signals: string[];
  redirectCode: string;
}

const DEMO_PRESETS: DemoPair[] = [
  {
    id: 'blog',
    category: 'Blog Migration',
    oldUrl: 'https://oldsite.com/blog/2023/11/seo-migration-guide.html',
    newUrl: 'https://newsite.com/articles/seo-migration-guide',
    confidence: 96,
    signals: ['Terminal slug match', 'Dropped .html extension', 'Date token stripped'],
    redirectCode: 'Redirect 301 /blog/2023/11/seo-migration-guide.html /articles/seo-migration-guide',
  },
  {
    id: 'ecommerce',
    category: 'E-commerce',
    oldUrl: 'https://store-v1.com/products/view.php?id=9482&name=leather-bag',
    newUrl: 'https://modernstore.io/shop/bags/leather-bag',
    confidence: 92,
    signals: ['Keyword extraction', 'Hierarchy remapped', 'Query param dropped'],
    redirectCode: 'RewriteRule ^products/view\\.php$ /shop/bags/leather-bag [R=301,L]',
  },
  {
    id: 'docs',
    category: 'Documentation',
    oldUrl: 'https://docs.app.com/v1/api/authentication/oauth2',
    newUrl: 'https://developer.app.com/docs/auth/oauth-2',
    confidence: 94,
    signals: ['Path segment alignment', 'Token map inversion', 'Subdomain migration'],
    redirectCode: '{ "source": "/v1/api/authentication/oauth2", "destination": "/docs/auth/oauth-2", "permanent": true }',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { startMigration, importBothUrls } = useMigration();

  // Interactive playground state
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [customOldUrl, setCustomOldUrl] = useState(DEMO_PRESETS[0].oldUrl);
  const [customNewUrl, setCustomNewUrl] = useState(DEMO_PRESETS[0].newUrl);
  const [activeScore, setActiveScore] = useState(DEMO_PRESETS[0].confidence);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleStartMigration = () => {
    startMigration();
    onNavigate('/app');
  };

  const handleLaunchWithDemo = () => {
    const parsedOld = SAMPLE_OLD_URLS.map(u => normalizeUrl(u, DEFAULT_NORMALIZATION_CONFIG));
    const parsedNew = SAMPLE_NEW_URLS.map(u => normalizeUrl(u, DEFAULT_NORMALIZATION_CONFIG));
    importBothUrls(parsedOld, parsedNew);
    startMigration();
    onNavigate('/app');
  };

  const handleSelectPreset = (index: number) => {
    setSelectedDemoIndex(index);
    setCustomOldUrl(DEMO_PRESETS[index].oldUrl);
    setCustomNewUrl(DEMO_PRESETS[index].newUrl);
    setActiveScore(DEMO_PRESETS[index].confidence);
  };

  const handleSimulateCalculation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      let score = 75;
      const oldClean = customOldUrl.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newClean = customNewUrl.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (oldClean === newClean) score = 100;
      else if (oldClean.includes(newClean) || newClean.includes(oldClean)) score = 88;
      else score = Math.floor(70 + Math.random() * 25);
      setActiveScore(score);
      setIsSimulating(false);
    }, 350);
  };

  const currentPreset = DEMO_PRESETS[selectedDemoIndex];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 pt-6 sm:pt-10">
      {/* ========================================================= */}
      {/* HERO SECTION — BOLD & MINIMALIST GOOGLE MATERIAL DESIGN 3 */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
        {/* Generic Version Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 dark:border-white/10 bg-white/80 dark:bg-[#191c22]/90 backdrop-blur-xl px-3.5 py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span>MigrationMap v1.2</span>
        </div>

        {/* Display Headline */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-950 dark:text-white leading-[1.1] max-w-3xl mx-auto">
          High-precision URL migration and redirect mapping.
        </h1>

        {/* Concise Description */}
        <p className="mx-auto max-w-xl text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
          Map legacy URLs to new destinations, detect redirect loops, and export clean rules directly in your browser.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleStartMigration}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-7 py-3 text-sm font-semibold text-white dark:text-neutral-950 transition-all shadow-xs min-h-[46px] active:scale-[0.98]"
          >
            <span>Open workspace</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={handleLaunchWithDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 dark:border-white/15 bg-white/80 dark:bg-[#191c22]/80 backdrop-blur-md px-6 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-all min-h-[46px] active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Try demo dataset</span>
          </button>
        </div>

        {/* Feature Highlights Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <div className="rounded-full bg-neutral-100/80 dark:bg-white/[0.05] border border-neutral-200/60 dark:border-white/[0.08] px-3.5 py-1.5 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>100% Client-Side Privacy</span>
          </div>
          <div className="rounded-full bg-neutral-100/80 dark:bg-white/[0.05] border border-neutral-200/60 dark:border-white/[0.08] px-3.5 py-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Deterministic Heuristics</span>
          </div>
          <div className="rounded-full bg-neutral-100/80 dark:bg-white/[0.05] border border-neutral-200/60 dark:border-white/[0.08] px-3.5 py-1.5 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Loop &amp; Chain Detection</span>
          </div>
          <div className="rounded-full bg-neutral-100/80 dark:bg-white/[0.05] border border-neutral-200/60 dark:border-white/[0.08] px-3.5 py-1.5 flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Multi-Format Exports</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* INTERACTIVE PREVIEW SIMULATOR                             */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-neutral-200/90 dark:border-white/[0.1] bg-white/80 dark:bg-[#191c22]/90 backdrop-blur-2xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200/70 dark:border-white/[0.08] pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                Interactive Matcher Preview
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Test candidate correlation and confidence scoring.
              </p>
            </div>

            {/* Presets switcher */}
            <div className="flex flex-wrap items-center gap-1 bg-neutral-100 dark:bg-[#13151b] p-1 rounded-full border border-neutral-200 dark:border-white/[0.08]">
              {DEMO_PRESETS.map((preset, idx) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(idx)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    selectedDemoIndex === idx
                      ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {preset.category}
                </button>
              ))}
            </div>
          </div>

          {/* URL comparison inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Legacy URL
              </label>
              <input
                type="text"
                value={customOldUrl}
                onChange={e => setCustomOldUrl(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200/90 dark:border-white/[0.1] bg-neutral-50/70 dark:bg-[#13151b] px-3.5 py-2 font-mono text-xs text-neutral-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Destination URL
              </label>
              <input
                type="text"
                value={customNewUrl}
                onChange={e => setCustomNewUrl(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200/90 dark:border-white/[0.1] bg-neutral-50/70 dark:bg-[#13151b] px-3.5 py-2 font-mono text-xs text-neutral-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Score card */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50/60 dark:bg-[#13151b]/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-mono text-sm font-bold ${
                  activeScore >= 80
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {activeScore}%
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    {activeScore >= 80 ? 'High Confidence Match' : 'Review Recommended'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {currentPreset.signals.map((sig, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/10 px-2 py-0.5 text-[10px] font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        <Check className="h-2.5 w-2.5 text-emerald-500" />
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSimulateCalculation}
                disabled={isSimulating}
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 dark:bg-white px-4 py-1.5 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shrink-0"
              >
                <RotateCcw className={`h-3 w-3 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>Recalculate</span>
              </button>
            </div>

            {/* Code preview */}
            <div className="pt-2 border-t border-neutral-200/60 dark:border-white/[0.06]">
              <pre className="overflow-x-auto rounded-xl bg-neutral-950 p-2.5 text-[11px] font-mono text-emerald-400 border border-neutral-800">
                {currentPreset.redirectCode}
              </pre>
            </div>
          </div>
        </div>
      </section>



      {/* ========================================================= */}
      {/* 6-STEP WORKFLOW                                           */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-1.5 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            6-Step Workflow
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            A linear process from raw legacy URLs to production rules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { step: 1, title: 'Import Old URLs', desc: 'Upload crawl or paste legacy URLs.' },
            { step: 2, title: 'Import New URLs', desc: 'Add modern target destination paths.' },
            { step: 3, title: 'Run Matching', desc: 'Compute deterministic correlation scores.' },
            { step: 4, title: 'Review Mappings', desc: 'Filter by confidence and verify pairs.' },
            { step: 5, title: 'Fix Issues & Loops', desc: 'Resolve redirect chains and cycles.' },
            { step: 6, title: 'Export Rules', desc: 'Export Next.js, Vercel, Apache, Nginx, or CSV.' },
          ].map(item => (
            <div
              key={item.step}
              className="rounded-3xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#191c22]/85 backdrop-blur-xl p-5 space-y-2 shadow-xs"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-white dark:text-neutral-950 font-mono text-xs font-bold">
                {item.step}
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SUPPORTED EXPORT FORMATS                                 */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-1.5 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Supported Export Formats
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Export directly to standard configurations and formats.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {[
            { name: 'Next.js', file: 'next.config.js' },
            { name: 'Vercel', file: 'vercel.json' },
            { name: 'Netlify', file: '_redirects' },
            { name: 'Apache', file: '.htaccess' },
            { name: 'Nginx', file: 'nginx.conf' },
            { name: 'CSV / JSON', file: 'Spreadsheets' },
          ].map(fmt => (
            <div
              key={fmt.name}
              className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#191c22]/85 backdrop-blur-xl p-3.5 space-y-1 shadow-xs"
            >
              <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                {fmt.name}
              </span>
              <span className="font-mono text-[10px] text-neutral-400 block truncate">
                {fmt.file}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* FAQ SECTION                                               */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 space-y-4">
        <div className="text-center space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-2.5">
          {[
            {
              q: 'Is my migration dataset sent to an external server?',
              a: 'No. MigrationMap runs entirely inside your browser. All parsing, correlation, loop detection, and rule exports happen locally on your device.',
            },
            {
              q: 'How many URLs can MigrationMap handle?',
              a: 'MigrationMap uses client-side IndexedDB storage, capable of handling 50,000+ source and target URLs smoothly in modern browsers.',
            },
            {
              q: 'How does redirect loop and chain detection work?',
              a: 'The engine constructs a directed graph of all source-to-target transitions to find circular references (A → B → A) and intermediate hops (A → B → C).',
            },
            {
              q: 'Is there any account or subscription required?',
              a: 'No. MigrationMap is free to use with no accounts, no credit cards, and no paywalls.',
            },
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#191c22]/85 backdrop-blur-xl overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3.5 sm:px-4 pb-4 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-white/[0.04] pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* FINAL CALL TO ACTION                                      */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-neutral-200/90 dark:border-white/[0.1] bg-white/80 dark:bg-[#191c22]/90 backdrop-blur-xl p-8 sm:p-10 text-center space-y-4 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Start mapping your URLs
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Fast, deterministic, and running entirely in your browser.
          </p>

          <div className="pt-2">
            <button
              onClick={handleStartMigration}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-7 py-3 text-xs font-semibold text-white dark:text-neutral-950 transition-all shadow-xs min-h-[44px] active:scale-[0.98]"
            >
              <span>Open workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
