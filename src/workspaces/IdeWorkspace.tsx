import React, { useEffect, useRef, useState } from 'react';
import { Code2, Terminal } from 'lucide-react';
import { AlgoFileTab, CodeEditorPanel } from '../components/CodeEditorPanel';
import {
  ConsoleDebuggerPanel,
  ConsoleEntry,
  PendingInputRequest,
} from '../components/ConsoleDebuggerPanel';
import type { TraceEntry, VariableSnapshot } from '../engine';

interface IdeWorkspaceProps {
  files: AlgoFileTab[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onNewFile: () => void;
  onCloseFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  theme: 'dark' | 'light';
  entries: ConsoleEntry[];
  pendingInput: PendingInputRequest | null;
  onSubmitInput: (value: string) => void;
  variables: VariableSnapshot[];
  trace: TraceEntry[];
  isRunning: boolean;
  errorLine: number | null;
  executionMeta: { steps: number; durationMs: number } | null;
  onRun: () => void;
  onStop: () => void;
  onFormat: () => void;
  onOpenPhotoImport: () => void;
  onClearConsole: () => void;
}

export const IdeWorkspace: React.FC<IdeWorkspaceProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onNewFile,
  onCloseFile,
  onRenameFile,
  code,
  onCodeChange,
  theme,
  entries,
  pendingInput,
  onSubmitInput,
  variables,
  trace,
  isRunning,
  errorLine,
  executionMeta,
  onRun,
  onStop,
  onFormat,
  onOpenPhotoImport,
  onClearConsole,
}) => {
  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [mobilePane, setMobilePane] = useState<'editor' | 'console'>('editor');
  const prevEntriesLenRef = useRef(entries.length);

  // On phones (< lg), auto-switch to Console when running or waiting for Lire() input
  useEffect(() => {
    if (pendingInput) {
      setMobilePane('console');
    }
  }, [pendingInput]);

  useEffect(() => {
    if (entries.length > prevEntriesLenRef.current && (isRunning || errorLine !== null)) {
      setMobilePane('console');
    }
    prevEntriesLenRef.current = entries.length;
  }, [entries.length, isRunning, errorLine]);

  const handleRunWithMobileSwitch = () => {
    setMobilePane('console');
    onRun();
  };

  const hasError = entries.some((e) => e.kind === 'error');

  return (
    <div className="h-full flex flex-col gap-2 min-h-0">
      {/* Mobile-Only Editor / Console Segmented Switcher (< lg) */}
      <div className="lg:hidden grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-main)] shrink-0 select-none">
        <button
          type="button"
          onClick={() => setMobilePane('editor')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
            mobilePane === 'editor'
              ? 'bg-[#E50914] text-white shadow-xs'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Éditeur</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePane('console')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
            mobilePane === 'console'
              ? 'bg-[#E50914] text-white shadow-xs'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Console / TDO</span>
          {(pendingInput || isRunning) && (
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                mobilePane === 'console' ? 'bg-white' : 'bg-[#E50914]'
              }`}
            />
          )}
          {!pendingInput && !isRunning && entries.length > 0 && (
            <span
              className={`px-1.5 py-0 rounded-full font-mono text-[10px] ${
                mobilePane === 'console'
                  ? 'bg-white/20 text-white'
                  : hasError
                    ? 'bg-[#E50914]/15 text-[#E50914]'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {entries.length}
            </span>
          )}
        </button>
      </div>

      {/* Desktop Split Grid (lg+) / Mobile Full-Height Active Pane (< lg) */}
      <div
        className={`flex-1 min-h-0 lg:grid lg:gap-2.5 ${
          splitOrientation === 'horizontal'
            ? 'lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]'
            : 'lg:grid-cols-1 lg:grid-rows-[minmax(0,1.45fr)_minmax(220px,1fr)]'
        }`}
      >
        <div
          className={`h-full min-h-0 ${
            mobilePane === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          <CodeEditorPanel
            files={files}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onNewFile={onNewFile}
            onCloseFile={onCloseFile}
            onRenameFile={onRenameFile}
            code={code}
            onChange={onCodeChange}
            onRun={handleRunWithMobileSwitch}
            onStop={onStop}
            onFormat={onFormat}
            onOpenPhotoImport={onOpenPhotoImport}
            isRunning={isRunning}
            errorLine={errorLine}
            theme={theme}
          />
        </div>

        <div
          className={`h-full min-h-0 ${
            mobilePane === 'console' ? 'block' : 'hidden lg:block'
          }`}
        >
          <ConsoleDebuggerPanel
            entries={entries}
            pendingInput={pendingInput}
            onSubmitInput={onSubmitInput}
            variables={variables}
            trace={trace}
            isRunning={isRunning}
            executionMeta={executionMeta}
            onClearConsole={onClearConsole}
            splitOrientation={splitOrientation}
            onToggleSplitOrientation={() =>
              setSplitOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'))
            }
          />
        </div>
      </div>
    </div>
  );
};
