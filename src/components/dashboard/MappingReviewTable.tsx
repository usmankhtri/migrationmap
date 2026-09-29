/**
 * MigrationMap - User-Friendly Mapping Review Table
 * Prioritizes readability, clear headings, graceful URL truncation,
 * copy-to-clipboard, fast inline actions (Approve, Edit, Reject),
 * and the 4-card summary (Mapped, Needs review, Unmapped, Issues).
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  X,
  Edit2,
  Copy,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useMigration } from '../../context/MigrationContext';
import { UrlMapping, MappingStatus } from '../../types/migration';

export const MappingReviewTable: React.FC = () => {
  const {
    mappings,
    newUrls,
    setMappingStatus,
    updateMappingDestination,
    bulkSetStatus,
    resetMapping,
    thresholds,
    metrics,
    setActiveTab,
    setCurrentStep,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMigration();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<'oldUrl' | 'newUrl' | 'confidence' | 'status' | 'none'>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Edit Destination Modal State
  const [editingMapping, setEditingMapping] = useState<UrlMapping | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [customDestinationInput, setCustomDestinationInput] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = (field: 'oldUrl' | 'newUrl' | 'confidence' | 'status') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField('none');
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Filtered Mappings
  const filteredMappings = useMemo(() => {
    let result = [...mappings];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        m =>
          m.oldUrl.toLowerCase().includes(q) ||
          (m.newUrl && m.newUrl.toLowerCase().includes(q)) ||
          m.explanation.primaryReason.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'mapped') {
        result = result.filter(m => m.newUrl && m.status !== 'unmapped');
      } else if (statusFilter === 'needs_review') {
        result = result.filter(m => m.status === 'needs_review');
      } else if (statusFilter === 'unmapped') {
        result = result.filter(m => !m.newUrl || m.status === 'unmapped');
      } else if (statusFilter === 'approved') {
        result = result.filter(m => m.status === 'approved' || m.status === 'manually_mapped');
      } else if (statusFilter === 'rejected') {
        result = result.filter(m => m.status === 'rejected');
      } else if (statusFilter === 'low_confidence') {
        result = result.filter(m => m.confidence < thresholds.needsReviewMin);
      }
    }

    if (sortField !== 'none') {
      result.sort((a, b) => {
        let cmp = 0;
        if (sortField === 'oldUrl') cmp = a.oldUrl.localeCompare(b.oldUrl);
        else if (sortField === 'newUrl') cmp = (a.newUrl || '').localeCompare(b.newUrl || '');
        else if (sortField === 'confidence') cmp = a.confidence - b.confidence;
        else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
        return sortDirection === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [mappings, searchQuery, statusFilter, sortField, sortDirection, thresholds]);

  const totalPages = Math.max(1, Math.ceil(filteredMappings.length / pageSize));
  const paginatedMappings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMappings.slice(start, start + pageSize);
  }, [filteredMappings, currentPage, pageSize]);

  const toggleSelectAllPage = () => {
    const pageIds = paginatedMappings.map(m => m.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  const openEditModal = (m: UrlMapping) => {
    setEditingMapping(m);
    setSelectedDestination(m.newUrl || '');
    setCustomDestinationInput('');
    setDestinationSearch('');
  };

  const handleSaveEdit = () => {
    if (!editingMapping) return;
    const finalDest = customDestinationInput.trim() || selectedDestination || null;
    updateMappingDestination(editingMapping.id, finalDest);
    setEditingMapping(null);
  };

  // Filtered candidate list for the edit picker
  const filteredDestinations = useMemo(() => {
    if (!destinationSearch.trim()) {
      return newUrls.slice(0, 50);
    }
    const q = destinationSearch.toLowerCase();
    return newUrls.filter(u => u.raw.toLowerCase().includes(q)).slice(0, 50);
  }, [newUrls, destinationSearch]);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= thresholds.veryStrongMin) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-800 dark:text-neutral-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
          {confidence}%
        </span>
      );
    }
    if (confidence >= thresholds.needsReviewMin) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
          {confidence}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 inline-block" />
        {confidence}%
      </span>
    );
  };

  const getStatusBadge = (status: MappingStatus) => {
    switch (status) {
      case 'approved':
      case 'manually_mapped':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Approved
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Needs review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            Rejected
          </span>
        );
      case 'unmapped':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700">
            Unmapped
          </span>
        );
      case 'suggested':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
            Suggested
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Clean Summary Cards (Requirement #10) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {/* Card 1: Mapped */}
        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'mapped' ? 'all' : 'mapped');
            setCurrentPage(1);
          }}
          className={`rounded-lg border p-3 sm:p-4 text-left transition-colors min-h-[78px] ${
            statusFilter === 'mapped'
              ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/60'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700'
          }`}
        >
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Mapped</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.mappedCount.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 truncate">
            {metrics.coveragePercent}% of source URLs
          </div>
        </button>

        {/* Card 2: Needs Review */}
        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'needs_review' ? 'all' : 'needs_review');
            setCurrentPage(1);
          }}
          className={`rounded-lg border p-3 sm:p-4 text-left transition-colors min-h-[78px] ${
            statusFilter === 'needs_review'
              ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/60'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700'
          }`}
        >
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Needs review</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.needsReviewCount.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 truncate">
            Review recommended
          </div>
        </button>

        {/* Card 3: Unmapped */}
        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'unmapped' ? 'all' : 'unmapped');
            setCurrentPage(1);
          }}
          className={`rounded-lg border p-3 sm:p-4 text-left transition-colors min-h-[78px] ${
            statusFilter === 'unmapped'
              ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/60'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700'
          }`}
        >
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Unmapped</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.unmappedCount.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 truncate">
            No destination found
          </div>
        </button>

        {/* Card 4: Issues */}
        <button
          onClick={() => {
            setCurrentStep(5);
            setActiveTab('issues');
          }}
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4 text-left hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors min-h-[78px]"
        >
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Issues</div>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-semibold font-mono text-neutral-900 dark:text-neutral-100 truncate">
            {metrics.totalIssuesCount.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-neutral-400 truncate">
            {metrics.errorIssuesCount > 0 ? `${metrics.errorIssuesCount} critical` : 'Checks clean'}
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        {/* Search Input - Full width on all devices */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search URLs, paths, or match reasons..."
            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 pl-9 pr-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 min-h-[38px]"
          />
        </div>

        {/* Controls Row: Status filter, Sort selector, Undo/Redo, Bulk action */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Status filter select */}
            <div className="flex-1 sm:flex-initial min-w-[140px]">
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none min-h-[36px]"
                aria-label="Filter by status"
              >
                <option value="all">All statuses ({mappings.length})</option>
                <option value="mapped">Mapped only</option>
                <option value="needs_review">Needs review</option>
                <option value="low_confidence">Low confidence (&lt;50%)</option>
                <option value="approved">Approved</option>
                <option value="unmapped">Unmapped</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Sort selector (visible on all screens, especially crucial for mobile) */}
            <div className="flex-1 sm:flex-initial min-w-[130px]">
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'none-asc') {
                    setSortField('none');
                    setSortDirection('asc');
                  } else {
                    const [f, d] = val.split('-') as ['oldUrl' | 'newUrl' | 'confidence' | 'status', 'asc' | 'desc'];
                    setSortField(f);
                    setSortDirection(d);
                  }
                }}
                className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none min-h-[36px]"
                aria-label="Sort mappings"
              >
                <option value="none-asc">Default sort</option>
                <option value="oldUrl-asc">Old URL (A-Z)</option>
                <option value="oldUrl-desc">Old URL (Z-A)</option>
                <option value="newUrl-asc">New URL (A-Z)</option>
                <option value="newUrl-desc">New URL (Z-A)</option>
                <option value="confidence-desc">Confidence (High → Low)</option>
                <option value="confidence-asc">Confidence (Low → High)</option>
                <option value="status-asc">Status (A-Z)</option>
              </select>
            </div>

            {/* Undo and Redo buttons */}
            <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-white dark:bg-neutral-900 shrink-0">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo mapping edit (Ctrl+Z)"
                aria-label="Undo"
                className="p-1.5 rounded text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo mapping edit (Ctrl+Y)"
                aria-label="Redo"
                className="p-1.5 rounded text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Bulk Approve for current page */}
          <button
            onClick={() => {
              const idsToApprove = paginatedMappings
                .filter(m => m.newUrl && m.status !== 'approved')
                .map(m => m.id);
              if (idsToApprove.length > 0) {
                bulkSetStatus(idsToApprove, 'approved');
              }
            }}
            className="w-full sm:w-auto rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap min-h-[36px]"
          >
            Approve page ({paginatedMappings.filter(m => m.newUrl && m.status !== 'approved').length})
          </button>
        </div>
      </div>

      {/* Bulk Action Toolbar (when >=1 mapping selected) */}
      {selectedIds.size > 0 && (
        <div className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/80 p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {selectedIds.size} mapping{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-[11px] text-neutral-500 hover:underline hover:text-neutral-800 dark:hover:text-neutral-200 py-1 px-1.5"
            >
              Clear selection
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                bulkSetStatus(Array.from(selectedIds), 'approved');
                clearSelection();
              }}
              className="flex-1 sm:flex-initial rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-medium transition-colors min-h-[34px]"
            >
              Approve selected ({selectedIds.size})
            </button>
            <button
              onClick={() => {
                bulkSetStatus(Array.from(selectedIds), 'rejected');
                clearSelection();
              }}
              className="flex-1 sm:flex-initial rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-3 py-1.5 font-medium transition-colors min-h-[34px]"
            >
              Reject selected
            </button>
            <button
              onClick={() => {
                bulkSetStatus(Array.from(selectedIds), 'unmapped');
                clearSelection();
              }}
              className="flex-1 sm:flex-initial rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-3 py-1.5 font-medium transition-colors min-h-[34px]"
            >
              Mark unmapped
            </button>
          </div>
        </div>
      )}

      {/* MOBILE MAPPING CARDS LIST (< 768px) - Intelligent Responsive Restructuring */}
      <div className="block md:hidden space-y-3">
        {/* Mobile Select All Header */}
        {paginatedMappings.length > 0 && (
          <div className="flex items-center justify-between px-1 py-1 text-xs text-neutral-500 dark:text-neutral-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={paginatedMappings.length > 0 && paginatedMappings.every(m => selectedIds.has(m.id))}
                onChange={toggleSelectAllPage}
                className="rounded border-neutral-300 dark:border-neutral-700 accent-neutral-900 dark:accent-neutral-100 h-4 w-4"
              />
              <span className="text-[11px] font-medium">Select all {paginatedMappings.length} on page</span>
            </label>
            <span className="text-[11px] font-mono">
              {filteredMappings.length} total
            </span>
          </div>
        )}

        {paginatedMappings.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center text-neutral-500 text-xs">
            No mappings found matching your search or filters.
          </div>
        ) : (
          paginatedMappings.map(m => {
            const isSelected = selectedIds.has(m.id);
            return (
              <div
                key={m.id}
                className={`rounded-lg border transition-colors bg-white dark:bg-neutral-900 p-3.5 space-y-3 shadow-xs ${
                  isSelected
                    ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50/80 dark:bg-neutral-800/40 ring-1 ring-neutral-900/20 dark:ring-neutral-100/20'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {/* Card Top Row: Checkbox + Status Badge + Confidence + Copy */}
                <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(m.id)}
                      className="rounded border-neutral-300 dark:border-neutral-700 accent-neutral-900 dark:accent-neutral-100 h-4 w-4"
                      aria-label={`Select ${m.oldUrl}`}
                    />
                    {getStatusBadge(m.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {getConfidenceBadge(m.confidence)}
                  </div>
                </div>

                {/* Old URL Section */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                    <span>Source (Old URL)</span>
                    <button
                      onClick={() => handleCopy(m.oldUrl)}
                      className="inline-flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1"
                      title="Copy old URL"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedUrl === m.oldUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-neutral-900 dark:text-neutral-100 break-all leading-snug select-all bg-neutral-50/70 dark:bg-neutral-950/60 p-2 rounded border border-neutral-100 dark:border-neutral-800/80">
                    {m.oldUrl}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-0.5">
                    Signal: {m.explanation.primaryReason}
                  </div>
                </div>

                {/* Arrow Divider */}
                <div className="flex items-center justify-center -my-1 text-neutral-300 dark:text-neutral-700">
                  <span className="text-xs">↓</span>
                </div>

                {/* New URL Section */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                    <span>Destination (New URL)</span>
                    {m.newUrl && (
                      <button
                        onClick={() => handleCopy(m.newUrl!)}
                        className="inline-flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1"
                        title="Copy new URL"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedUrl === m.newUrl ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                  <div className="font-mono text-xs text-neutral-800 dark:text-neutral-200 break-all leading-snug select-all bg-neutral-50/70 dark:bg-neutral-950/60 p-2 rounded border border-neutral-100 dark:border-neutral-800/80">
                    {m.newUrl ? (
                      m.newUrl
                    ) : (
                      <span className="text-neutral-400 italic">No destination mapped</span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons (Edit, Approve, Reject) */}
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => openEditModal(m)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors min-h-[38px]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  {m.status !== 'approved' && m.newUrl && (
                    <button
                      onClick={() => setMappingStatus(m.id, 'approved')}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors min-h-[38px]"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  )}

                  {m.status !== 'rejected' && (
                    <button
                      onClick={() => setMappingStatus(m.id, 'rejected')}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors min-h-[38px]"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE (>= 768px) - Professional Workspace Table */}
      <div className="hidden md:block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={paginatedMappings.length > 0 && paginatedMappings.every(m => selectedIds.has(m.id))}
                    onChange={toggleSelectAllPage}
                    className="rounded border-neutral-300 dark:border-neutral-700 accent-neutral-900 dark:accent-neutral-100"
                    aria-label="Select all on this page"
                  />
                </th>
                <th
                  onClick={() => handleSort('oldUrl')}
                  className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Old URL</span>
                    {sortField === 'oldUrl' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('newUrl')}
                  className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <div className="flex items-center gap-1">
                    <span>New URL</span>
                    {sortField === 'newUrl' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('confidence')}
                  className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Confidence</span>
                    {sortField === 'confidence' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    No mappings found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedMappings.map(m => {
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors ${
                        selectedIds.has(m.id) ? 'bg-neutral-100/60 dark:bg-neutral-800/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(m.id)}
                          onChange={() => toggleSelect(m.id)}
                          className="rounded border-neutral-300 dark:border-neutral-700 accent-neutral-900 dark:accent-neutral-100"
                          aria-label={`Select mapping for ${m.oldUrl}`}
                        />
                      </td>

                      {/* Old URL */}
                      <td className="py-3 px-4 max-w-[280px] lg:max-w-xs">
                        <div className="flex items-center gap-1.5 group">
                          <span
                            className="font-mono text-xs text-neutral-900 dark:text-neutral-100 truncate"
                            title={m.oldUrl}
                          >
                            {m.oldUrl}
                          </span>
                          <button
                            onClick={() => handleCopy(m.oldUrl)}
                            title="Copy old URL"
                            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity p-0.5 shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
                          {m.explanation.primaryReason}
                        </div>
                      </td>

                      {/* New URL */}
                      <td className="py-3 px-4 max-w-[280px] lg:max-w-xs">
                        {m.newUrl ? (
                          <div className="flex items-center gap-1.5 group">
                            <span
                              className="font-mono text-xs text-neutral-800 dark:text-neutral-200 truncate"
                              title={m.newUrl}
                            >
                              {m.newUrl}
                            </span>
                            <button
                              onClick={() => handleCopy(m.newUrl!)}
                              title="Copy new URL"
                              className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity p-0.5 shrink-0"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 italic">No destination mapped</span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getConfidenceBadge(m.confidence)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(m.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Approve action */}
                          {m.status !== 'approved' && m.newUrl && (
                            <button
                              onClick={() => setMappingStatus(m.id, 'approved')}
                              className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Approve mapping"
                            >
                              Approve
                            </button>
                          )}

                          {/* Edit action */}
                          <button
                            onClick={() => openEditModal(m)}
                            className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            title="Edit destination URL"
                          >
                            Edit
                          </button>

                          {/* Reject action */}
                          {m.status !== 'rejected' && (
                            <button
                              onClick={() => setMappingStatus(m.id, 'rejected')}
                              className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                              title="Reject mapping"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <span>
            Showing {filteredMappings.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredMappings.length)} of {filteredMappings.length.toLocaleString()} mappings
          </span>
          <div className="flex items-center gap-1.5 border-l border-neutral-200 dark:border-neutral-800 pl-3">
            <span className="text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-1.5 py-0.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 min-h-[34px]"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="px-2 font-mono text-[11px]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 min-h-[34px]"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* EDIT DESTINATION MODAL (Requirement #16) */}
      {editingMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xl space-y-3.5 max-h-[92vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Edit mapping
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Update the target destination for this legacy URL.
                </p>
              </div>
              <button
                onClick={() => setEditingMapping(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 -mr-1"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="space-y-3.5 overflow-y-auto flex-1 pr-0.5">
              {/* Old URL display */}
              <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-2.5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold block">
                  Old URL (Source)
                </span>
                <p className="font-mono text-xs text-neutral-800 dark:text-neutral-200 break-all select-all">
                  {editingMapping.oldUrl}
                </p>
              </div>

              {/* Arrow Indicator */}
              <div className="flex items-center justify-center -my-1 text-neutral-400 text-xs">
                <span>↓</span>
              </div>

              {/* Choose the new URL with search */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                  Choose destination from new site:
                </label>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={destinationSearch}
                    onChange={e => setDestinationSearch(e.target.value)}
                    placeholder="Search candidate destinations..."
                    className="w-full rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 pl-8 pr-2.5 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none min-h-[38px]"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-950 divide-y divide-neutral-200 dark:divide-neutral-800">
                  {filteredDestinations.length === 0 ? (
                    <div className="p-3 text-center text-xs text-neutral-400">
                      No matching destinations found. Enter a custom path below.
                    </div>
                  ) : (
                    filteredDestinations.map(u => (
                      <div
                        key={u.raw}
                        onClick={() => {
                          setSelectedDestination(u.raw);
                          setCustomDestinationInput('');
                        }}
                        className={`p-2.5 text-xs font-mono cursor-pointer break-all flex justify-between items-center transition-colors min-h-[38px] ${
                          selectedDestination === u.raw
                            ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                        }`}
                      >
                        <span className="truncate pr-2">{u.raw}</span>
                        {selectedDestination === u.raw && (
                          <Check className="h-3.5 w-3.5 text-neutral-900 dark:text-neutral-100 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Custom URL Option */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 block">
                  Or enter custom URL path:
                </label>
                <input
                  type="text"
                  value={customDestinationInput}
                  onChange={e => {
                    setCustomDestinationInput(e.target.value);
                    setSelectedDestination('');
                  }}
                  placeholder="/new-page or https://domain.com/path"
                  className="w-full rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2.5 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none min-h-[38px]"
                />
              </div>
            </div>

            {/* Modal actions - Responsive Layout */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
              <button
                onClick={() => {
                  updateMappingDestination(editingMapping.id, null);
                  setEditingMapping(null);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 py-2 sm:py-1 text-center sm:text-left min-h-[36px]"
              >
                Mark as unmapped
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingMapping(null)}
                  className="flex-1 sm:flex-initial rounded border border-neutral-200 dark:border-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 sm:flex-initial rounded bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 min-h-[38px]"
                >
                  Save mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
