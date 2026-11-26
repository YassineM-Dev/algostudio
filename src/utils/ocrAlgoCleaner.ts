import { formatPseudocode } from '../engine';

/**
 * Applies a transform only to segments outside string literals ("..." / '...') and // comments.
 */
function transformCodeOutsideStrings(line: string, fn: (segment: string) => string): string {
  let result = '';
  let buf = '';
  let inQuote: '"' | "'" | null = null;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      result += ch;
      if (ch === '\\' && i + 1 < line.length) {
        result += line[++i];
      } else if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }

    if (ch === '/' && line[i + 1] === '/') {
      result += fn(buf) + line.slice(i);
      return result;
    }

    if (ch === '"' || ch === "'") {
      result += fn(buf) + ch;
      buf = '';
      inQuote = ch;
      continue;
    }

    buf += ch;
  }

  return result + fn(buf);
}

/**
 * Strips leading editor line numbers (e.g., "1  Algorithme Test", "2  Début", "3  x ← 5")
 * only when at least 3 non-empty lines begin with consecutive/ascending small line numbers.
 */
function stripEditorLineNumbers(lines: string[]): string[] {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length < 3) return lines;

  const numberedPattern = /^\s*(\d{1,3})\s{1,}(.+)$/;
  let matched = 0;
  let prevNum = 0;
  let monotonic = 0;

  for (const l of nonEmpty) {
    const m = l.match(numberedPattern);
    if (m) {
      const n = Number.parseInt(m[1], 10);
      matched++;
      if (n > prevNum && n <= prevNum + 3) {
        monotonic++;
      }
      prevNum = n;
    }
  }

  // Strip only if majority of lines look like sequential editor gutter numbers
  if (matched >= 3 && matched / nonEmpty.length >= 0.7 && monotonic >= Math.floor(matched * 0.7)) {
    return lines.map((l) => {
      const m = l.match(numberedPattern);
      return m ? m[2] : l;
    });
  }

  return lines;
}

function fixSegmentOcrArtifacts(seg: string): string {
  let s = seg;

  // Normalize OCR-corrupted arrows and assignment operators (including French guillemet artifacts like «<-, <«-, «-)
  s = s.replace(/[«<]+\s*[-—–~]+/g, ' ← ');
  s = s.replace(/:=/g, ' ← ');
  s = s.replace(/←/g, ' ← ');
  // Monospace slashed zero (Consolas/JetBrains) often OCRs as "@" on RHS of an assignment
  s = s.replace(/(←\s*)@(?=\s*($|[;,)+\-*/]))/g, '$10');

  // Normalize comparison operators
  s = s.replace(/<=/g, ' ≤ ');
  s = s.replace(/>=/g, ' ≥ ');
  s = s.replace(/!=|<>/g, ' ≠ ');

  // Common OCR letter confusions on French Algorithmique keywords
  const keywordFixes: Array<[RegExp, string]> = [
    [/\bA[1lI]gorith(?:m|rn)e\b/gi, 'Algorithme'],
    [/\bD[éeèê]b[uü][tl]\b/gi, 'Début'],
    [/\bD[éeèê]hut\b/gi, 'Début'],
    [/\bFin\s*[_-]?\s*Si\b/gi, 'Fin Si'],
    [/\bFin\s*[_-]?\s*Pour\b/gi, 'Fin Pour'],
    [/\bFin\s*[_-]?\s*Tant\s*Que\b/gi, 'Fin Tant Que'],
    [/\bFin\s*[_-]?\s*Selon\b/gi, 'Fin Selon'],
    [/\bTant\s*Que\b/gi, 'Tant Que'],
    [/\bR[éeè]p[éeè]ter\b/gi, 'Répéter'],
    [/\bJusqu['’`]?\s*[aà]\b/gi, "Jusqu'à"],
    [/\bProc[éeè]dur[ec]\b/gi, 'Procédure'],
    [/\bFonct[il1]on\b/gi, 'Fonction'],
    [/\bRetou(?:r|rn|m)er\b/gi, 'Retourner'],
    [/\b[EÉÈ]c(?:r[il1]|n)re\b/gi, 'Ecrire'],
    [/\b[EÉÈ]crire\b/gi, 'Ecrire'],
    [/\bL[il1]re\b/gi, 'Lire'],
    [/\bA[l1I]ors\b/gi, 'Alors'],
    [/\bS[il1]non\b/gi, 'Sinon'],
    [/\bS[il1]n0n\b/gi, 'Sinon'],
    [/\bFa[il1]re\b/gi, 'Faire'],
    [/\bSe[l1]on\b/gi, 'Selon'],
    [/\bP[o0]ur\b/gi, 'Pour'],
    [/\bS[1l]\b(?=\s*\(?[A-Za-z0-9_])/g, 'Si'],
    [/\bEnt[il1]er\b/gi, 'Entier'],
    [/\bR[éeè]el\b/gi, 'Réel'],
    [/\bCha[îi]ne\b/gi, 'Chaîne'],
    [/\bBool[éeè]en\b/gi, 'Booléen'],
    [/\bCaract[èe]re\b/gi, 'Caractère'],
    [/\bVra[il1]\b/gi, 'Vrai'],
    [/\bFaux\b/gi, 'Faux'],
  ];

  for (const [pattern, replacement] of keywordFixes) {
    s = s.replace(pattern, replacement);
  }

  // Normalize "Pour i De 1 A n Faire" -> "Pour i De 1 À n Faire"
  s = s.replace(
    /\b(Pour\s+.+?\s+De\s+.+?)\s+[AaÀà]\s+(.+?\s+Faire)\b/i,
    '$1 À $2'
  );

  // Clean accidental multiple spaces
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s;
}

/**
 * Cleans raw OCR text (from Tesseract or Vision AI) into clean, runnable Tunisian Bac pseudocode.
 */
export function cleanOcrToAlgo(rawText: string): string {
  // Strip markdown code fences if returned by an AI Vision model
  let text = rawText
    .replace(/^```[a-zA-Z]*\r?\n?/gm, '')
    .replace(/```\s*$/gm, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[“”]/g, '"')
    .replace(/«\s*([^»\n]+?)\s*»/g, '"$1"')
    .replace(/[‘’`]/g, "'");

  let lines = text.split('\n');
  lines = stripEditorLineNumbers(lines);

  const cleanedLines = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      return transformCodeOutsideStrings(trimmed, fixSegmentOcrArtifacts).trim();
    })
    // Collapse consecutive blank lines
    .filter((line, idx, arr) => !(line === '' && (idx === 0 || arr[idx - 1] === '')));

  while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] === '') {
    cleanedLines.pop();
  }

  const joined = cleanedLines.join('\n');
  if (!joined.trim()) return '';

  return formatPseudocode(joined);
}

/**
 * Extracts a clean .algo filename from an algorithm header ("Algorithme Somme" -> "Somme.algo").
 */
export function extractAlgoFilenameFromCode(code: string): string {
  const match = code.match(/^\s*Algorithme\s+([A-Za-zÀ-ÖØ-öø-ÿ0-9_]+)/im);
  if (match && match[1]) {
    return `${match[1]}.algo`;
  }
  return 'Photo_Algo.algo';
}
