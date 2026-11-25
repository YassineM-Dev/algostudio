import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar, WorkspaceId } from './components/TopBar';
import { IdeWorkspace } from './workspaces/IdeWorkspace';
import { ResumesWorkspace } from './workspaces/ResumesWorkspace';
import { ModulesWorkspace } from './workspaces/ModulesWorkspace';
import { SujetsBacWorkspace } from './workspaces/SujetsBacWorkspace';
import { LockGate } from './components/LockGate';
import { UpdateBanner } from './components/UpdateBanner';
import type { AlgoUpdateStatus } from './vite-env';
import type { AlgoFileTab } from './components/CodeEditorPanel';
import type { ConsoleEntry, PendingInputRequest } from './components/ConsoleDebuggerPanel';
import { DEFAULT_ALGO_CODE, DEFAULT_ALGO_FILENAME } from './data/defaultCode';
import { formatPseudocode, runPseudocode, TraceEntry, VariableSnapshot } from './engine';

const STORAGE_FILES_KEY = 'algostudio_files_v3';
const STORAGE_ACTIVE_KEY = 'algostudio_active_file_v3';
const STORAGE_THEME_KEY = 'algostudio_theme_v1';
const ACCESS_PASSWORD = ['15', '08', '20', '08'].join('');

const createNewTemplate = (algoName: string) => `Algorithme ${algoName}
Début
    Ecrire("Bonjour AlgoStudio !")
Fin
`;

