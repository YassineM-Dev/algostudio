import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  Table2,
  Activity,
  AlertTriangle,
  CheckCircle2,
  CornerDownLeft,
  Columns2,
  Rows2,
  Trash2,
  Lock,
} from 'lucide-react';
import type { TraceEntry, VariableSnapshot } from '../engine';

export interface ConsoleEntry {
  id: number;
  kind: 'output' | 'input' | 'system' | 'success' | 'error';
  text: string;
  line?: number;
  phase?: 'lex' | 'parse' | 'runtime';
  hint?: string;
}

export interface PendingInputRequest {
  targetName: string;
  typeHint: string;
  line: number;
}

interface ConsoleDebuggerPanelProps {
  entries: ConsoleEntry[];
  pendingInput: PendingInputRequest | null;
  onSubmitInput: (value: string) => void;
  variables: VariableSnapshot[];
  trace: TraceEntry[];
  isRunning: boolean;
  executionMeta: { steps: number; durationMs: number } | null;
  onClearConsole: () => void;
  splitOrientation: 'horizontal' | 'vertical';
  onToggleSplitOrientation: () => void;
}

const PHASE_LABELS: Record<'lex' | 'parse' | 'runtime', string> = {
  lex: 'Erreur lexicale',
  parse: 'Erreur de syntaxe',
  runtime: "Erreur d'exécution",
};

