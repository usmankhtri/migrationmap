/**
 * MigrationMap - React Application Context
 * Centralized state management for URL datasets, deterministic matching,
 * review workflow, validation issues, and cookie persistence.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  NormalizedUrl,
  UrlMapping,
  MigrationIssue,
  NormalizationConfig,
  ConfidenceThresholds,
  ImportInvalidRow,
  EngineProgress,
  MappingStatus,
  ProjectBackupFile,
} from '../types/migration';
import { DEFAULT_NORMALIZATION_CONFIG, normalizeUrl } from '../utils/url';
import { DEFAULT_THRESHOLDS, matchUrlsBatch } from '../engine/matcher';
import { validateMigration } from '../engine/validator';
import {
  saveProject,
  loadProject,
  clearProject as clearProjectStorage,
} from '../utils/storage';
import { StoredProjectState } from '../utils/cookieStorage';

export type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6;
export type DashboardTab = 'overview' | 'mappings' | 'issues' | 'exports' | 'settings';
export type StorageStatus = 'none' | 'saved' | 'oversized' | 'corrupted';

interface MigrationContextType {
  oldUrls: NormalizedUrl[];
  newUrls: NormalizedUrl[];
  mappings: UrlMapping[];
  issues: MigrationIssue[];
  normalizationConfig: NormalizationConfig;
  thresholds: ConfidenceThresholds;
  oldInvalidRows: ImportInvalidRow[];
  newInvalidRows: ImportInvalidRow[];
  isAnalyzing: boolean;
  progress: EngineProgress | null;
  activeTab: DashboardTab;
  currentStep: WorkflowStep;
  hasStarted: boolean;
  storageStatus: StorageStatus;
  storageWarningDismissed: boolean;
  dismissStorageWarning: () => void;
  setActiveTab: (tab: DashboardTab) => void;
  setCurrentStep: (step: WorkflowStep) => void;
  startMigration: () => void;
  importOldUrls: (urls: NormalizedUrl[], invalidRows?: ImportInvalidRow[]) => void;
  importNewUrls: (urls: NormalizedUrl[], invalidRows?: ImportInvalidRow[]) => void;
  importBothUrls: (
    oldList: NormalizedUrl[],
    newList: NormalizedUrl[],
    oldInvalids?: ImportInvalidRow[],
    newInvalids?: ImportInvalidRow[]
  ) => void;
  runAnalysis: () => Promise<void>;
  updateMappingDestination: (mappingId: string, newDestinationUrl: string | null) => void;
  setMappingStatus: (mappingId: string, status: MappingStatus) => void;
  bulkSetStatus: (mappingIds: string[], status: MappingStatus) => void;
  resetMapping: (mappingId: string) => void;
  updateNormalizationConfig: (config: Partial<NormalizationConfig>) => void;
  updateThresholds: (thresholds: Partial<ConfidenceThresholds>) => void;
  clearProject: () => void;
  // History & Backup
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  exportProjectBackup: () => void;
  importProjectBackup: (jsonStr: string) => { success: boolean; error?: string };
  // Metrics
  metrics: {
    totalOld: number;
    totalNew: number;
    mappedCount: number;
    unmappedCount: number;
    approvedCount: number;
    needsReviewCount: number;
    suggestedCount: number;
    coveragePercent: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
    errorIssuesCount: number;
    warningIssuesCount: number;
    totalIssuesCount: number;
  };
}

const MigrationContext = createContext<MigrationContextType | undefined>(undefined);

export const MigrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [oldUrls, setOldUrls] = useState<NormalizedUrl[]>([]);
  const [newUrls, setNewUrls] = useState<NormalizedUrl[]>([]);
  const [mappings, setMappings] = useState<UrlMapping[]>([]);
  const [issues, setIssues] = useState<MigrationIssue[]>([]);
  const [oldInvalidRows, setOldInvalidRows] = useState<ImportInvalidRow[]>([]);
  const [newInvalidRows, setNewInvalidRows] = useState<ImportInvalidRow[]>([]);
  const [normalizationConfig, setNormalizationConfig] = useState<NormalizationConfig>(DEFAULT_NORMALIZATION_CONFIG);
  const [thresholds, setThresholds] = useState<ConfidenceThresholds>(DEFAULT_THRESHOLDS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<EngineProgress | null>(null);
  const [activeTab, setActiveTabState] = useState<DashboardTab>('overview');
  const [currentStep, setCurrentStepState] = useState<WorkflowStep>(1);
  const [hasStarted, setHasStarted] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('none');
  const [storageWarningDismissed, setStorageWarningDismissed] = useState(false);

  // Undo / Redo History Stack
  const historyRef = useRef<UrlMapping[][]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((newMappings: UrlMapping[]) => {
    const curHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    const updated = [...curHistory, newMappings];
    if (updated.length > 50) updated.shift();
    historyRef.current = updated;
    historyIndexRef.current = updated.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const target = historyRef.current[historyIndexRef.current];
      setMappings(target);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const target = historyRef.current[historyIndexRef.current];
      setMappings(target);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, []);

  // Keyboard shortcuts for Undo (Cmd/Ctrl+Z) and Redo (Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const initialLoadDone = useRef(false);

  // Synchronize step and tab
  const setCurrentStep = useCallback((step: WorkflowStep) => {
    setCurrentStepState(step);
    if (step === 1 || step === 2) {
      setActiveTabState('overview');
    } else if (step === 3) {
      setActiveTabState('overview');
    } else if (step === 4) {
      setActiveTabState('mappings');
    } else if (step === 5) {
      setActiveTabState('issues');
    } else if (step === 6) {
      setActiveTabState('exports');
    }
  }, []);

  const setActiveTab = useCallback((tab: DashboardTab) => {
    setActiveTabState(tab);
    if (tab === 'overview') {
      // determine if step 1, 2, or 3
      if (oldUrls.length === 0) setCurrentStepState(1);
      else if (newUrls.length === 0) setCurrentStepState(2);
      else setCurrentStepState(3);
    } else if (tab === 'mappings') {
      setCurrentStepState(4);
    } else if (tab === 'issues') {
      setCurrentStepState(5);
    } else if (tab === 'exports') {
      setCurrentStepState(6);
    }
  }, [oldUrls.length, newUrls.length]);

  // 1. Initial Load: Read and validate stored state from IndexedDB / Local persistence
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    loadProject().then(({ data, corrupted }) => {
      if (corrupted) {
        setStorageStatus('corrupted');
        return;
      }

      if (data && data.oldUrls && data.oldUrls.length > 0) {
        const config = data.normalizationConfig || DEFAULT_NORMALIZATION_CONFIG;
        const thresh = data.thresholds || DEFAULT_THRESHOLDS;

        const restoredOld = data.oldUrls.map(raw => normalizeUrl(raw, config));
        const restoredNew = (data.newUrls || []).map(raw => normalizeUrl(raw, config));
        const newUrlsMap = new Map<string, NormalizedUrl>();
        for (const nu of restoredNew) {
          newUrlsMap.set(nu.raw, nu);
        }

        const restoredMappings: UrlMapping[] = (data.mappings || []).map((m, idx) => {
          const oldNorm = normalizeUrl(m.oldUrl, config);
          const newNorm = m.newUrl ? (newUrlsMap.get(m.newUrl) || normalizeUrl(m.newUrl, config)) : null;

          return {
            id: m.id || `map-${idx}`,
            oldUrl: m.oldUrl,
            oldNormalized: oldNorm,
            newUrl: m.newUrl,
            newNormalized: newNorm,
            confidence: m.confidence,
            explanation: {
              primaryReason: m.reason || 'Restored mapping',
              confidenceBand: m.confidence >= thresh.veryStrongMin ? 'very_strong' : m.confidence >= thresh.needsReviewMin ? 'needs_review' : 'low',
              signals: [],
              summaryPoints: m.summaryPoints || [m.reason || 'Restored local project mapping'],
            },
            status: m.status,
            manuallyEdited: m.manuallyEdited,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        });

        setOldUrls(restoredOld);
        setNewUrls(restoredNew);
        setMappings(restoredMappings);
        setNormalizationConfig(config);
        setThresholds(thresh);
        setOldInvalidRows(data.oldInvalidRows || []);
        setNewInvalidRows(data.newInvalidRows || []);
        setHasStarted(true);
        setStorageStatus('saved');

        // Seed history stack
        if (restoredMappings.length > 0) {
          historyRef.current = [restoredMappings];
          historyIndexRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);
        }

        // Set logical step based on restored data
        if (restoredMappings.length > 0) {
          setCurrentStepState(4);
          setActiveTabState('mappings');
        } else if (restoredNew.length > 0) {
          setCurrentStepState(3);
          setActiveTabState('overview');
        } else {
          setCurrentStepState(2);
          setActiveTabState('overview');
        }
      }
    });
  }, []);

  // 2. Persist to storage when relevant user data changes (debounced)
  useEffect(() => {
    if (!initialLoadDone.current) return;

    // If completely empty, clean storage
    if (oldUrls.length === 0 && newUrls.length === 0) {
      clearProjectStorage();
      setStorageStatus('none');
      return;
    }

    const timer = setTimeout(async () => {
      const stateToPersist: StoredProjectState = {
        version: 1,
        savedAt: Date.now(),
        oldUrls: oldUrls.map(u => u.raw),
        newUrls: newUrls.map(u => u.raw),
        mappings: mappings.map(m => ({
          id: m.id,
          oldUrl: m.oldUrl,
          newUrl: m.newUrl,
          confidence: m.confidence,
          status: m.status,
          manuallyEdited: m.manuallyEdited,
          reason: m.explanation.primaryReason,
          summaryPoints: m.explanation.summaryPoints,
        })),
        normalizationConfig,
        thresholds,
        oldInvalidRows,
        newInvalidRows,
        hasStarted,
      };

      const result = await saveProject(stateToPersist);
      if (result.success) {
        setStorageStatus('saved');
      } else if (result.error === 'oversized') {
        setStorageStatus('oversized');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [oldUrls, newUrls, mappings, normalizationConfig, thresholds, oldInvalidRows, newInvalidRows, hasStarted]);

  // 3. Re-run validation whenever mappings or invalid rows change
  useEffect(() => {
    if (mappings.length > 0) {
      const detectedIssues = validateMigration(mappings, oldInvalidRows, newInvalidRows);
      setIssues(detectedIssues);
    } else {
      setIssues([]);
    }
  }, [mappings, oldInvalidRows, newInvalidRows]);

  const startMigration = useCallback(() => {
    setHasStarted(true);
    setCurrentStepState(1);
  }, []);

  const importOldUrls = useCallback((urls: NormalizedUrl[], invalidRows: ImportInvalidRow[] = []) => {
    setOldUrls(urls);
    setOldInvalidRows(invalidRows);
    setHasStarted(true);
    // If new URLs not imported yet, move to Step 2; if both ready, move to Step 3
    setNewUrls(prev => {
      if (prev.length === 0) {
        setCurrentStepState(2);
      } else {
        setCurrentStepState(3);
      }
      return prev;
    });
  }, []);

  const importNewUrls = useCallback((urls: NormalizedUrl[], invalidRows: ImportInvalidRow[] = []) => {
    setNewUrls(urls);
    setNewInvalidRows(invalidRows);
    setHasStarted(true);
    // If old URLs already loaded, prompt step 3 (matching)
    setOldUrls(prev => {
      if (prev.length > 0) {
        setCurrentStepState(3);
      } else {
        setCurrentStepState(1);
      }
      return prev;
    });
  }, []);

  const importBothUrls = useCallback((
    oldList: NormalizedUrl[],
    newList: NormalizedUrl[],
    oldInvalids: ImportInvalidRow[] = [],
    newInvalids: ImportInvalidRow[] = []
  ) => {
    setOldUrls(oldList);
    setNewUrls(newList);
    setOldInvalidRows(oldInvalids);
    setNewInvalidRows(newInvalids);
    setHasStarted(true);
    setCurrentStepState(3);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (oldUrls.length === 0) return;
    setIsAnalyzing(true);
    setProgress({ stage: 'Normalizing URL datasets...', current: 0, total: oldUrls.length, percentage: 5 });

    try {
      const generated = await matchUrlsBatch(oldUrls, newUrls, thresholds, p => {
        setProgress(p);
      });
      setMappings(generated);
      historyRef.current = [generated];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
      // Automatically advance to Step 4 (Review Mappings)
      setCurrentStepState(4);
      setActiveTabState('mappings');
    } catch (err) {
      console.error('Matching engine error:', err);
    } finally {
      setIsAnalyzing(false);
      setProgress(null);
    }
  }, [oldUrls, newUrls, thresholds]);

  const updateMappingDestination = useCallback((mappingId: string, newDestinationUrl: string | null) => {
    setMappings(prev => {
      const next = prev.map(m => {
        if (m.id !== mappingId) return m;

        if (!newDestinationUrl) {
          return {
            ...m,
            newUrl: null,
            newNormalized: null,
            status: 'unmapped' as MappingStatus,
            confidence: 0,
            manuallyEdited: true,
            updatedAt: Date.now(),
          };
        }

        const normNew = normalizeUrl(newDestinationUrl, normalizationConfig);
        return {
          ...m,
          newUrl: newDestinationUrl,
          newNormalized: normNew,
          status: 'manually_mapped' as MappingStatus,
          confidence: 100,
          manuallyEdited: true,
          explanation: {
            ...m.explanation,
            primaryReason: 'Manually specified destination',
            summaryPoints: ['Destination was manually assigned by user'],
          },
          updatedAt: Date.now(),
        };
      });
      pushHistory(next);
      return next;
    });
  }, [normalizationConfig, pushHistory]);

  const setMappingStatus = useCallback((mappingId: string, status: MappingStatus) => {
    setMappings(prev => {
      const next = prev.map(m => (m.id === mappingId ? { ...m, status, updatedAt: Date.now() } : m));
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const bulkSetStatus = useCallback((mappingIds: string[], status: MappingStatus) => {
    const idSet = new Set(mappingIds);
    setMappings(prev => {
      const next = prev.map(m => (idSet.has(m.id) ? { ...m, status, updatedAt: Date.now() } : m));
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const resetMapping = useCallback((mappingId: string) => {
    setMappings(prev => {
      const next = prev.map(m => {
        if (m.id !== mappingId) return m;
        return {
          ...m,
          status: (m.confidence >= thresholds.needsReviewMin ? 'suggested' : 'needs_review') as MappingStatus,
          manuallyEdited: false,
          updatedAt: Date.now(),
        };
      });
      pushHistory(next);
      return next;
    });
  }, [thresholds, pushHistory]);

  const updateNormalizationConfig = useCallback((config: Partial<NormalizationConfig>) => {
    setNormalizationConfig(prev => ({ ...prev, ...config }));
  }, []);

  const updateThresholds = useCallback((newThresh: Partial<ConfidenceThresholds>) => {
    setThresholds(prev => ({ ...prev, ...newThresh }));
  }, []);

  // Clear Project - completely deletes local storage and resets in-memory state
  const clearProject = useCallback(() => {
    clearProjectStorage();
    setOldUrls([]);
    setNewUrls([]);
    setMappings([]);
    historyRef.current = [];
    historyIndexRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
    setIssues([]);
    setOldInvalidRows([]);
    setNewInvalidRows([]);
    setHasStarted(false);
    setCurrentStepState(1);
    setStorageStatus('none');
    setActiveTabState('overview');
  }, []);

  // Export Project Backup (JSON)
  const exportProjectBackup = useCallback(() => {
    const backup: ProjectBackupFile = {
      format: 'migrationmap_project_backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      sourceApp: 'MigrationMap',
      project: {
        oldUrls: oldUrls.map(u => u.raw),
        newUrls: newUrls.map(u => u.raw),
        mappings: mappings.map(m => ({
          id: m.id,
          oldUrl: m.oldUrl,
          newUrl: m.newUrl,
          confidence: m.confidence,
          status: m.status,
          manuallyEdited: m.manuallyEdited,
          reason: m.explanation.primaryReason,
          summaryPoints: m.explanation.summaryPoints,
        })),
        normalizationConfig,
        thresholds,
        oldInvalidRows,
        newInvalidRows,
        hasStarted,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migrationmap-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [oldUrls, newUrls, mappings, normalizationConfig, thresholds, oldInvalidRows, newInvalidRows, hasStarted]);

  // Import Project Backup (JSON)
  const importProjectBackup = useCallback((jsonStr: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || parsed.format !== 'migrationmap_project_backup' || !parsed.project) {
        return { success: false, error: 'Invalid backup file format. Expected a MigrationMap project backup JSON.' };
      }

      const p = parsed.project;
      const config = p.normalizationConfig || DEFAULT_NORMALIZATION_CONFIG;
      const thresh = p.thresholds || DEFAULT_THRESHOLDS;

      const restoredOld = (p.oldUrls || []).map((raw: string) => normalizeUrl(raw, config));
      const restoredNew = (p.newUrls || []).map((raw: string) => normalizeUrl(raw, config));
      const newUrlsMap = new Map<string, NormalizedUrl>();
      for (const nu of restoredNew) {
        newUrlsMap.set(nu.raw, nu);
      }

      const restoredMappings: UrlMapping[] = (p.mappings || []).map((m: any, idx: number) => {
        const oldNorm = normalizeUrl(m.oldUrl, config);
        const newNorm = m.newUrl ? (newUrlsMap.get(m.newUrl) || normalizeUrl(m.newUrl, config)) : null;

        return {
          id: m.id || `map-${idx}`,
          oldUrl: m.oldUrl,
          oldNormalized: oldNorm,
          newUrl: m.newUrl,
          newNormalized: newNorm,
          confidence: typeof m.confidence === 'number' ? m.confidence : 0,
          explanation: {
            primaryReason: m.reason || 'Restored backup mapping',
            confidenceBand: m.confidence >= thresh.veryStrongMin ? 'very_strong' : m.confidence >= thresh.needsReviewMin ? 'needs_review' : 'low',
            signals: [],
            summaryPoints: m.summaryPoints || [m.reason || 'Restored from project backup'],
          },
          status: m.status || 'suggested',
          manuallyEdited: m.manuallyEdited,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      });

      setOldUrls(restoredOld);
      setNewUrls(restoredNew);
      setMappings(restoredMappings);
      setNormalizationConfig(config);
      setThresholds(thresh);
      setOldInvalidRows(p.oldInvalidRows || []);
      setNewInvalidRows(p.newInvalidRows || []);
      setHasStarted(true);
      setStorageStatus('saved');

      historyRef.current = [restoredMappings];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);

      if (restoredMappings.length > 0) {
        setCurrentStepState(4);
        setActiveTabState('mappings');
      } else if (restoredNew.length > 0) {
        setCurrentStepState(3);
        setActiveTabState('overview');
      } else {
        setCurrentStepState(1);
        setActiveTabState('overview');
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to parse project backup JSON.' };
    }
  }, []);

  const dismissStorageWarning = useCallback(() => {
    setStorageWarningDismissed(true);
  }, []);

  // Compute live metrics
  const totalOld = oldUrls.length;
  const totalNew = newUrls.length;
  const mappedCount = mappings.filter(m => m.newUrl && m.status !== 'unmapped').length;
  const unmappedCount = mappings.filter(m => !m.newUrl || m.status === 'unmapped').length;
  const approvedCount = mappings.filter(m => m.status === 'approved' || m.status === 'manually_mapped').length;
  const needsReviewCount = mappings.filter(m => m.status === 'needs_review').length;
  const suggestedCount = mappings.filter(m => m.status === 'suggested').length;
  const coveragePercent = totalOld > 0 ? Math.round((mappedCount / totalOld) * 100) : 0;

  const highConfidenceCount = mappings.filter(m => m.confidence >= thresholds.veryStrongMin).length;
  const mediumConfidenceCount = mappings.filter(
    m => m.confidence >= thresholds.needsReviewMin && m.confidence < thresholds.veryStrongMin
  ).length;
  const lowConfidenceCount = mappings.filter(m => m.confidence < thresholds.needsReviewMin).length;

  const errorIssuesCount = issues.filter(i => i.severity === 'error').length;
  const warningIssuesCount = issues.filter(i => i.severity === 'warning').length;
  const totalIssuesCount = issues.length;

  return (
    <MigrationContext.Provider
      value={{
        oldUrls,
        newUrls,
        mappings,
        issues,
        normalizationConfig,
        thresholds,
        oldInvalidRows,
        newInvalidRows,
        isAnalyzing,
        progress,
        activeTab,
        currentStep,
        hasStarted,
        storageStatus,
        storageWarningDismissed,
        dismissStorageWarning,
        setActiveTab,
        setCurrentStep,
        startMigration,
        importOldUrls,
        importNewUrls,
        importBothUrls,
        runAnalysis,
        updateMappingDestination,
        setMappingStatus,
        bulkSetStatus,
        resetMapping,
        updateNormalizationConfig,
        updateThresholds,
        clearProject,
        undo,
        redo,
        canUndo,
        canRedo,
        exportProjectBackup,
        importProjectBackup,
        metrics: {
          totalOld,
          totalNew,
          mappedCount,
          unmappedCount,
          approvedCount,
          needsReviewCount,
          suggestedCount,
          coveragePercent,
          highConfidenceCount,
          mediumConfidenceCount,
          lowConfidenceCount,
          errorIssuesCount,
          warningIssuesCount,
          totalIssuesCount,
        },
      }}
    >
      {children}
    </MigrationContext.Provider>
  );
};

export function useMigration(): MigrationContextType {
  const context = useContext(MigrationContext);
  if (!context) {
    throw new Error('useMigration must be used within a MigrationProvider');
  }
  return context;
}
