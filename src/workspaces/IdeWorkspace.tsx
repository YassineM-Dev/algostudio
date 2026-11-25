import React, { useState } from 'react';
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
  onClearConsole,
}) => {
  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  return (
    <div
      className={`h-full grid gap-2.5 min-h-0 ${
        splitOrientation === 'horizontal'
          ? 'grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]'
          : 'grid-cols-1 grid-rows-[minmax(0,1.45fr)_minmax(220px,1fr)]'
      }`}
    >
      <div className="min-h-[380px] lg:min-h-0 h-full">
        <CodeEditorPanel
          files={files}
          activeFileId={activeFileId}
          onSelectFile={onSelectFile}
          onNewFile={onNewFile}
          onCloseFile={onCloseFile}
          onRenameFile={onRenameFile}
          code={code}
          onChange={onCodeChange}
          onRun={onRun}
          onStop={onStop}
          onFormat={onFormat}
          isRunning={isRunning}
          errorLine={errorLine}
          theme={theme}
        />
      </div>

      <div className="min-h-[280px] lg:min-h-0 h-full">
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
  );
};
