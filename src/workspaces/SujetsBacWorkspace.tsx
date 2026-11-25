import React, { useMemo, useState } from 'react';
import {
  Search,
  ExternalLink,
  FileText,
  CheckCircle2,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  BAC_EXAMS,
  BAC_YEAR_ARCHIVES,
  BacExamItem,
  ExamEpreuve,
  ExamKind,
  KITEB_BASE_URL,
} from '../data/bacExams';

const SECTIONS = [
  'Toutes sections',
  "Sciences de l'Informatique",
  'Math / Sc. Exp / Tech',
  'Économie & Gestion',
  'Lettres',
  'Sport',
];

const QUICK_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
const PAGE_SIZE = 60;

export const SujetsBacWorkspace: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<string>('Toutes sections');
  const [selectedEpreuve, setSelectedEpreuve] = useState<ExamEpreuve | 'all'>('all');
  const [selectedKind, setSelectedKind] = useState<ExamKind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const archiveByYear = useMemo(() => {
    const map = new Map<number, (typeof BAC_YEAR_ARCHIVES)[number]>();
    for (const a of BAC_YEAR_ARCHIVES) map.set(a.year, a);
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = query
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return BAC_EXAMS.filter((item) => {
      if (selectedYear !== 'all' && item.year !== selectedYear) return false;
      if (selectedSection !== 'Toutes sections' && item.section !== selectedSection) return false;
      if (selectedEpreuve !== 'all' && item.epreuve !== selectedEpreuve) return false;
      if (selectedKind !== 'all' && item.kind !== selectedKind) return false;
      if (!q) return true;
      const text = `${item.year} ${item.title} ${item.section} ${item.matiere} ${item.epreuve} ${item.session} ${item.kind}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return text.includes(q);
    });
  }, [selectedYear, selectedSection, selectedEpreuve, selectedKind, query]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  // Group visible items by year descending
  const groupedByYear = useMemo(() => {
    const groups: Array<{ year: number; items: BacExamItem[] }> = [];
    const map = new Map<number, BacExamItem[]>();
    for (const item of visibleItems) {
      let arr = map.get(item.year);
      if (!arr) {
        arr = [];
        map.set(item.year, arr);
        groups.push({ year: item.year, items: arr });
      }
      arr.push(item);
    }
    return groups;
  }, [visibleItems]);

  const resetPagination = () => setVisibleCount(PAGE_SIZE);

  return (
    <div className="h-full flex flex-col min-h-0 max-w-6xl mx-auto">
      {/* Compact Filter Bar */}
      <div className="shrink-0 pb-2.5 border-b border-[var(--border-main)] space-y-2">
        {/* Row 1: Quick Years + All Years Select + Search + kiteb.net source */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => {
                setSelectedYear('all');
                resetPagination();
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 cursor-pointer border ${
                selectedYear === 'all'
                  ? 'bg-[#E50914] border-[#E50914] text-white'
                  : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Tous ({BAC_EXAMS.length})
            </button>

            {QUICK_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setSelectedYear(selectedYear === y ? 'all' : y);
                  resetPagination();
                }}
                className={`px-2 py-1 rounded-md text-xs font-mono font-semibold shrink-0 cursor-pointer border ${
                  selectedYear === y
                    ? 'bg-[#E50914]/15 border-[#E50914] text-[#DC0915] dark:text-[#FF4D57]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {y}
              </button>
            ))}

            <div className="relative shrink-0">
              <select
                value={selectedYear === 'all' ? 'all' : String(selectedYear)}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedYear(v === 'all' ? 'all' : Number(v));
                  resetPagination();
                }}
                aria-label="Choisir une année"
                className="appearance-none pl-2.5 pr-6 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#E50914] cursor-pointer"
              >
                <option value="all">2006–2026</option>
                {BAC_YEAR_ARCHIVES.map((a) => (
                  <option key={a.year} value={a.year}>
                    Bac {a.year} ({a.theoriqueCount + a.pratiqueCount})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPagination();
                }}
                placeholder="Algo, STI, Corrigé..."
                className="w-full pl-8 pr-7 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-main)] focus:border-[#E50914] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    resetPagination();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <a
              href={KITEB_BASE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0"
              title="Source officielle : kiteb.net"
            >
              <span>kiteb.net</span>
              <ExternalLink className="w-3 h-3 text-[#E50914]" />
            </a>
          </div>
        </div>

        {/* Row 2: Section + Épreuve + Type Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                resetPagination();
              }}
              aria-label="Filtrer par section"
              className="px-2.5 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#E50914] cursor-pointer"
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-md border border-[var(--border-main)] bg-[var(--bg-surface)] overflow-hidden">
              {(['all', 'Théorique', 'Pratique'] as const).map((ep) => (
                <button
                  key={ep}
                  type="button"
                  onClick={() => {
                    setSelectedEpreuve(ep);
                    resetPagination();
                  }}
                  className={`px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                    selectedEpreuve === ep
                      ? 'bg-[#E50914] text-white font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {ep === 'all' ? 'Théo + Pra' : ep}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-md border border-[var(--border-main)] bg-[var(--bg-surface)] overflow-hidden">
              {(['all', 'Énoncé', 'Corrigé'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setSelectedKind(k);
                    resetPagination();
                  }}
                  className={`px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                    selectedKind === k
                      ? 'bg-[#E50914] text-white font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {k === 'all' ? 'Énoncés + Corrigés' : `${k}s`}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {filtered.length} document{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grouped Archive List */}
      <div className="flex-1 overflow-y-auto pt-3 pb-6 space-y-4 pr-1">
        {groupedByYear.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Aucun sujet ne correspond à vos filtres.
          </div>
        ) : (
          <>
            {groupedByYear.map(({ year, items }) => {
              const yearInfo = archiveByYear.get(year);
              return (
                <section
                  key={year}
                  className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] overflow-hidden"
                >
                  <div className="px-3.5 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-soft)] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#E50914]">Bac {year}</span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        ({items.length} fichier{items.length > 1 ? 's' : ''})
                      </span>
                    </div>

                    {yearInfo && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <a
                          href={yearInfo.theoriqueUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--text-secondary)] hover:text-[#E50914] inline-flex items-center gap-1"
                        >
                          <span>Page Théorique</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[var(--border-main)]">·</span>
                        <a
                          href={yearInfo.pratiqueUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--text-secondary)] hover:text-[#E50914] inline-flex items-center gap-1"
                        >
                          <span>Page Pratique</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-[var(--border-soft)]">
                    {items.map((item) => {
                      const isZip = /\.(zip|rar)$/i.test(item.downloadUrl);
                      return (
                        <div
                          key={item.id}
                          className="px-3.5 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {item.kind === 'Corrigé' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                Corrigé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#E50914]/10 border border-[#E50914]/25 text-[#DC0915] dark:text-[#FF4D57] text-[10px] font-semibold shrink-0">
                                <FileText className="w-3 h-3" />
                                Énoncé
                              </span>
                            )}

                            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-[10px] font-medium shrink-0">
                              {item.epreuve}
                            </span>

                            {item.session === 'Contrôle' && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/12 text-amber-700 dark:text-amber-300 text-[10px] font-semibold shrink-0">
                                Contrôle
                              </span>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] truncate">
                                {item.section} · {item.matiere}
                              </div>
                            </div>
                          </div>

                          <a
                            href={item.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E50914] hover:bg-[#FF2A2A] text-white text-[11px] font-semibold transition-colors shrink-0"
                          >
                            <span>{isZip ? 'Télécharger' : 'Ouvrir PDF'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {filtered.length > visibleCount && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-4 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                >
                  Afficher plus ({filtered.length - visibleCount} restants)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
