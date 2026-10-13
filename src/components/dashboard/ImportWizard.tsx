/**
 * MigrationMap v1.2 - User-Friendly URL Import Experience
 * Step 1: Import Old URLs (existing website)
 * Step 2: Import New URLs (new website)
 * Linear/Vercel dark-first minimalist aesthetic with drag-and-drop, direct paste,
 * column detection modal, invalid row inspection, and demo loader.
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  X,
  Download,
  Sparkles,
} from 'lucide-react';
import { useMigration } from '../../context/MigrationContext';
import {
  parseCsv,
  parseTxt,
  parseSitemapXml,
  parsePastedText,
  parseCsvRaw,
  detectUrlColumns,
} from '../../utils/parsers';
import { normalizeUrl, DEFAULT_NORMALIZATION_CONFIG } from '../../utils/url';

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

export const ImportWizard: React.FC = () => {
  const {
    oldUrls,
    newUrls,
    importOldUrls,
    importNewUrls,
    importBothUrls,
    runAnalysis,
    isAnalyzing,
    progress,
    normalizationConfig,
    oldInvalidRows,
    newInvalidRows,
    startMigration,
    setCurrentStep,
  } = useMigration();

  // Mode toggles for each side: 'upload' | 'paste'
  const [oldMode, setOldMode] = useState<'upload' | 'paste'>('upload');
  const [newMode, setNewMode] = useState<'upload' | 'paste'>('upload');

  const [pasteOldText, setPasteOldText] = useState('');
  const [pasteNewText, setPasteNewText] = useState('');

  const [dragActiveOld, setDragActiveOld] = useState(false);
  const [dragActiveNew, setDragActiveNew] = useState(false);

  const fileInputRefOld = useRef<HTMLInputElement>(null);
  const fileInputRefNew = useRef<HTMLInputElement>(null);

  // Column Picker Modal state
  const [columnPickerState, setColumnPickerState] = useState<{
    isOpen: boolean;
    rawCsv: string;
    filename: string;
    side: 'old' | 'new';
    columns: Array<{ index: number; name: string; score: number }>;
    selectedCol: number;
  }>({
    isOpen: false,
    rawCsv: '',
    filename: '',
    side: 'old',
    columns: [],
    selectedCol: 0,
  });

  // Invalid rows modal state
  const [invalidModalSide, setInvalidModalSide] = useState<'old' | 'new' | null>(null);

  const handleFileUpload = (file: File, side: 'old' | 'new') => {
    const filename = file.name;
    const lowerName = filename.toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';

      if (lowerName.endsWith('.xml')) {
        const result = parseSitemapXml(content, normalizationConfig, filename);
        if (side === 'old') importOldUrls(result.validUrls, result.invalidRows);
        else importNewUrls(result.validUrls, result.invalidRows);
      } else if (lowerName.endsWith('.csv') || lowerName.endsWith('.tsv')) {
        const { rows } = parseCsvRaw(content);
        if (rows.length > 0 && rows[0].length > 1) {
          const detected = detectUrlColumns(rows, side);
          if (detected.candidates.length > 1) {
            setColumnPickerState({
              isOpen: true,
              rawCsv: content,
              filename,
              side,
              columns: detected.candidates,
              selectedCol: detected.bestIndex,
            });
            return;
          }
        }
        const result = parseCsv(content, undefined, normalizationConfig, filename, side);
        if (side === 'old') importOldUrls(result.validUrls, result.invalidRows);
        else importNewUrls(result.validUrls, result.invalidRows);
      } else {
        const result = parseTxt(content, normalizationConfig, filename);
        if (side === 'old') importOldUrls(result.validUrls, result.invalidRows);
        else importNewUrls(result.validUrls, result.invalidRows);
      }
    };

    reader.readAsText(file);
  };

  const handleLoadDemoDataset = () => {
    const parsedOld = DEMO_OLD_URLS.map(u => normalizeUrl(u, DEFAULT_NORMALIZATION_CONFIG));
    const parsedNew = DEMO_NEW_URLS.map(u => normalizeUrl(u, DEFAULT_NORMALIZATION_CONFIG));
    importBothUrls(parsedOld, parsedNew);
    startMigration();
    setCurrentStep(3);
  };

  const confirmColumnSelection = () => {
    const result = parseCsv(
      columnPickerState.rawCsv,
      columnPickerState.selectedCol,
      normalizationConfig,
      columnPickerState.filename,
      columnPickerState.side
    );

    if (columnPickerState.side === 'old') {
      importOldUrls(result.validUrls, result.invalidRows);
    } else {
      importNewUrls(result.validUrls, result.invalidRows);
    }

    setColumnPickerState(prev => ({ ...prev, isOpen: false }));
  };

  const handleImportBothColumns = () => {
    const cols = columnPickerState.columns;
    if (cols.length < 2) return;
    const oldCol = cols.find(c => c.name.toLowerCase().includes('old') || c.name.toLowerCase().includes('source') || c.name.toLowerCase().includes('from')) || cols[0];
    const newCol = cols.find(c => c.index !== oldCol.index && (c.name.toLowerCase().includes('new') || c.name.toLowerCase().includes('target') || c.name.toLowerCase().includes('dest') || c.name.toLowerCase().includes('to'))) || cols.find(c => c.index !== oldCol.index) || cols[1];

    const oldResult = parseCsv(columnPickerState.rawCsv, oldCol.index, normalizationConfig, columnPickerState.filename, 'old');
    const newResult = parseCsv(columnPickerState.rawCsv, newCol.index, normalizationConfig, columnPickerState.filename, 'new');

    importBothUrls(oldResult.validUrls, newResult.validUrls, oldResult.invalidRows, newResult.invalidRows);
    setColumnPickerState(prev => ({ ...prev, isOpen: false }));
  };

  const handlePasteSubmit = (side: 'old' | 'new') => {
    const text = side === 'old' ? pasteOldText : pasteNewText;
    if (!text.trim()) return;
    const result = parsePastedText(text, normalizationConfig);
    if (side === 'old') {
      importOldUrls(result.validUrls, result.invalidRows);
      setPasteOldText('');
    } else {
      importNewUrls(result.validUrls, result.invalidRows);
      setPasteNewText('');
    }
  };

  const downloadBlankTemplate = (side: 'old' | 'new') => {
    const csvContent = 'url,notes\nhttps://example.com/sample-page,Optional notes\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-${side}-urls-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadInvalidRows = (side: 'old' | 'new') => {
    const rows = side === 'old' ? oldInvalidRows : newInvalidRows;
    const lines = ['line_number,raw_content,reason'];
    for (const r of rows) {
      lines.push(`${r.line},"${r.rawText.replace(/"/g, '""')}","${r.reason.replace(/"/g, '""')}"`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invalid-${side}-urls.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bothLoaded = oldUrls.length > 0 && newUrls.length > 0;

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white">
            Import Datasets
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Upload or paste the old legacy URLs and new destination URLs for your migration.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleLoadDemoDataset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111215] px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.04] transition-colors shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
            <span>Load demo dataset</span>
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50 dark:bg-[#111215] px-2.5 py-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>Capacity: 50,000+ URLs</span>
          </div>
        </div>
      </div>

      {/* Two Clear Sections: OLD URLS and NEW URLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* OLD URLS SECTION */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#111215]/75 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-neutral-400">STEP 1</span>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Old URLs
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                URLs from your existing website
              </p>
            </div>

            {oldUrls.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {oldUrls.length.toLocaleString()} old URLs imported
              </span>
            )}
          </div>

          {/* If already loaded, show clean summary with replace option */}
          {oldUrls.length > 0 ? (
            <div className="space-y-3 pt-1">
              <div className="rounded-lg border border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50/70 dark:bg-[#0c0d10] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Dataset status</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    {oldUrls.length.toLocaleString()} valid URLs imported
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate pt-0.5">
                  Sample: {oldUrls[0]?.raw}
                </div>
              </div>

              {/* Validation notes if invalid rows found */}
              {oldInvalidRows.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {oldInvalidRows.length.toLocaleString()} row{oldInvalidRows.length > 1 ? 's' : ''} skipped due to invalid URL format.
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-6">
                    <button
                      onClick={() => setInvalidModalSide('old')}
                      className="text-[11px] underline text-amber-900 dark:text-amber-200 hover:opacity-80 py-1"
                    >
                      Review invalid rows
                    </button>
                    <span className="text-[11px] text-neutral-400 hidden sm:inline">&bull;</span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Processing with valid URLs only
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => fileInputRefOld.current?.click()}
                  className="flex-1 sm:flex-initial rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111215] px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.04] transition-colors min-h-[38px]"
                >
                  Replace file
                </button>
                <input
                  ref={fileInputRefOld}
                  type="file"
                  accept=".csv,.tsv,.txt,.xml"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'old');
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => downloadBlankTemplate('old')}
                  className="flex-1 sm:flex-initial rounded-lg border border-neutral-200 dark:border-white/10 px-3.5 py-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white min-h-[38px]"
                >
                  Download template CSV
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Paste inputs when empty */
            <div className="space-y-3">
              {/* Segmented Mode Switch */}
              <div className="inline-flex p-1 rounded-lg bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200/60 dark:border-white/[0.06] text-xs">
                <button
                  onClick={() => setOldMode('upload')}
                  className={`py-1.5 px-3.5 font-medium rounded-md transition-all ${
                    oldMode === 'upload'
                      ? 'bg-white dark:bg-[#18191e] text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Upload file
                </button>
                <button
                  onClick={() => setOldMode('paste')}
                  className={`py-1.5 px-3.5 font-medium rounded-md transition-all ${
                    oldMode === 'paste'
                      ? 'bg-white dark:bg-[#18191e] text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Paste URLs
                </button>
              </div>

              {oldMode === 'upload' ? (
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setDragActiveOld(true);
                  }}
                  onDragLeave={() => setDragActiveOld(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragActiveOld(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file, 'old');
                  }}
                  className={`border border-dashed rounded-xl p-6 sm:p-7 text-center transition-all ${
                    dragActiveOld
                      ? 'border-neutral-900 dark:border-white/40 bg-neutral-100/60 dark:bg-white/[0.04]'
                      : 'border-neutral-300 dark:border-white/[0.12] hover:border-neutral-400 dark:hover:border-white/20 bg-neutral-50/50 dark:bg-[#0c0d10]'
                  }`}
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#131418] text-neutral-700 dark:text-neutral-300 shadow-xs">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-xs font-medium text-neutral-900 dark:text-white">
                    Drag and drop file here, or browse files
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    Supports CSV, TSV, TXT, or sitemap.xml (up to 50,000+ URLs)
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => fileInputRefOld.current?.click()}
                      className="rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs min-h-[38px]"
                    >
                      Browse file
                    </button>
                    <input
                      ref={fileInputRefOld}
                      type="file"
                      accept=".csv,.tsv,.txt,.xml"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'old');
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={pasteOldText}
                    onChange={e => setPasteOldText(e.target.value)}
                    rows={6}
                    placeholder="https://example.com/about&#10;https://example.com/products/item-1&#10;https://example.com/contact"
                    className="w-full rounded-lg border border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50 dark:bg-[#0c0d10] p-3 font-mono text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-white/20"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      One URL per line
                    </span>
                    <button
                      onClick={() => handlePasteSubmit('old')}
                      disabled={!pasteOldText.trim()}
                      className="w-full sm:w-auto rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40 min-h-[38px] shadow-xs"
                    >
                      Load pasted URLs
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                <span>Need a sample file header?</span>
                <button
                  onClick={() => downloadBlankTemplate('old')}
                  className="inline-flex items-center gap-1 underline hover:text-neutral-900 dark:hover:text-white py-1"
                >
                  <Download className="h-3 w-3" /> Blank template
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NEW URLS SECTION */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#111215]/75 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-neutral-400">STEP 2</span>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                  New URLs
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                URLs from your new website
              </p>
            </div>

            {newUrls.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {newUrls.length.toLocaleString()} new URLs imported
              </span>
            )}
          </div>

          {/* If already loaded, show clean summary with replace option */}
          {newUrls.length > 0 ? (
            <div className="space-y-3 pt-1">
              <div className="rounded-lg border border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50/70 dark:bg-[#0c0d10] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Dataset status</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    {newUrls.length.toLocaleString()} valid destinations imported
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate pt-0.5">
                  Sample: {newUrls[0]?.raw}
                </div>
              </div>

              {/* Validation notes if invalid rows found */}
              {newInvalidRows.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {newInvalidRows.length.toLocaleString()} row{newInvalidRows.length > 1 ? 's' : ''} skipped due to invalid URL format.
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-6">
                    <button
                      onClick={() => setInvalidModalSide('new')}
                      className="text-[11px] underline text-amber-900 dark:text-amber-200 hover:opacity-80 py-1"
                    >
                      Review invalid rows
                    </button>
                    <span className="text-[11px] text-neutral-400 hidden sm:inline">&bull;</span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Processing with valid URLs only
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => fileInputRefNew.current?.click()}
                  className="flex-1 sm:flex-initial rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111215] px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.04] transition-colors min-h-[38px]"
                >
                  Replace file
                </button>
                <input
                  ref={fileInputRefNew}
                  type="file"
                  accept=".csv,.tsv,.txt,.xml"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'new');
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => downloadBlankTemplate('new')}
                  className="flex-1 sm:flex-initial rounded-lg border border-neutral-200 dark:border-white/10 px-3.5 py-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white min-h-[38px]"
                >
                  Download template CSV
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Paste inputs when empty */
            <div className="space-y-3">
              {/* Segmented Mode Switch */}
              <div className="inline-flex p-1 rounded-lg bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200/60 dark:border-white/[0.06] text-xs">
                <button
                  onClick={() => setNewMode('upload')}
                  className={`py-1.5 px-3.5 font-medium rounded-md transition-all ${
                    newMode === 'upload'
                      ? 'bg-white dark:bg-[#18191e] text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Upload file
                </button>
                <button
                  onClick={() => setNewMode('paste')}
                  className={`py-1.5 px-3.5 font-medium rounded-md transition-all ${
                    newMode === 'paste'
                      ? 'bg-white dark:bg-[#18191e] text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Paste URLs
                </button>
              </div>

              {newMode === 'upload' ? (
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setDragActiveNew(true);
                  }}
                  onDragLeave={() => setDragActiveNew(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragActiveNew(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file, 'new');
                  }}
                  className={`border border-dashed rounded-xl p-6 sm:p-7 text-center transition-all ${
                    dragActiveNew
                      ? 'border-neutral-900 dark:border-white/40 bg-neutral-100/60 dark:bg-white/[0.04]'
                      : 'border-neutral-300 dark:border-white/[0.12] hover:border-neutral-400 dark:hover:border-white/20 bg-neutral-50/50 dark:bg-[#0c0d10]'
                  }`}
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#131418] text-neutral-700 dark:text-neutral-300 shadow-xs">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-xs font-medium text-neutral-900 dark:text-white">
                    Drag and drop file here, or browse files
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    Supports CSV, TSV, TXT, or sitemap.xml (up to 50,000+ URLs)
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => fileInputRefNew.current?.click()}
                      className="rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs min-h-[38px]"
                    >
                      Browse file
                    </button>
                    <input
                      ref={fileInputRefNew}
                      type="file"
                      accept=".csv,.tsv,.txt,.xml"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'new');
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={pasteNewText}
                    onChange={e => setPasteNewText(e.target.value)}
                    rows={6}
                    placeholder="https://new-site.com/about&#10;https://new-site.com/shop/item-1&#10;https://new-site.com/contact"
                    className="w-full rounded-lg border border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50 dark:bg-[#0c0d10] p-3 font-mono text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-white/20"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      One URL per line
                    </span>
                    <button
                      onClick={() => handlePasteSubmit('new')}
                      disabled={!pasteNewText.trim()}
                      className="w-full sm:w-auto rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40 min-h-[38px] shadow-xs"
                    >
                      Load pasted URLs
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                <span>Need a sample file header?</span>
                <button
                  onClick={() => downloadBlankTemplate('new')}
                  className="inline-flex items-center gap-1 underline hover:text-neutral-900 dark:hover:text-white py-1"
                >
                  <Download className="h-3 w-3" /> Blank template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3 & NEXT ACTION GUIDANCE BANNER */}
      <div className="rounded-xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111215] p-5 shadow-xs">
        {bothLoaded ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-neutral-400">STEP 3</span>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Datasets ready for matching
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Both datasets are loaded ({oldUrls.length.toLocaleString()} old &bull; {newUrls.length.toLocaleString()} new).
                Deterministic matching will pair paths, detect redirects, and check for loops.
              </p>
            </div>

            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 shrink-0 min-h-[42px] shadow-xs"
            >
              {isAnalyzing ? (
                <>
                  <span className="h-3 w-3 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  <span>{progress?.stage || 'Running matching engine...'}</span>
                </>
              ) : (
                <>
                  <span>Run matching</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        ) : oldUrls.length > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <span>Add your new destination URLs above to enable matching.</span>
            <span className="font-mono text-[11px] text-neutral-400">1 of 2 datasets loaded</span>
          </div>
        ) : newUrls.length > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <span>Add your legacy source URLs above to enable matching.</span>
            <span className="font-mono text-[11px] text-neutral-400">1 of 2 datasets loaded</span>
          </div>
        ) : (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center sm:text-left">
            Import your old and new URL lists above or click &ldquo;Load demo dataset&rdquo; to test immediately.
          </div>
        )}
      </div>

      {/* COLUMN PICKER MODAL (When multiple URL columns found in CSV) */}
      {columnPickerState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#111215]/95 backdrop-blur-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/[0.06] pb-3 shrink-0">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Select URL column
              </h3>
              <button
                onClick={() => setColumnPickerState(prev => ({ ...prev, isOpen: false }))}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Multiple columns in <code className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200">{columnPickerState.filename}</code> look like URLs.
              Which column contains the URLs you want to map?
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
              {columnPickerState.columns.map(col => (
                <label
                  key={col.index}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-xs cursor-pointer transition-colors min-h-[40px] ${
                    columnPickerState.selectedCol === col.index
                      ? 'border-neutral-900 dark:border-white/30 bg-neutral-100/70 dark:bg-white/[0.06] font-medium'
                      : 'border-neutral-200 dark:border-white/[0.06] hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="urlColumn"
                      checked={columnPickerState.selectedCol === col.index}
                      onChange={() => setColumnPickerState(prev => ({ ...prev, selectedCol: col.index }))}
                      className="accent-neutral-900 dark:accent-white h-4 w-4"
                    />
                    <span className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200">
                      {col.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">Col #{col.index + 1}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-neutral-100 dark:border-white/[0.06] shrink-0">
              {columnPickerState.columns.length >= 2 && (
                <button
                  onClick={handleImportBothColumns}
                  className="rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-white/[0.08] transition-colors min-h-[38px]"
                >
                  Import both Old &amp; New
                </button>
              )}
              <div className="flex items-center justify-end gap-2 ml-auto w-full sm:w-auto">
                <button
                  onClick={() => setColumnPickerState(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 sm:flex-initial rounded-lg border border-neutral-200 dark:border-white/10 px-3.5 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmColumnSelection}
                  className="flex-1 sm:flex-initial rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs min-h-[38px]"
                >
                  Import this column
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVALID ROWS MODAL */}
      {invalidModalSide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#111215]/95 backdrop-blur-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/[0.06] pb-3 shrink-0">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Invalid rows ({invalidModalSide === 'old' ? 'Old URLs' : 'New URLs'})
              </h3>
              <button
                onClick={() => setInvalidModalSide(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              These rows were skipped because they could not be parsed as valid URLs or paths.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(invalidModalSide === 'old' ? oldInvalidRows : newInvalidRows).map((row, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50 dark:bg-[#0c0d10] p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-neutral-400">
                    <span>Line {row.line}</span>
                    <span className="text-amber-600 dark:text-amber-400">{row.reason}</span>
                  </div>
                  <div className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200 break-all select-all">
                    {row.rawText}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-neutral-100 dark:border-white/[0.06] shrink-0">
              <button
                onClick={() => downloadInvalidRows(invalidModalSide)}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white py-2 min-h-[38px]"
              >
                <Download className="h-3 w-3" /> Download invalid rows CSV
              </button>
              <button
                onClick={() => setInvalidModalSide(null)}
                className="rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs min-h-[38px]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
