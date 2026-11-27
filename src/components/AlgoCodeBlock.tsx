import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface AlgoCodeBlockProps {
  code: string;
  compact?: boolean;
  showCopy?: boolean;
  maxHeightClass?: string;
}

const STRUCTURE_KW = new Set([
  'algorithme',
  'constantes',
  'constante',
  'types',
  'type',
  'variables',
  'variable',
  'debut',
  'fin',
  'procedure',
  'finprocedure',
  'fonction',
  'finfonction',
  'retourner',
  'retourne',
  'enregistrement',
  'finenregistrement',
]);

const CONTROL_KW = new Set([
  'si',
  'alors',
  'sinon',
  'sinonsi',
  'finsi',
  'selon',
  'finselon',
  'pour',
  'de',
  'a',
  'pas',
  'faire',
  'finpour',
  'tantque',
  'fintantque',
  'repeter',
  "jusqu'a",
  'jusqua',
]);

const TYPE_KW = new Set([
  'tableau',
  'entier',
  'reel',
  'chaine',
  'caractere',
  'booleen',
  'var',
]);

const WORD_OPS = new Set(['mod', 'div', 'et', 'ou', 'non']);
const BOOL_LIT = new Set(['vrai', 'faux']);
const BUILTINS = new Set([
  'ecrire',
  'ecrireln',
  'afficher',
  'lire',
  'long',
  'longueur',
  'sous_chaine',
  'souschaine',
  'pos',
  'position',
  'convch',
  'valeur',
  'efface',
  'insere',
  'majus',
  'minus',
  'ord',
  'chr',
  'abs',
  'racine',
  'arrondi',
  'ent',
  'alea',
]);

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function highlightLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex =
    /(\/\/.*$|\{[^}]*\}|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|←|≠|≤|≥|:=|@|\b\d+(?:\.\d+)?\b|\bJusqu'[àa]\b|[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }

    const tok = match[0];
    let cls = 'text-slate-900 dark:text-[#F4F4F8]';

    if (tok.startsWith('//') || tok.startsWith('{')) {
      cls = 'text-slate-500 italic';
    } else if (tok.startsWith('"') || tok.startsWith("'")) {
      cls = 'text-emerald-700 dark:text-emerald-300';
    } else if (tok === '←' || tok === ':=' || tok === '@') {
      cls = 'text-[#DC0915] dark:text-[#FF2A2A] font-bold';
    } else if (tok === '≠' || tok === '≤' || tok === '≥') {
      cls = 'text-amber-700 dark:text-amber-400 font-semibold';
    } else if (/^\d/.test(tok)) {
      cls = 'text-amber-700 dark:text-yellow-300';
    } else {
      const n = norm(tok);
      if (STRUCTURE_KW.has(n)) cls = 'text-[#C80815] dark:text-[#FF3B47] font-semibold';
      else if (CONTROL_KW.has(n)) cls = 'text-orange-700 dark:text-[#FF6B57] font-semibold';
      else if (TYPE_KW.has(n)) cls = 'text-purple-700 dark:text-purple-400 font-semibold';
      else if (BOOL_LIT.has(n)) cls = 'text-emerald-700 dark:text-emerald-400 font-semibold';
      else if (WORD_OPS.has(n)) cls = 'text-amber-700 dark:text-amber-400 font-semibold';
      else if (BUILTINS.has(n)) cls = 'text-sky-700 dark:text-sky-400 font-semibold';
    }

    nodes.push(
      <span key={key++} className={cls}>
        {tok}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : ['\u00A0'];
}

export const AlgoCodeBlock: React.FC<AlgoCodeBlockProps> = ({
  code,
  compact = false,
  showCopy = true,
  maxHeightClass = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const lines = code.trimEnd().split('\n');

  return (
    <div className="relative group rounded-lg bg-[var(--bg-code)] border border-[var(--border-main)] overflow-hidden">
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          title="Copier le code"
          className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-[var(--bg-surface)]/95 hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-main)] transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 cursor-pointer shadow-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">Copié</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copier</span>
            </>
          )}
        </button>
      )}
      <pre
        className={`overflow-auto font-mono ${compact ? 'text-[12px] leading-5 p-3' : 'text-[13px] leading-6 p-3.5'} ${maxHeightClass}`}
      >
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none w-7 shrink-0 text-right pr-3 text-slate-400 dark:text-zinc-600 text-[11px]">
                {i + 1}
              </span>
              <span className="whitespace-pre">{highlightLine(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};