function loadInitialFiles(): AlgoFileTab[] {
  try {
    const raw = localStorage.getItem(STORAGE_FILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AlgoFileTab[];
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((f) => f.id && f.name)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [
    {
      id: 'file-1',
      name: DEFAULT_ALGO_FILENAME,
      code: DEFAULT_ALGO_CODE,
    },
  ];
}

export function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('ide');
  const [resourcesUnlocked, setResourcesUnlocked] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<AlgoUpdateStatus>({ state: 'idle' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Multi-file state
  const [files, setFiles] = useState<AlgoFileTab[]>(loadInitialFiles);
  const [activeFileId, setActiveFileId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_KEY);
      const init = loadInitialFiles();
      if (savedId && init.some((f) => f.id === savedId)) return savedId;
      return init[0].id;
    } catch {
      return 'file-1';
    }
  });

  const activeFile = files.find((f) => f.id === activeFileId) ?? files[0];

  // Execution & Console state lifted to App so TopBar "Run" menu works seamlessly everywhere!
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [pendingInput, setPendingInput] = useState<PendingInputRequest | null>(null);
  const [variables, setVariables] = useState<VariableSnapshot[]>([]);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [executionMeta, setExecutionMeta] = useState<{ steps: number; durationMs: number } | null>(
    null
  );

  const nextEntryId = useRef(1);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputResolverRef = useRef<((val: string) => void) | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(files));
      localStorage.setItem(STORAGE_ACTIVE_KEY, activeFile.id);
    } catch {
      // ignore
    }
  }, [files, activeFile.id]);

  const appendEntry = useCallback((entry: Omit<ConsoleEntry, 'id'>) => {
    setEntries((prev) => [...prev, { ...entry, id: nextEntryId.current++ }]);
  }, []);

  const handleClearConsole = useCallback(() => {
    setEntries([]);
    setErrorLine(null);
    setExecutionMeta(null);
  }, []);

  const handleStop = useCallback(() => {
    const ctrl = abortControllerRef.current;
    abortControllerRef.current = null;
    ctrl?.abort();
    if (inputResolverRef.current) {
      inputResolverRef.current('');
      inputResolverRef.current = null;
    }
    setPendingInput(null);
    setIsRunning(false);
    appendEntry({ kind: 'system', text: 'Exécution interrompue.' });
  }, [appendEntry]);

  const handleSubmitInput = useCallback(
    (value: string) => {
      if (!inputResolverRef.current) return;
      appendEntry({ kind: 'input', text: value });
      const resolve = inputResolverRef.current;
      inputResolverRef.current = null;
      setPendingInput(null);
      resolve(value);
    },
    [appendEntry]
  );

  const executeSource = useCallback(
    async (sourceToRun: string) => {
      const prev = abortControllerRef.current;
      abortControllerRef.current = null;
      prev?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setActiveWorkspace('ide');
      setEntries([]);
      setErrorLine(null);
      setPendingInput(null);
      setVariables([]);
      setTrace([]);
      setExecutionMeta(null);
      setIsRunning(true);

      const result = await runPseudocode(sourceToRun, {
        signal: controller.signal,
        onWrite: (text, line) => {
          appendEntry({ kind: 'output', text, line });
        },
        onRead: (targetName, typeHint, line) =>
          new Promise<string>((resolve) => {
            inputResolverRef.current = resolve;
            setPendingInput({ targetName, typeHint, line });
          }),
        onVariablesUpdate: (vars) => {
          setVariables(vars);
        },
      });

      if (abortControllerRef.current !== controller) return;

      setPendingInput(null);
      inputResolverRef.current = null;
      setIsRunning(false);
      setVariables(result.variables);
      setTrace(result.trace);
      setExecutionMeta({ steps: result.stepsExecuted, durationMs: result.durationMs });

      if (result.error) {
        setErrorLine(result.error.line);
        appendEntry({
          kind: 'error',
          text: result.error.message,
          line: result.error.line,
          phase: result.error.phase,
          hint: result.error.hint,
        });
      } else if (!result.aborted) {
        appendEntry({
          kind: 'success',
          text: `Terminé en ${result.durationMs} ms (${result.stepsExecuted} instructions).`,
        });
      }
    },
    [appendEntry]
  );

  const handleRunActive = useCallback(() => {
    void executeSource(activeFile.code);
  }, [activeFile.code, executeSource]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFile.id ? { ...f, code: newCode } : f))
      );
      if (errorLine !== null) setErrorLine(null);
    },
    [activeFile.id, errorLine]
  );

  const handleFormatActive = useCallback(() => {
    setActiveWorkspace('ide');
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, code: formatPseudocode(f.code) } : f))
    );
  }, [activeFile.id]);

  // Multi-file tab operations
  const handleNewFile = useCallback(() => {
    let idx = files.length + 1;
    while (files.some((f) => f.name.toLowerCase() === `nouveau_${idx}.algo`)) {
      idx++;
    }
    const name = `Nouveau_${idx}.algo`;
    const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTab: AlgoFileTab = {
      id,
      name,
      code: createNewTemplate(`Nouveau_${idx}`),
    };
    setFiles((prev) => [...prev, newTab]);
    setActiveFileId(id);
    setActiveWorkspace('ide');
    setErrorLine(null);
  }, [files]);

  const handleCloseFile = useCallback(
    (idToClose: string) => {
      if (files.length <= 1) return;
      const idx = files.findIndex((f) => f.id === idToClose);
      const nextFiles = files.filter((f) => f.id !== idToClose);
      setFiles(nextFiles);
      if (activeFile.id === idToClose) {
        const nextActive = nextFiles[Math.max(0, idx - 1)] ?? nextFiles[0];
        setActiveFileId(nextActive.id);
        setErrorLine(null);
      }
    },
    [files, activeFile.id]
  );

  const handleRenameFile = useCallback((id: string, newName: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, name: newName } : f)));
  }, []);

  // Open a module/snippet/disk file in a dedicated tab (or switch to existing tab if same name)
  const handleOpenInIde = useCallback(
    (newCode: string, newFileName: string, autoRun = false) => {
      const existing = files.find((f) => f.name.toLowerCase() === newFileName.toLowerCase());
      if (existing) {
        setFiles((prev) =>
          prev.map((f) => (f.id === existing.id ? { ...f, code: newCode } : f))
        );
        setActiveFileId(existing.id);
      } else {
        const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setFiles((prev) => [...prev, { id, name: newFileName, code: newCode }]);
        setActiveFileId(id);
      }

      setActiveWorkspace('ide');
      setErrorLine(null);
      if (autoRun) {
        void executeSource(newCode);
      } else {
        handleClearConsole();
      }
    },
    [files, executeSource, handleClearConsole]
  );

  const handleSaveFile = useCallback(() => {
    const match = activeFile.code.match(/^\s*Algorithme\s+([A-Za-zÀ-ÖØ-öø-ÿ0-9_]+)/im);
    const baseName = activeFile.name.replace(/\.algo$/i, '') || (match ? match[1] : 'algorithme');
    const finalName = `${baseName}.algo`;
    const blob = new Blob([activeFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalName;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFile]);

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    Array.from(selectedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleOpenInIde(reader.result, file.name, false);
        }
      };
      reader.readAsText(file, 'utf-8');
    });
    e.target.value = '';
  };

  // Global keyboard shortcuts (Ctrl+S Save, Ctrl+O Open, Alt+N New File)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewFile();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSaveFile, handleNewFile]);

  // Subscribe to Electron auto-updater events when running as desktop .exe
  useEffect(() => {
    if (!window.algoUpdater) return;
    return window.algoUpdater.onStatus((status) => {
      setUpdateStatus(status);
    });
  }, []);

  const handleCheckUpdates = useCallback(() => {
    if (window.algoUpdater) {
      setUpdateStatus({ state: 'checking' });
      void window.algoUpdater.checkForUpdates();
    } else {
      setUpdateStatus({
        state: 'up-to-date',
        version: '1.5.1',
        message: 'Version Web : toujours à jour automatiquement au chargement.',
      });
    }
  }, []);

  const handleInstallUpdate = useCallback(() => {
    if (window.algoUpdater) {
      void window.algoUpdater.installUpdate();
    }
  }, []);

  const handleUnlockResources = useCallback((entered: string) => {
    if (entered.trim() === ACCESS_PASSWORD) {
      setResourcesUnlocked(true);
      return true;
    }
    return false;
  }, []);

  const handleLockResources = useCallback(() => {
    setResourcesUnlocked(false);
    setActiveWorkspace('ide');
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      <TopBar
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onNewFile={handleNewFile}
        onSaveFile={handleSaveFile}
        onTriggerOpenFile={() => fileInputRef.current?.click()}
        onCloseActiveTab={() => handleCloseFile(activeFile.id)}
        canCloseTab={files.length > 1}
        isRunning={isRunning}
        onRun={handleRunActive}
        onStop={handleStop}
        onFormat={handleFormatActive}
        onClearConsole={handleClearConsole}
        resourcesUnlocked={resourcesUnlocked}
        onLockResources={handleLockResources}
        onCheckUpdates={handleCheckUpdates}
        hasReadyUpdate={updateStatus.state === 'downloaded'}
      />

      <UpdateBanner
        status={updateStatus}
        onInstall={handleInstallUpdate}
        onDismiss={() => setUpdateStatus({ state: 'idle' })}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".algo,.txt"
        multiple
        onChange={handleLoadFile}
        className="hidden"
      />

      <main className="flex-1 min-h-0 p-2.5 overflow-hidden">
        {activeWorkspace === 'ide' && (
          <IdeWorkspace
            files={files}
            activeFileId={activeFile.id}
            onSelectFile={(id) => {
              setActiveFileId(id);
              setErrorLine(null);
            }}
            onNewFile={handleNewFile}
            onCloseFile={handleCloseFile}
            onRenameFile={handleRenameFile}
            code={activeFile.code}
            onCodeChange={handleCodeChange}
            theme={theme}
            entries={entries}
            pendingInput={pendingInput}
            onSubmitInput={handleSubmitInput}
            variables={variables}
            trace={trace}
            isRunning={isRunning}
            errorLine={errorLine}
            executionMeta={executionMeta}
            onRun={handleRunActive}
            onStop={handleStop}
            onFormat={handleFormatActive}
            onClearConsole={handleClearConsole}
          />
        )}

        {activeWorkspace === 'resumes' &&
          (resourcesUnlocked ? (
            <ResumesWorkspace onOpenInIde={handleOpenInIde} />
          ) : (
            <LockGate sectionName="Résumés" onUnlock={handleUnlockResources} />
          ))}

        {activeWorkspace === 'modules' &&
          (resourcesUnlocked ? (
            <ModulesWorkspace onOpenInIde={handleOpenInIde} />
          ) : (
            <LockGate sectionName="Modules" onUnlock={handleUnlockResources} />
          ))}

        {activeWorkspace === 'bac' &&
          (resourcesUnlocked ? (
            <SujetsBacWorkspace />
          ) : (
            <LockGate sectionName="Sujets Bac" onUnlock={handleUnlockResources} />
          ))}
      </main>
    </div>
  );
}

export default App;
