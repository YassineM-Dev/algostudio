import React, { useMemo, useState } from 'react';
import { Search, Play, Copy, Check, X, Code2 } from 'lucide-react';
import {
  MODULE_CATEGORIES,
  ModuleCategory,
  STANDARD_MODULES,
  StandardModule,
} from '../data/standardModules';
import { AlgoCodeBlock } from '../components/AlgoCodeBlock';

interface ModulesWorkspaceProps {
  onOpenInIde: (code: string, fileName: string, autoRun?: boolean) => void;
}

export const ModulesWorkspace: React.FC<ModulesWorkspaceProps> = ({ onOpenInIde }) => {
  const [category, setCategory] = useState<ModuleCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredModules = useMemo(() => {
    const q = query
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return STANDARD_MODULES.filter((mod) => {
      if (category !== 'all' && mod.category !== category) return false;
      if (!q) return true;
      const text = [mod.title, mod.signature, ...mod.tags, mod.code]
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return text.includes(q);
    });
  }, [category, query]);

  const handleCopy = async (mod: StandardModule) => {
    try {
      await navigator.clipboard.writeText(mod.code);
      setCopiedId(mod.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 max-w-6xl mx-auto">
      {/* Compact Single-Row Filter & Search */}
      <div className="shrink-0 pb-2.5 border-b border-[var(--border-main)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1">
          {MODULE_CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all'
                ? STANDARD_MODULES.length
                : STANDARD_MODULES.filter((m) => m.category === cat.id).length;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 cursor-pointer border ${
                  active
                    ? 'bg-[#E50914] border-[#E50914] text-white'
                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat.label} <span className="font-mono text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-52 sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer..."
            className="w-full pl-8 pr-7 py-1.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-main)] focus:border-[#E50914] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Clean Grid */}
      <div className="flex-1 overflow-y-auto pt-3 pb-6 pr-1">
        {filteredModules.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Aucun module trouvé pour « {query} ».
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {filteredModules.map((mod) => (
              <article
                key={mod.id}
                className="flex flex-col rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] overflow-hidden"
              >
                <div className="px-3.5 py-2.5 border-b border-[var(--border-soft)] bg-[var(--bg-elevated)] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {mod.title}
                    </h2>
                    <code className="block text-[11px] font-mono text-[var(--text-muted)] truncate">
                      {mod.signature}
                    </code>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-main)] font-mono text-[10px] text-[var(--text-secondary)] shrink-0">
                    {mod.complexity}
                  </span>
                </div>

                <div className="p-3 flex-1 flex flex-col gap-2.5">
                  <AlgoCodeBlock
                    code={mod.code}
                    compact
                    showCopy={false}
                    maxHeightClass="max-h-56"
                  />

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(mod)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      {copiedId === mod.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenInIde(mod.code, `${mod.id.replace(/-/g, '_')}.algo`, false)
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Ouvrir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenInIde(mod.code, `${mod.id.replace(/-/g, '_')}.algo`, true)
                        }
                        className="flex items-center gap-1 px-3 py-1 rounded-md bg-[#E50914] hover:bg-[#FF2A2A] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Exécuter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
