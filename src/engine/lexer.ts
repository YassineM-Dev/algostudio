import { AlgoError, Token } from './types';

export function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const KEYWORDS = new Set<string>([
  'algorithme',
  'constante',
  'constantes',
  'type',
  'types',
  'variable',
  'variables',
  'debut',
  'fin',
  'ecrire',
  'ecrireln',
  'lire',
  'si',
  'alors',
  'sinon',
  'sinonsi',
  'finsi',
  'selon',
  'finselon',
  'autre',
  'defaut',
  'pour',
  'de',
  'a',
  'pas',
  'faire',
  'finpour',
  'tantque',
  'tant',
  'que',
  'fintantque',
  'repeter',
  'jusqua',
  'jusqu',
  'procedure',
  'finprocedure',
  'fonction',
  'finfonction',
  'retourner',
  'retourne',
  'tableau',
  'enregistrement',
  'finenregistrement',
  'entier',
  'reel',
  'chaine',
  'caractere',
  'booleen',
  'vrai',
  'faux',
  'mod',
  'div',
  'et',
  'ou',
  'non',
  'var',
]);

function isIdentStart(ch: string): boolean {
  return /[\p{L}_]/u.test(ch);
}

function isIdentPart(ch: string): boolean {
  return /[\p{L}\p{N}_]/u.test(ch);
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  const len = source.length;

  const peek = (offset = 0) => (i + offset < len ? source[i + offset] : '');
  const advance = () => {
    const ch = source[i++];
    if (ch === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
    return ch;
  };

  while (i < len) {
    const ch = peek();

    // Spaces and tabs
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      advance();
      continue;
    }

    // Newlines
    if (ch === '\n') {
      const startLine = line;
      const startCol = col;
      advance();
      if (tokens.length > 0 && tokens[tokens.length - 1].type !== 'NEWLINE') {
        tokens.push({ type: 'NEWLINE', value: '\n', raw: '\n', line: startLine, col: startCol });
      }
      continue;
    }

    // Line comments: // ... or # ...
    if ((ch === '/' && peek(1) === '/') || ch === '#') {
      while (i < len && peek() !== '\n') advance();
      continue;
    }

    // Block comments: /* ... */
    if (ch === '/' && peek(1) === '*') {
      const startLine = line;
      const startCol = col;
      advance();
      advance();
      let closed = false;
      while (i < len) {
        if (peek() === '*' && peek(1) === '/') {
          advance();
          advance();
          closed = true;
          break;
        }
        advance();
      }
      if (!closed) {
        throw new AlgoError(
          'Commentaire multi-lignes /* non fermé.',
          startLine,
          'lex',
          startCol,
          'Ajoutez */ pour fermer le commentaire.'
        );
      }
      continue;
    }

    // Pascal-style comments: { ... }
    if (ch === '{') {
      const startLine = line;
      const startCol = col;
      advance();
      let closed = false;
      while (i < len) {
        if (peek() === '}') {
          advance();
          closed = true;
          break;
        }
        advance();
      }
      if (!closed) {
        throw new AlgoError(
          'Commentaire { non fermé.',
          startLine,
          'lex',
          startCol,
          'Ajoutez } pour fermer le commentaire.'
        );
      }
      continue;
    }

    const startLine = line;
    const startCol = col;

    // String literals "..." or «...»
    if (ch === '"' || ch === '«') {
      const closing = ch === '«' ? '»' : '"';
      advance();
      let value = '';
      let closed = false;
      while (i < len) {
        const c = peek();
        if (c === '\n') {
          break;
        }
        if (c === '\\') {
          advance();
          const esc = advance();
          if (esc === 'n') value += '\n';
          else if (esc === 't') value += '\t';
          else if (esc === '"') value += '"';
          else if (esc === "'") value += "'";
          else if (esc === '\\') value += '\\';
          else value += esc;
          continue;
        }
        if (c === closing) {
          advance();
          closed = true;
          break;
        }
        value += advance();
      }
      if (!closed) {
        throw new AlgoError(
          `Chaîne de caractères non fermée (guillemet ${closing} manquant).`,
          startLine,
          'lex',
          startCol,
          `Fermez la chaîne avec ${closing} sur la même ligne.`
        );
      }
      tokens.push({ type: 'STRING', value, raw: `"${value}"`, line: startLine, col: startCol });
      continue;
    }

    // Character or single-quoted string literals '...'
    if (ch === "'") {
      advance();
      let value = '';
      let closed = false;
      while (i < len) {
        const c = peek();
        if (c === '\n') break;
        if (c === '\\') {
          advance();
          const esc = advance();
          if (esc === 'n') value += '\n';
          else if (esc === 't') value += '\t';
          else if (esc === "'") value += "'";
          else if (esc === '\\') value += '\\';
          else value += esc;
          continue;
        }
        if (c === "'") {
          advance();
          closed = true;
          break;
        }
        value += advance();
      }
      if (!closed) {
        throw new AlgoError(
          "Caractère ou chaîne entre apostrophes non fermé (').",
          startLine,
          'lex',
          startCol,
          "Ajoutez une apostrophe fermante '."
        );
      }
      tokens.push({
        type: value.length === 1 ? 'CHAR' : 'STRING',
        value,
        raw: `'${value}'`,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch)) {
      let raw = '';
      while (i < len && /[0-9]/.test(peek())) {
        raw += advance();
      }
      // Decimal point (but NOT '..' range operator!)
      if (peek() === '.' && peek(1) !== '.' && /[0-9]/.test(peek(1))) {
        raw += advance();
        while (i < len && /[0-9]/.test(peek())) {
          raw += advance();
        }
      }
      tokens.push({ type: 'NUMBER', value: raw, raw, line: startLine, col: startCol });
      continue;
    }

    // Identifiers and keywords
    if (isIdentStart(ch)) {
      let raw = '';
      while (i < len && isIdentPart(peek())) {
        raw += advance();
      }
      const norm = normalizeWord(raw);

      // Handle Jusqu'à / Jusqu'a
      if (norm === 'jusqu' && peek() === "'") {
        const afterQuote = peek(1);
        if (afterQuote && normalizeWord(afterQuote) === 'a' && !isIdentPart(peek(2))) {
          raw += advance(); // '
          raw += advance(); // a / à
          tokens.push({ type: 'KEYWORD', value: 'jusqua', raw, line: startLine, col: startCol });
          continue;
        }
      }

      // Handle French elision d'Entier / d'Enregistrement
      if (norm === 'd' && peek() === "'" && isIdentStart(peek(1))) {
        raw += advance(); // consume '
        tokens.push({ type: 'KEYWORD', value: 'de', raw, line: startLine, col: startCol });
        continue;
      }

      if (KEYWORDS.has(norm)) {
        tokens.push({ type: 'KEYWORD', value: norm, raw, line: startLine, col: startCol });
      } else {
        tokens.push({ type: 'IDENT', value: raw, raw, line: startLine, col: startCol });
      }
      continue;
    }

    // Multi-character & Unicode operators
    if (ch === '←') {
      advance();
      tokens.push({ type: 'ASSIGN', value: '←', raw: '←', line: startLine, col: startCol });
      continue;
    }
    if (ch === ':' && peek(1) === '=') {
      advance();
      advance();
      tokens.push({ type: 'ASSIGN', value: '←', raw: ':=', line: startLine, col: startCol });
      continue;
    }
    if (ch === '<' && peek(1) === '-') {
      advance();
      advance();
      tokens.push({ type: 'ASSIGN', value: '←', raw: '<-', line: startLine, col: startCol });
      continue;
    }
    if (ch === '≠') {
      advance();
      tokens.push({ type: 'NEQ', value: '≠', raw: '≠', line: startLine, col: startCol });
      continue;
    }
    if ((ch === '<' && peek(1) === '>') || (ch === '!' && peek(1) === '=')) {
      const r = advance() + advance();
      tokens.push({ type: 'NEQ', value: '≠', raw: r, line: startLine, col: startCol });
      continue;
    }
    if (ch === '≤') {
      advance();
      tokens.push({ type: 'LTE', value: '≤', raw: '≤', line: startLine, col: startCol });
      continue;
    }
    if (ch === '<' && peek(1) === '=') {
      advance();
      advance();
      tokens.push({ type: 'LTE', value: '≤', raw: '<=', line: startLine, col: startCol });
      continue;
    }
    if (ch === '≥') {
      advance();
      tokens.push({ type: 'GTE', value: '≥', raw: '≥', line: startLine, col: startCol });
      continue;
    }
    if (ch === '>' && peek(1) === '=') {
      advance();
      advance();
      tokens.push({ type: 'GTE', value: '≥', raw: '>=', line: startLine, col: startCol });
      continue;
    }
    if (ch === '.' && peek(1) === '.') {
      advance();
      advance();
      tokens.push({ type: 'DOTDOT', value: '..', raw: '..', line: startLine, col: startCol });
      continue;
    }
    if (ch === '=' && peek(1) === '=') {
      advance();
      advance();
      tokens.push({ type: 'EQ', value: '=', raw: '==', line: startLine, col: startCol });
      continue;
    }
    if (ch === '*' && peek(1) === '*') {
      advance();
      advance();
      tokens.push({ type: 'CARET', value: '^', raw: '**', line: startLine, col: startCol });
      continue;
    }

    // Single-character symbols
    const singleMap: Record<string, Token['type']> = {
      '+': 'PLUS',
      '-': 'MINUS',
      '−': 'MINUS',
      '*': 'STAR',
      '×': 'STAR',
      '/': 'SLASH',
      '÷': 'SLASH',
      '^': 'CARET',
      '=': 'EQ',
      '<': 'LT',
      '>': 'GT',
      '(': 'LPAREN',
      ')': 'RPAREN',
      '[': 'LBRACKET',
      ']': 'RBRACKET',
      ',': 'COMMA',
      ':': 'COLON',
      ';': 'SEMICOLON',
      '.': 'DOT',
      '@': 'AT',
    };

    if (singleMap[ch]) {
      advance();
      const val = ch === '−' ? '-' : ch === '×' ? '*' : ch === '÷' ? '/' : ch;
      tokens.push({ type: singleMap[ch], value: val, raw: ch, line: startLine, col: startCol });
      continue;
    }

    throw new AlgoError(
      `Caractère inattendu « ${ch} ».`,
      startLine,
      'lex',
      startCol,
      'Vérifiez la syntaxe ou les symboles utilisés sur cette ligne.'
    );
  }

  tokens.push({ type: 'EOF', value: '', raw: '', line, col });
  return tokens;
}
