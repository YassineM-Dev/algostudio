import React, { useMemo, useState } from 'react';
import { Search, Play, X, CheckCircle2, Lightbulb } from 'lucide-react';
import { CHEAT_SHEETS, CheatSheetTopic } from '../data/cheatSheets';
import { AlgoCodeBlock } from '../components/AlgoCodeBlock';

interface ResumesWorkspaceProps {
  onOpenInIde: (code: string, fileName: string, autoRun?: boolean) => void;
}

export const ResumesWorkspace: React.FC<ResumesWorkspaceProps> = ({ onOpenInIde }) => {
  const [query, setQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const filteredTopics = useMemo(() => {
    const q = query
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return CHEAT_SHEETS.filter((topic) => {
      if (selectedTopicId && topic.id !== selectedTopicId) return false;
      if (!q) return true;

      const haystack = [
        topic.title,
        topic.summary,
        topic.examTip,
        ...topic.keywords,
        ...topic.keyPoints,
        ...(topic.tables?.flatMap((t) => [...t.headers, ...t.rows.flat()]) ?? []),
        ...topic.snippets.map((s) => `${s.title} ${s.code}`),
      ]
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [query, selectedTopicId]);

  return (
    <div className="h-full flex flex-col min-h-0 max-w-6xl mx-auto">
      {/* Compact Filter Bar */}
      <div className="shrink-0 pb-2.5 border-b border-[var(--border-main)] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1">
            <button
              type="button"
              onClick={() => setSelectedTopicId(null)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 cursor-pointer border ${
                selectedTopicId === null
                  ? 'bg-[#E50914] border-[#E50914] text-white'
                  : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Tout ({CHEAT_SHEETS.length})
            </button>
            {CHEAT_SHEETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTopicId(selectedTopicId === t.id ? null : t.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 cursor-pointer border ${
                  selectedTopicId === t.id
                    ? 'bg-[#E50914]/12 border-[#E50914] text-[#DC0915] dark:text-[#FF4D57] font-semibold'
                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="font-mono text-[10px] opacity-60 mr-1">{t.number}</span>
                {t.title}
              </button>
            ))}
          </div>

          <div className="relative w-52 sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
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
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto pt-3 pb-6 space-y-4 pr-1">
        {filteredTopics.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Aucun résultat pour « {query} ».
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <CheatSheetCard key={topic.id} topic={topic} onOpenInIde={onOpenInIde} />
          ))
        )}
      </div>
    </div>
  );
};

const CheatSheetCard: React.FC<{
  topic: CheatSheetTopic;
  onOpenInIde: (code: string, fileName: string, autoRun?: boolean) => void;
}> = ({ topic, onOpenInIde }) => {
  return (
    <article className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border-soft)] flex items-center justify-between gap-2 bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-[#E50914]">{topic.number}</span>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">{topic.title}</h2>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">{topic.badge}</span>
      </div>

      <div className="p-3.5 space-y-3">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {topic.keyPoints.map((pt, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] shrink-0 mt-0.5" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        {topic.tables &&
          topic.tables.map((tbl, idx) => (
            <div key={idx} className="overflow-x-auto rounded-md border border-[var(--border-main)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-main)] text-[var(--text-primary)]">
                    {tbl.headers.map((h, hi) => (
                      <th key={hi} className="py-1.5 px-3 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {tbl.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-[var(--bg-elevated)]">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`py-1.5 px-3 ${
                            ci === 0
                              ? 'font-mono font-semibold text-[#C80815] dark:text-[#FF6B73] whitespace-nowrap'
                              : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {topic.snippets.map((sn, si) => (
          <div key={si} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">{sn.title}</span>
              {sn.runnableCode && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenInIde(
                      sn.runnableCode!,
                      `${topic.id.replace(/-/g, '_')}.algo`,
                      !sn.runnableCode!.includes('Lire(')
                    )
                  }
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#E50914] hover:bg-[#FF2A2A] text-white text-[11px] font-semibold cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Tester</span>
                </button>
              )}
            </div>
            <AlgoCodeBlock code={sn.code} compact />
          </div>
        ))}

        <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-500/8 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>{topic.examTip}</span>
        </div>
      </div>
    </article>
  );
};