const ACTION_BADGES: Record<TraceEntry['action'], { label: string; cls: string }> = {
  assign: { label: '←', cls: 'text-[#DC0915] dark:text-[#FF4D57] bg-[#E50914]/10' },
  read: { label: 'Lire', cls: 'text-sky-700 dark:text-sky-400 bg-sky-500/10' },
  write: { label: 'Écrire', cls: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' },
  call: { label: 'Appel', cls: 'text-purple-700 dark:text-purple-400 bg-purple-500/10' },
  return: { label: 'Retour', cls: 'text-amber-700 dark:text-amber-400 bg-amber-500/10' },
};

export const ConsoleDebuggerPanel: React.FC<ConsoleDebuggerPanelProps> = ({
  entries,
  pendingInput,
  onSubmitInput,
  variables,
  trace,
  isRunning,
  executionMeta,
  onClearConsole,
  splitOrientation,
  onToggleSplitOrientation,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'tdo' | 'trace'>('console');
  const [inputValue, setInputValue] = useState('');
  const consoleEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (pendingInput) {
      setActiveTab('console');
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [pendingInput]);

  useEffect(() => {
    if (activeTab === 'console') {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, pendingInput, activeTab]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingInput) return;
    onSubmitInput(inputValue);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg overflow-hidden">
      {/* Direct 3-Tab Header: Console | TDO | Trace */}
      <div className="flex items-center justify-between gap-1 px-2 py-1.5 bg-[var(--bg-elevated)] border-b border-[var(--border-main)]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'console'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-main)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Terminal className={`w-3.5 h-3.5 ${activeTab === 'console' ? 'text-[#E50914]' : ''}`} />
            <span>Console</span>
            {pendingInput && <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tdo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'tdo'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-main)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Table2 className={`w-3.5 h-3.5 ${activeTab === 'tdo' ? 'text-[#E50914]' : ''}`} />
            <span>TDO</span>
            {variables.length > 0 && (
              <span className="font-mono text-[10px] opacity-70">({variables.length})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trace')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'trace'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-main)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${activeTab === 'trace' ? 'text-[#E50914]' : ''}`} />
            <span>Trace</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {executionMeta && !isRunning && (
            <span className="hidden xl:inline text-[11px] font-mono text-[var(--text-muted)] mr-1">
              {executionMeta.durationMs} ms
            </span>
          )}
          <button
            type="button"
            onClick={onToggleSplitOrientation}
            title={splitOrientation === 'horizontal' ? 'Console en bas (Thonny)' : 'Console à droite'}
            className="hidden lg:flex p-1 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            {splitOrientation === 'horizontal' ? (
              <Rows2 className="w-3.5 h-3.5" />
            ) : (
              <Columns2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onClearConsole}
            title="Effacer la console"
            className="p-1 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TAB 1: CONSOLE */}
      {activeTab === 'console' && (
        <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg-code)] font-mono text-[13px] space-y-1.5">
          {entries.length === 0 && !pendingInput && (
            <div className="h-full flex items-center justify-center text-xs font-sans text-[var(--text-muted)] select-none">
              Cliquez sur <strong className="text-[#E50914] mx-1">Exécuter</strong> (Ctrl+Entrée)
            </div>
          )}

          {entries.map((entry) => {
            if (entry.kind === 'output') {
              return (
                <div key={entry.id} className="text-[var(--text-primary)] whitespace-pre-wrap break-words">
                  {entry.text}
                </div>
              );
            }

            if (entry.kind === 'input') {
              return (
                <div
                  key={entry.id}
                  className="text-sky-700 dark:text-sky-400 pl-2 border-l-2 border-sky-500 font-semibold"
                >
                  › {entry.text}
                </div>
              );
            }

            if (entry.kind === 'success') {
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-1.5 pt-2 mt-2 border-t border-[var(--border-soft)] text-xs font-sans text-emerald-700 dark:text-emerald-400"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{entry.text}</span>
                </div>
              );
            }

            if (entry.kind === 'system') {
              return (
                <div key={entry.id} className="text-xs font-sans text-[var(--text-muted)]">
                  {entry.text}
                </div>
              );
            }

            return (
              <div
                key={entry.id}
                className="mt-2 p-3 rounded-lg bg-[#E50914]/10 border border-[#E50914]/35 font-sans"
              >
                <div className="flex items-center justify-between gap-2 mb-1 text-xs font-semibold text-[#DC0915] dark:text-[#FF4D57]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {entry.phase ? PHASE_LABELS[entry.phase] : 'Erreur'}
                  </span>
                  {entry.line && <span className="font-mono">Ligne {entry.line}</span>}
                </div>
                <p className="text-xs text-red-900 dark:text-red-100">{entry.text}</p>
                {entry.hint && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1.5">
                    Astuce : {entry.hint}
                  </p>
                )}
              </div>
            );
          })}

          {pendingInput && (
            <form
              onSubmit={handleInputSubmit}
              className="mt-2 p-2.5 rounded-lg bg-[var(--bg-surface)] border-2 border-[#E50914]"
            >
              <div className="flex items-center justify-between text-xs font-sans mb-1.5">
                <span className="font-semibold text-[var(--text-primary)]">
                  Lire(<span className="font-mono text-[#E50914]">{pendingInput.targetName}</span>)
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {pendingInput.typeHint}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[#E50914] font-bold">›</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Valeur de ${pendingInput.targetName}...`}
                  className="flex-1 min-w-0 bg-[var(--bg-code)] border border-[var(--border-main)] focus:border-[#E50914] rounded-md px-2.5 py-1.5 sm:py-1 text-base sm:text-sm font-mono text-[var(--text-primary)] focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 sm:px-2.5 py-1.5 sm:py-1 rounded-md bg-[#E50914] hover:bg-[#FF2A2A] text-white font-sans text-xs font-semibold cursor-pointer shrink-0"
                >
                  <span>OK</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </div>
            </form>
          )}
          <div ref={consoleEndRef} />
        </div>
      )}

      {/* TAB 2: TDO (Tableau de Déclaration des Objets) */}
      {activeTab === 'tdo' && (
        <div className="flex-1 overflow-y-auto p-3 bg-[var(--bg-code)]">
          {variables.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
              Exécutez l&apos;algorithme pour voir le TDO.
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--border-main)] overflow-x-auto bg-[var(--bg-surface)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-main)] text-[var(--text-secondary)]">
                    <th className="py-2 px-3 font-semibold">Objet</th>
                    <th className="py-2 px-3 font-semibold">Type / Nature</th>
                    <th className="py-2 px-3 font-semibold">Valeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)] font-mono">
                  {variables.map((v) => (
                    <tr key={v.name} className="hover:bg-[var(--bg-elevated)]">
                      <td className="py-2 px-3 font-bold text-[var(--text-primary)] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          {v.name}
                          {v.isConstant && <Lock className="w-3 h-3 text-amber-500" />}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-purple-700 dark:text-purple-300 whitespace-nowrap">
                        {v.type}
                      </td>
                      <td className="py-2 px-3 text-emerald-700 dark:text-emerald-300 break-all">
                        {v.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRACE */}
      {activeTab === 'trace' && (
        <div className="flex-1 overflow-y-auto p-3 bg-[var(--bg-code)]">
          {trace.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
              Aucune trace disponible.
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--border-main)] overflow-x-auto bg-[var(--bg-surface)]">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-main)] text-[var(--text-secondary)]">
                    <th className="py-1.5 px-2.5 font-semibold">L</th>
                    <th className="py-1.5 px-2.5 font-semibold">Action</th>
                    <th className="py-1.5 px-2.5 font-semibold">Objet</th>
                    <th className="py-1.5 px-2.5 font-semibold">Valeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {trace.map((t) => {
                    const badge = ACTION_BADGES[t.action];
                    return (
                      <tr key={t.step} className="hover:bg-[var(--bg-elevated)]">
                        <td className="py-1.5 px-2.5 text-[var(--text-muted)]">L{t.line}</td>
                        <td className="py-1.5 px-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-[var(--text-primary)]">{t.target}</td>
                        <td className="py-1.5 px-2.5 text-emerald-700 dark:text-emerald-300 break-all">
                          {t.value}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
