import React, { useEffect, useRef, useState } from 'react';
import {
  Code2,
  BookOpen,
  Blocks,
  GraduationCap,
  FileDown,
  Sun,
  Moon,
  ChevronDown,
  FilePlus2,
  Upload,
  Download,
  XCircle,
  Play,
  Square,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  Camera,
} from 'lucide-react';

export type WorkspaceId = 'ide' | 'resumes' | 'modules' | 'bac';

interface TopBarProps {
  activeWorkspace: WorkspaceId;
  onSelectWorkspace: (id: WorkspaceId) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNewFile: () => void;
  onSaveFile: () => void;
  onTriggerOpenFile: () => void;
  onOpenPhotoImport: () => void;
  onCloseActiveTab: () => void;
  canCloseTab: boolean;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onFormat: () => void;
  onClearConsole: () => void;
  resourcesUnlocked: boolean;
  onLockResources: () => void;
  onCheckUpdates: () => void;
  hasReadyUpdate: boolean;
}

const TABS: Array<{
  id: WorkspaceId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'ide', label: 'IDE', icon: Code2 },
  { id: 'resumes', label: 'Résumés', icon: BookOpen },
  { id: 'modules', label: 'Modules', icon: Blocks },
  { id: 'bac', label: 'Sujets Bac', icon: GraduationCap },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  theme,
  onToggleTheme,
  onNewFile,
  onSaveFile,
  onTriggerOpenFile,
  onOpenPhotoImport,
  onCloseActiveTab,
  canCloseTab,
  isRunning,
  onRun,
  onStop,
  onFormat,
  onClearConsole,
  resourcesUnlocked,
  onLockResources,
  onCheckUpdates,
  hasReadyUpdate,
}) => {
  const [openMenu, setOpenMenu] = useState<'file' | 'run' | null>(null);
  const menusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menusRef.current && !menusRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="min-h-11 py-1 px-2.5 sm:px-3 bg-[var(--bg-sidebar)] border-b border-[var(--border-main)] flex items-center justify-between gap-2 shrink-0 select-none safe-top">
      {/* Left: Small Logo + Fichier & Run Menus + Workspace Tabs */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => onSelectWorkspace('ide')}
          className="flex items-center gap-2 shrink-0 cursor-pointer"
          title="AlgoStudio"
        >
          <span className="w-6 h-6 rounded-md bg-[#E50914] flex items-center justify-center font-mono font-extrabold text-[11px] text-white tracking-tighter">
            {'<>'}
          </span>
          <span className="font-bold text-sm tracking-tight text-[var(--text-primary)] hidden sm:inline">
            Algo<span className="text-[#E50914]">Studio</span>
          </span>
        </button>

        <div className="h-4 w-px bg-[var(--border-main)]" />

        {/* Thonny-style Menu Bar: Fichier | Run */}
        <div className="flex items-center gap-0.5" ref={menusRef}>
          {/* Menu Fichier */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                openMenu === 'file'
                  ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <span>Fichier</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {openMenu === 'file' && (
              <div className="absolute left-0 top-full mt-1 w-52 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-xl py-1 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onNewFile();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FilePlus2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    Nouveau fichier
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">Alt+N</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTriggerOpenFile();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    Ouvrir (.algo)...
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">Ctrl+O</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenPhotoImport();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-[#E50914]" />
                    Importer photo...
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">Ctrl+Shift+I</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSaveFile();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    Enregistrer (.algo)
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">Ctrl+S</span>
                </button>

                {canCloseTab && (
                  <>
                    <div className="my-1 border-t border-[var(--border-soft)]" />
                    <button
                      type="button"
                      onClick={() => {
                        onCloseActiveTab();
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-[var(--bg-subtle)] cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Fermer l&apos;onglet</span>
                    </button>
                  </>
                )}

                <div className="my-1 border-t border-[var(--border-soft)]" />
                <button
                  type="button"
                  onClick={() => {
                    onCheckUpdates();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-[#E50914]" />
                    Mises à jour
                  </span>
                  {hasReadyUpdate && (
                    <span className="w-2 h-2 rounded-full bg-[#E50914]" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Menu Run */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'run' ? null : 'run')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                openMenu === 'run'
                  ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <span>Run</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {openMenu === 'run' && (
              <div className="absolute left-0 top-full mt-1 w-56 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-xl py-1 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onRun();
                    setOpenMenu(null);
                  }}
                  disabled={isRunning}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-[#E50914] fill-current" />
                    Exécuter
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">Ctrl+Entrée</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onStop();
                    setOpenMenu(null);
                  }}
                  disabled={!isRunning}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Square className="w-3.5 h-3.5 text-red-500 fill-current" />
                    Arrêter
                  </span>
                </button>

                <div className="my-1 border-t border-[var(--border-soft)]" />

                <button
                  type="button"
                  onClick={() => {
                    onFormat();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Formater le code
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">Shift+Alt+F</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClearConsole();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    Effacer la console
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-4 w-px bg-[var(--border-main)] hidden sm:block" />

        {/* Workspace Switch Tabs */}
        <nav className="flex items-center gap-0.5 bg-[var(--bg-elevated)] p-0.5 rounded-lg border border-[var(--border-soft)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeWorkspace === tab.id;
            const isLockedTab =
              !resourcesUnlocked &&
              (tab.id === 'resumes' || tab.id === 'modules' || tab.id === 'bac');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectWorkspace(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#E50914] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {isLockedTab && (
                  <Lock className={`w-3 h-3 ${active ? 'text-white/90' : 'opacity-65'}`} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Re-lock + Guide PDF (only when unlocked) + Theme Switch */}
      <div className="flex items-center gap-1.5 shrink-0">
        {resourcesUnlocked && (
          <>
            <a
              href="./Guide_Complet_Algorithmique.pdf"
              target="_blank"
              rel="noreferrer"
              title="Ouvrir le Guide Complet d'Algorithmique (PDF)"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="hidden md:inline">Guide PDF</span>
            </a>
            <button
              type="button"
              onClick={onLockResources}
              title="Verrouiller Résumés et Modules"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden md:inline">Verrouiller</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Clair</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Sombre</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
