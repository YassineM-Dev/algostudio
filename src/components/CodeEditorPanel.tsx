import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import {
  Play,
  Square,
  Keyboard,
  X,
  Zap,
  Plus,
  FileCode2,
  Wand2,
  Camera,
} from 'lucide-react';
import {
  ALGO_DARK_THEME_ID,
  ALGO_LANGUAGE_ID,
  ALGO_LIGHT_THEME_ID,
  registerAlgoLanguage,
} from '../editor/monacoAlgoLanguage';

export interface AlgoFileTab {
  id: string;
  name: string;
  code: string;
}

interface CodeEditorPanelProps {
  files: AlgoFileTab[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onNewFile: () => void;
  onCloseFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onStop: () => void;
  onFormat: () => void;
  onOpenPhotoImport: () => void;
  isRunning: boolean;
  errorLine: number | null;
  theme: 'dark' | 'light';
}

const NON_KEYBOARD_SYMBOLS: Array<{
  symbol: string;
  insert: string;
  title: string;
}> = [
  { symbol: '←', insert: ' ← ', title: 'Affectation (<- ou Alt+A)' },
  { symbol: '≠', insert: ' ≠ ', title: 'Différent (!= ou Alt+D)' },
  { symbol: '≤', insert: ' ≤ ', title: 'Inférieur ou égal (<= ou Alt+I)' },
  { symbol: '≥', insert: ' ≥ ', title: 'Supérieur ou égal (>= ou Alt+S)' },
  { symbol: '@', insert: '@', title: 'Passage par référence' },
  { symbol: 'À', insert: 'À ', title: 'À majuscule (Alt+G)' },
  { symbol: 'É', insert: 'É', title: 'É majuscule (Alt+E)' },
];

const SHORTCUT_GUIDE = [
  { symbol: '←', auto: '<- / :=', key: 'Alt+A', label: 'Affectation' },
  { symbol: '≠', auto: '!= / <>', key: 'Alt+D', label: 'Différent' },
  { symbol: '≤', auto: '<=', key: 'Alt+I', label: 'Inf. ou égal' },
  { symbol: '≥', auto: '>=', key: 'Alt+S', label: 'Sup. ou égal' },
  { symbol: 'À', auto: '—', key: 'Alt+G', label: 'Lettre À' },
  { symbol: 'É', auto: '—', key: 'Alt+E', label: 'Lettre É' },
  { symbol: '▶', auto: '—', key: 'Ctrl+Entrée', label: 'Exécuter' },
  { symbol: '✨', auto: '—', key: 'Shift+Alt+F', label: 'Formater' },
];

const AUTO_SYMBOL_MAP: Record<string, string> = {
  '<-': '←',
  ':=': '←',
  '<=': '≤',
  '>=': '≥',
  '!=': '≠',
  '<>': '≠',
};

function isInsideStringOrComment(linePrefix: string): boolean {
  let inQuote: '"' | "'" | null = null;
  for (let i = 0; i < linePrefix.length; i++) {
    const ch = linePrefix[i];
    if (inQuote) {
      if (ch === '\\') {
        i++;
      } else if (ch === inQuote) {
        inQuote = null;
      }
    } else {
      if (ch === '/' && linePrefix[i + 1] === '/') return true;
      if (ch === '"' || ch === "'") inQuote = ch;
    }
  }
  return inQuote !== null;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onNewFile,
  onCloseFile,
  onRenameFile,
  code,
  onChange,
  onRun,
  onStop,
  onFormat,
  onOpenPhotoImport,
  isRunning,
  errorLine,
  theme,
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationsRef = useRef<Monaco.editor.IEditorDecorationsCollection | null>(null);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;
  const onFormatRef = useRef(onFormat);
  onFormatRef.current = onFormat;
  const autoReplaceRef = useRef(true);
  const isAutoReplacingRef = useRef(false);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [autoSymbols, setAutoSymbols] = useState(true);
  const [autoComplete, setAutoComplete] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('algostudio_autocomplete_v1');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('algostudio_autocomplete_v1', String(autoComplete));
    } catch {
      // ignore
    }
  }, [autoComplete]);

  autoReplaceRef.current = autoSymbols;
  registerAlgoLanguage();

  const insertAtCursor = (text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = editor.getSelection();
    if (!selection) return;
    editor.executeEdits('quick-symbol', [
      { range: selection, text, forceMoveMarkers: true },
    ]);
    editor.focus();
  };

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
      onRunRef.current();
    });
    editor.addCommand(
      monacoInstance.KeyMod.Shift | monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyF,
      () => {
        onFormatRef.current();
      }
    );
    editor.addCommand(monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyA, () =>
      insertAtCursor('←')
    );
    editor.addCommand(monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyD, () =>
      insertAtCursor('≠')
    );
    editor.addCommand(monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyI, () =>
      insertAtCursor('≤')
    );
    editor.addCommand(monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyS, () =>
      insertAtCursor('≥')
    );
    editor.addCommand(monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyG, () =>
      insertAtCursor('À')
    );
    editor.addCommand(monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyE, () =>
      insertAtCursor('É')
    );

    editor.onDidChangeModelContent((event) => {
      if (!autoReplaceRef.current || isAutoReplacingRef.current) return;
      if (event.isUndoing || event.isRedoing || event.changes.length !== 1) return;

      const change = event.changes[0];
      if (change.text.length !== 1) return;

      const model = editor.getModel();
      if (!model) return;

      const lineNum = change.range.startLineNumber;
      const endCol = change.range.startColumn + 1;
      if (endCol < 3) return;

      const lineContent = model.getLineContent(lineNum);
      const twoChars = lineContent.slice(endCol - 3, endCol - 1);
      const replacement = AUTO_SYMBOL_MAP[twoChars];
      if (!replacement) return;

      const prefixBefore = lineContent.slice(0, endCol - 3);
      if (isInsideStringOrComment(prefixBefore)) return;

      isAutoReplacingRef.current = true;
      try {
        editor.executeEdits('auto-symbol', [
          {
            range: new monacoInstance.Range(lineNum, endCol - 2, lineNum, endCol),
            text: replacement,
            forceMoveMarkers: true,
          },
        ]);
      } finally {
        isAutoReplacingRef.current = false;
      }
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;
    if (!editor || !monacoInstance) return;

    if (decorationsRef.current) {
      decorationsRef.current.clear();
      decorationsRef.current = null;
    }

    if (errorLine && errorLine > 0) {
      const model = editor.getModel();
      const clampedLine = model ? Math.min(errorLine, model.getLineCount()) : errorLine;
      decorationsRef.current = editor.createDecorationsCollection([
        {
          range: new monacoInstance.Range(clampedLine, 1, clampedLine, 1),
          options: {
            isWholeLine: true,
            className: 'algo-error-line',
            glyphMarginClassName: 'algo-error-glyph',
          },
        },
      ]);
      editor.revealLineInCenterIfOutsideViewport(clampedLine);
    }
  }, [errorLine, activeFileId]);

  const startRename = (tab: AlgoFileTab) => {
    setRenamingId(tab.id);
    setRenameValue(tab.name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      const trimmed = renameValue.trim();
      onRenameFile(renamingId, trimmed.endsWith('.algo') ? trimmed : `${trimmed}.algo`);
    }
    setRenamingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg overflow-hidden">
      {/* Row 1: Multi-File Tabs Strip (Thonny-style) */}
      <div className="flex items-center bg-[var(--bg-elevated)] border-b border-[var(--border-main)] overflow-x-auto select-none">
        <div className="flex items-center min-w-0">
          {files.map((tab) => {
            const active = tab.id === activeFileId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectFile(tab.id)}
                onDoubleClick={() => startRename(tab)}
                title="Double-cliquez pour renommer"
                className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border-r border-[var(--border-main)] cursor-pointer transition-colors shrink-0 relative ${
                  active
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold'
                    : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-0 right-0 h-[2px] bg-[#E50914]" />
                )}
                <FileCode2
                  className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#E50914]' : 'opacity-60'}`}
                />
                {renamingId === tab.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-32 bg-[var(--bg-code)] border border-[#E50914] rounded px-1 py-0 text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                  />
                ) : (
                  <span className="max-w-[160px] truncate">{tab.name}</span>
                )}

                {files.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile(tab.id);
                    }}
                    title="Fermer l’onglet"
                    className="ml-0.5 p-0.5 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[#E50914] opacity-70 group-hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={onNewFile}
            title="Nouveau fichier (.algo)"
            className="flex items-center justify-center px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: Compact Run + Non-Keyboard Symbols Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-1.5">
          {!isRunning ? (
            <button
              type="button"
              onClick={onRun}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#E50914] hover:bg-[#FF2A2A] text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Exécuter (Ctrl+Entrée)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Exécuter</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#E50914]/15 border border-[#E50914] text-[#E50914] text-xs font-semibold animate-pulse-crimson cursor-pointer"
              title="Arrêter"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Arrêter</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPhotoImport}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[#E50914]/50 text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Importer le code depuis une photo (Ctrl+Shift+I)"
          >
            <Camera className="w-3.5 h-3.5 text-[#E50914]" />
            <span className="hidden sm:inline">Photo → Code</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {NON_KEYBOARD_SYMBOLS.map((item) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => insertAtCursor(item.insert)}
              title={item.title}
              className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] hover:bg-[#E50914]/15 border border-[var(--border-main)] hover:border-[#E50914]/40 font-mono text-xs font-bold text-[#DC0915] dark:text-[#FF4D57] transition-colors cursor-pointer"
            >
              {item.symbol}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setAutoSymbols((v) => !v)}
            title="Conversion auto : <- → ←, <= → ≤, >= → ≥, != → ≠"
            className={`ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
              autoSymbols
                ? 'bg-emerald-500/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-400'
                : 'bg-[var(--bg-elevated)] border-[var(--border-main)] text-[var(--text-muted)]'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Auto</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoComplete((v) => !v)}
            title={
              autoComplete
                ? 'Auto-complétion activée (cliquer pour désactiver)'
                : 'Auto-complétion désactivée (cliquer pour activer)'
            }
            aria-pressed={autoComplete}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
              autoComplete
                ? 'bg-emerald-500/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-400'
                : 'bg-[var(--bg-elevated)] border-[var(--border-main)] text-[var(--text-muted)]'
            }`}
          >
            <Wand2 className="w-3 h-3" />
            <span className="hidden sm:inline">Complétion</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShortcuts((s) => !s)}
            title="Raccourcis clavier"
            className={`p-1 rounded border transition-colors cursor-pointer ${
              showShortcuts
                ? 'bg-[#E50914] border-[#E50914] text-white'
                : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-secondary)]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Compact Shortcuts Strip */}
      {showShortcuts && (
        <div className="px-3 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-main)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[var(--text-primary)]">
              Raccourcis clavier
            </span>
            <button
              type="button"
              onClick={() => setShowShortcuts(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
            {SHORTCUT_GUIDE.map((sc) => (
              <div
                key={sc.label}
                className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-soft)]"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span className="font-mono font-bold text-[#E50914]">{sc.symbol}</span>
                  <span className="text-[var(--text-secondary)] truncate">{sc.label}</span>
                </span>
                <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-main)] text-[var(--text-primary)] shrink-0">
                  {sc.auto !== '—' ? sc.auto.split(' ')[0] : sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monaco Editor (path keeps separate undo stack per file tab!) */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          path={activeFileId}
          language={ALGO_LANGUAGE_ID}
          theme={theme === 'dark' ? ALGO_DARK_THEME_ID : ALGO_LIGHT_THEME_ID}
          value={code}
          onChange={(val) => onChange(val ?? '')}
          onMount={handleMount}
          options={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            lineHeight: 22,
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            glyphMargin: true,
            lineNumbersMinChars: 3,
            padding: { top: 12, bottom: 12 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            quickSuggestions: autoComplete,
            suggestOnTriggerCharacters: autoComplete,
            wordBasedSuggestions: autoComplete ? 'currentDocument' : 'off',
            snippetSuggestions: autoComplete ? 'inline' : 'none',
            parameterHints: { enabled: autoComplete },
          }}
        />
      </div>

      {/* Minimal Status Line */}
      <div className="flex items-center justify-between px-3 py-1 bg-[var(--bg-elevated)] border-t border-[var(--border-soft)] text-[11px] font-mono text-[var(--text-muted)]">
        <span>
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
        <span className="hidden sm:inline">
          &lt;- → ← &nbsp;·&nbsp; &lt;= → ≤ &nbsp;·&nbsp; &gt;= → ≥ &nbsp;·&nbsp; != → ≠
        </span>
      </div>
    </div>
  );
};
