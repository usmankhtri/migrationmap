/**
 * MigrationMap - User-Friendly URL Import Experience
 * Step 1: Import Old URLs (existing website)
 * Step 2: Import New URLs (new website)
 * Provides drag-and-drop, file browser, direct paste, format hints,
 * friendly validation summaries, and guided next-action prompts.
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ClipboardList,
  ArrowRight,
  X,
  Download,
  RotateCcw,
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
    // Determine which is old and which is new
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Import URLs
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Add the old and new URLs for this migration. High-capacity engine supports 50,000+ URLs.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-2.5 py-1 text-[11px] text-neutral-600 dark:text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span>High-capacity engine: 50,000+ URLs supported</span>
        </div>
      </div>

      {/* Two Clear Sections: OLD URLS and NEW URLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* OLD URLS SECTION */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-neutral-400">STEP 1</span>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
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
            <div className="space-y-3 pt-2">
              <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 sm:p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Status</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {oldUrls.length.toLocaleString()} old URLs imported
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                  Sample: {oldUrls[0]?.raw}
                </div>
              </div>

              {/* Validation notes if invalid rows found */}
              {oldInvalidRows.length > 0 && (
                <div className="rounded border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Some rows don&apos;t contain valid URLs ({oldInvalidRows.length.toLocaleString()} rows).
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
                      Continuing with valid URLs
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    fileInputRefOld.current?.click();
                  }}
                  className="flex-1 sm:flex-initial rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors min-h-[38px]"
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
                  className="flex-1 sm:flex-initial rounded border border-neutral-200 dark:border-neutral-800 px-3.5 py-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white min-h-[38px]"
                >
                  Download CSV template
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Paste inputs when empty */
            <div className="space-y-3">
              {/* Mode switch */}
              <div className="flex border-b border-neutral-200 dark:border-neutral-800 text-xs">
                <button
                  onClick={() => setOldMode('upload')}
                  className={`pb-2.5 px-3.5 font-medium transition-colors border-b-2 -mb-px min-h-[38px] ${
                    oldMode === 'upload'
                      ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                      : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Upload file
                </button>
                <button
                  onClick={() => setOldMode('paste')}
                  className={`pb-2.5 px-3.5 font-medium transition-colors border-b-2 -mb-px min-h-[38px] ${
                    oldMode === 'paste'
                      ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                      : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
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
                  className={`border-2 border-dashed rounded-lg p-5 sm:p-6 text-center transition-colors ${
                    dragActiveOld
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100/50 dark:bg-neutral-800/40'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-950/50'
                  }`}
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    Drag and drop file here, or choose file
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    Supports CSV, TSV, TXT, or sitemap.xml
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => fileInputRefOld.current?.click()}
                      className="rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 transition-opacity min-h-[40px]"
                    >
                      Choose file
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
                    className="w-full rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-2.5 font-mono text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      One URL per line
                    </span>
                    <button
                      onClick={() => handlePasteSubmit('old')}
                      disabled={!pasteOldText.trim()}
                      className="w-full sm:w-auto rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-40 min-h-[38px]"
                    >
                      Load pasted URLs
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                <span>Need a sample header format?</span>
                <button
                  onClick={() => downloadBlankTemplate('old')}
                  className="inline-flex items-center gap-1 underline hover:text-neutral-800 dark:hover:text-neutral-200 py-1"
                >
                  <Download className="h-3 w-3" /> Blank CSV template
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NEW URLS SECTION */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-neutral-400">STEP 2</span>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                  New URLs
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                URLs from your new website
              </p>
            </div>

            {newUrls.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {newUrls.length.toLocaleString()} new URLs imported
              </span>
            )}
          </div>

          {/* If already loaded, show clean summary with replace option */}
          {newUrls.length > 0 ? (
            <div className="space-y-3 pt-2">
              <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Status</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {newUrls.length.toLocaleString()} new URLs imported
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                  Sample: {newUrls[0]?.raw}
                </div>
              </div>

              {/* Validation notes if invalid rows found */}
              {newInvalidRows.length > 0 && (
                <div className="rounded border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Some rows don&apos;t contain valid URLs ({newInvalidRows.length.toLocaleString()} rows).
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
                      Continuing with valid URLs
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => fileInputRefNew.current?.click()}
                  className="flex-1 sm:flex-initial rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors min-h-[38px]"
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
                  className="flex-1 sm:flex-initial rounded border border-neutral-200 dark:border-neutral-800 px-3.5 py-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white min-h-[38px]"
                >
                  Download CSV template
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Paste inputs when empty */
            <div className="space-y-3">
              {/* Mode switch */}
              <div className="flex border-b border-neutral-200 dark:border-neutral-800 text-xs">
                <button
                  onClick={() => setNewMode('upload')}
                  className={`pb-2.5 px-3.5 font-medium transition-colors border-b-2 -mb-px min-h-[38px] ${
                    newMode === 'upload'
                      ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                      : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Upload file
                </button>
                <button
                  onClick={() => setNewMode('paste')}
                  className={`pb-2.5 px-3.5 font-medium transition-colors border-b-2 -mb-px min-h-[38px] ${
                    newMode === 'paste'
                      ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                      : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
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
                  className={`border-2 border-dashed rounded-lg p-5 sm:p-6 text-center transition-colors ${
                    dragActiveNew
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100/50 dark:bg-neutral-800/40'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-950/50'
                  }`}
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    Drag and drop file here, or choose file
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    Supports CSV, TSV, TXT, or sitemap.xml
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => fileInputRefNew.current?.click()}
                      className="rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 transition-opacity min-h-[40px]"
                    >
                      Choose file
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
                    className="w-full rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-2.5 font-mono text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      One URL per line
                    </span>
                    <button
                      onClick={() => handlePasteSubmit('new')}
                      disabled={!pasteNewText.trim()}
                      className="w-full sm:w-auto rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-40 min-h-[38px]"
                    >
                      Load pasted URLs
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                <span>Need a sample header format?</span>
                <button
                  onClick={() => downloadBlankTemplate('new')}
                  className="inline-flex items-center gap-1 underline hover:text-neutral-800 dark:hover:text-neutral-200 py-1"
                >
                  <Download className="h-3 w-3" /> Blank CSV template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3 & NEXT ACTION GUIDANCE BANNER */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5">
        {bothLoaded ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-neutral-400">STEP 3</span>
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Ready to match URLs
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Both datasets are loaded ({oldUrls.length.toLocaleString()} old &bull; {newUrls.length.toLocaleString()} new).
                Run deterministic heuristics to match paths, slugs, and tokens.
              </p>
            </div>

            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2.5 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 min-h-[40px]"
            >
              {isAnalyzing ? (
                <>
                  <span className="h-3 w-3 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  <span>{progress?.stage || 'Running matching...'}</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-neutral-600 dark:text-neutral-400">
            <span>Add your new URL list to continue.</span>
            <span className="font-mono text-[11px] text-neutral-400">1 of 2 datasets loaded</span>
          </div>
        ) : newUrls.length > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-neutral-600 dark:text-neutral-400">
            <span>Add your old URL list to continue.</span>
            <span className="font-mono text-[11px] text-neutral-400">1 of 2 datasets loaded</span>
          </div>
        ) : (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center sm:text-left">
            Import your old and new URL lists above to begin matching.
          </div>
        )}
      </div>

      {/* COLUMN PICKER MODAL (When multiple URL columns found in CSV) */}
      {columnPickerState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xl space-y-4 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 shrink-0">
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Select URL column
              </h3>
              <button
                onClick={() => setColumnPickerState(prev => ({ ...prev, isOpen: false }))}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Multiple columns in <code className="font-mono text-[11px]">{columnPickerState.filename}</code> look like URLs.
              Which column contains the URLs you want to map?
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
              {columnPickerState.columns.map(col => (
                <label
                  key={col.index}
                  className={`flex items-center justify-between rounded border p-2.5 text-xs cursor-pointer transition-colors min-h-[40px] ${
                    columnPickerState.selectedCol === col.index
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800 font-medium'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="urlColumn"
                      checked={columnPickerState.selectedCol === col.index}
                      onChange={() => setColumnPickerState(prev => ({ ...prev, selectedCol: col.index }))}
                      className="accent-neutral-900 dark:accent-neutral-100 h-4 w-4"
                    />
                    <span className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200">
                      {col.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Column #{col.index + 1}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
              {columnPickerState.columns.length >= 2 && (
                <button
                  onClick={handleImportBothColumns}
                  className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors min-h-[38px]"
                >
                  Import both Old &amp; New URLs
                </button>
              )}
              <div className="flex items-center justify-end gap-2 ml-auto w-full sm:w-auto">
                <button
                  onClick={() => setColumnPickerState(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 sm:flex-initial rounded border border-neutral-200 dark:border-neutral-800 px-3.5 py-2 text-xs text-neutral-600 dark:text-neutral-400 min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmColumnSelection}
                  className="flex-1 sm:flex-initial rounded bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 min-h-[38px]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xl space-y-4 max-h-[85vh] flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 shrink-0">
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Invalid rows ({invalidModalSide === 'old' ? 'Old URLs' : 'New URLs'})
              </h3>
              <button
                onClick={() => setInvalidModalSide(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              These rows were skipped because they could not be parsed as valid absolute or relative URLs.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(invalidModalSide === 'old' ? oldInvalidRows : newInvalidRows).map((row, idx) => (
                <div
                  key={idx}
                  className="rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-2 text-xs space-y-1"
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

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
              <button
                onClick={() => downloadInvalidRows(invalidModalSide)}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white py-2 min-h-[38px]"
              >
                <Download className="h-3 w-3" /> Download invalid rows CSV
              </button>
              <button
                onClick={() => setInvalidModalSide(null)}
                className="rounded bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 min-h-[38px]"
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
