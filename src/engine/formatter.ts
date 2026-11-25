import { normalizeWord } from './lexer';

/**
 * Formats French algorithmic pseudocode with consistent 4-space indentation
 * and canonical Unicode operators (←, ≤, ≥, ≠) outside of string literals and comments.
 */
export function formatPseudocode(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let indent = 0;
  let inDeclSection = false;
  let inSwitch = false;
  let inSwitchCase = false;

  const indentStr = (lvl: number) => '    '.repeat(Math.max(0, lvl));

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed === '') {
      // Avoid duplicate consecutive blank lines
      if (out.length > 0 && out[out.length - 1] !== '') {
        out.push('');
      }
      continue;
    }

    const normalizedLine = normalizeOperatorsOutsideStrings(trimmed);
    const firstWordMatch = normalizedLine.match(/^([\p{L}_']+)/u);
    const firstWord = firstWordMatch ? normalizeWord(firstWordMatch[1]) : '';
    const secondWordMatch = normalizedLine.match(/^[\p{L}_']+\s+([\p{L}_']+)/u);
    const secondWord = secondWordMatch ? normalizeWord(secondWordMatch[1]) : '';

    const isComment =
      normalizedLine.startsWith('//') ||
      normalizedLine.startsWith('/*') ||
      normalizedLine.startsWith('{') ||
      normalizedLine.startsWith('#');

    if (isComment) {
      out.push(indentStr(indent + (inDeclSection ? 1 : 0)) + normalizedLine);
      continue;
    }

    // Section headers
    if (firstWord === 'algorithme') {
      inDeclSection = false;
      indent = 0;
      out.push(normalizedLine);
      continue;
    }

    if (
      firstWord === 'constantes' ||
      firstWord === 'constante' ||
      firstWord === 'types' ||
      firstWord === 'variables' ||
      firstWord === 'variable'
    ) {
      inDeclSection = true;
      out.push(indentStr(indent) + normalizedLine);
      continue;
    }

    if (firstWord === 'type' && /=\s*enregistrement/i.test(normalizedLine)) {
      inDeclSection = false;
      out.push(indentStr(indent) + normalizedLine);
      indent++;
      continue;
    }

    if (firstWord === 'procedure' || firstWord === 'fonction') {
      inDeclSection = false;
      indent = 0;
      if (out.length > 0 && out[out.length - 1] !== '') {
        out.push('');
      }
      out.push(normalizedLine);
      continue;
    }

    if (firstWord === 'debut' && !/^debut\s*[:,←]/i.test(normalizedLine)) {
      inDeclSection = false;
      out.push(indentStr(indent) + normalizedLine);
      indent++;
      continue;
    }

    // Dedent-before keywords
    const isEndBlock =
      firstWord === 'finsi' ||
      firstWord === 'finpour' ||
      firstWord === 'fintantque' ||
      firstWord === 'finselon' ||
      firstWord === 'finfonction' ||
      firstWord === 'finprocedure' ||
      firstWord === 'finenregistrement' ||
      (firstWord === 'fin' &&
        (secondWord === 'si' ||
          secondWord === 'pour' ||
          secondWord === 'tantque' ||
          secondWord === 'tant' ||
          secondWord === 'selon' ||
          secondWord === 'fonction' ||
          secondWord === 'procedure' ||
          secondWord === 'enregistrement' ||
          !/^fin\s*[:,←[\].a-z]/i.test(normalizedLine)));

    const isUntil =
      firstWord === 'jusqua' || firstWord === "jusqu'a" || (firstWord === 'jusqu' && secondWord === 'a');

    if (isEndBlock || isUntil) {
      inDeclSection = false;
      if (firstWord === 'finselon' || (firstWord === 'fin' && secondWord === 'selon')) {
        if (inSwitchCase) {
          indent = Math.max(0, indent - 1);
          inSwitchCase = false;
        }
        inSwitch = false;
      }
      indent = Math.max(0, indent - 1);
      out.push(indentStr(indent) + normalizedLine);
      continue;
    }

    // Sinon / Sinon Si
    if (firstWord === 'sinon' || firstWord === 'sinonsi') {
      if (inSwitch) {
        if (inSwitchCase) {
          indent = Math.max(0, indent - 1);
        }
        out.push(indentStr(indent) + normalizedLine);
        if (normalizedLine.endsWith(':')) {
          indent++;
          inSwitchCase = true;
        } else {
          inSwitchCase = false;
        }
      } else {
        indent = Math.max(0, indent - 1);
        out.push(indentStr(indent) + normalizedLine);
        indent++;
      }
      continue;
    }

    // Switch case label inside Selon
    if (inSwitch && /^[^←(]+:\s*/.test(normalizedLine) && !/^(ecrire|afficher|lire|si|pour|tantque|repeter)/i.test(firstWord)) {
      if (inSwitchCase) {
        indent = Math.max(0, indent - 1);
      }
      out.push(indentStr(indent) + normalizedLine);
      if (normalizedLine.endsWith(':')) {
        indent++;
        inSwitchCase = true;
      } else {
        inSwitchCase = false;
      }
      continue;
    }

    // Single-line Si ... Alors ... FinSi
    if (firstWord === 'si' && /\bfin\s*si\b/i.test(normalizedLine)) {
      out.push(indentStr(indent) + normalizedLine);
      continue;
    }

    // Standard line output
    const effectiveIndent = indent + (inDeclSection ? 1 : 0);
    out.push(indentStr(effectiveIndent) + normalizedLine);

    // Block openers that increase indent after line
    if (
      firstWord === 'si' ||
      firstWord === 'pour' ||
      firstWord === 'tantque' ||
      (firstWord === 'tant' && secondWord === 'que') ||
      firstWord === 'repeter'
    ) {
      indent++;
    } else if (firstWord === 'selon') {
      indent++;
      inSwitch = true;
      inSwitchCase = false;
    }
  }

  return out.join('\n').trimEnd() + '\n';
}

function normalizeOperatorsOutsideStrings(line: string): string {
  let result = '';
  let inString: '"' | "'" | null = null;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    if (inString) {
      result += ch;
      if (ch === '\\' && i + 1 < line.length) {
        result += line[++i];
      } else if (ch === inString) {
        inString = null;
      }
      i++;
      continue;
    }

    // Stop normalizing inside line comments
    if (ch === '/' && line[i + 1] === '/') {
      result += line.slice(i);
      break;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      result += ch;
      i++;
      continue;
    }

    const two = line.slice(i, i + 2);
    if (two === ':=' || two === '<-') {
      result += '←';
      i += 2;
      continue;
    }
    if (two === '<=' ) {
      result += '≤';
      i += 2;
      continue;
    }
    if (two === '>=') {
      result += '≥';
      i += 2;
      continue;
    }
    if (two === '<>' || two === '!=') {
      result += '≠';
      i += 2;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}
