import {
  AlgoError,
  ConstDecl,
  ExprNode,
  LValue,
  ParamDecl,
  PrimitiveTypeName,
  ProgramNode,
  StmtNode,
  SubprogramDecl,
  Token,
  TypeDecl,
  TypeSpec,
  VarDecl,
} from './types';

const SOFT_IDENT_KEYWORDS = new Set([
  'a',
  'de',
  'pas',
  'debut',
  'fin',
  'autre',
  'defaut',
  'var',
  'type',
  'types',
]);

const PRIMITIVE_MAP: Record<string, { name: PrimitiveTypeName; display: string }> = {
  entier: { name: 'entier', display: 'Entier' },
  reel: { name: 'reel', display: 'Réel' },
  chaine: { name: 'chaine', display: 'Chaîne' },
  caractere: { name: 'caractere', display: 'Caractère' },
  booleen: { name: 'booleen', display: 'Booléen' },
};

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset = 0): Token {
    const idx = this.pos + offset;
    if (idx >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1];
    }
    return this.tokens[idx];
  }

  private advance(): Token {
    const t = this.peek();
    if (t.type !== 'EOF') this.pos++;
    return t;
  }

  private skipNewlinesAndSemicolons(): void {
    while (this.peek().type === 'NEWLINE' || this.peek().type === 'SEMICOLON') {
      this.advance();
    }
  }

  private isKw(kw: string, offset = 0): boolean {
    const t = this.peek(offset);
    return t.type === 'KEYWORD' && t.value === kw;
  }

  private isCompoundEnd(single: string, secondWord: string, thirdWord?: string): boolean {
    if (this.isKw(single)) return true;
    if (this.isKw('fin') && this.isKw(secondWord, 1)) {
      if (!thirdWord) return true;
      if (this.isKw(thirdWord, 2)) return true;
    }
    return false;
  }

  private consumeCompoundEnd(single: string, secondWord: string, label: string, thirdWord?: string): void {
    if (this.isKw(single)) {
      this.advance();
      return;
    }
    if (this.isKw('fin') && this.isKw(secondWord, 1)) {
      if (!thirdWord || this.isKw(thirdWord, 2)) {
        this.advance();
        this.advance();
        if (thirdWord) this.advance();
        return;
      }
    }
    const t = this.peek();
    throw new AlgoError(
      `Mot-clé « ${label} » attendu, mais « ${t.raw || 'fin de fichier'} » trouvé.`,
      t.line,
      'parse',
      t.col,
      `Assurez-vous de fermer votre bloc avec ${label}.`
    );
  }

  private isFinBlockTerminator(): boolean {
    if (!this.isKw('fin')) return false;
    const next = this.peek(1);
    // If followed by assignment, index, or field access (fin.x), it's a variable named "fin"
    if (next.type === 'ASSIGN' || next.type === 'LBRACKET') return false;
    if (next.type === 'DOT' && (this.peek(2).type === 'IDENT' || this.isIdentLike(2))) return false;
    // Also if followed by binary operator or paren/comma/colon
    if (
      next.type === 'PLUS' ||
      next.type === 'MINUS' ||
      next.type === 'STAR' ||
      next.type === 'SLASH' ||
      next.type === 'EQ' ||
      next.type === 'NEQ' ||
      next.type === 'LT' ||
      next.type === 'LTE' ||
      next.type === 'GT' ||
      next.type === 'GTE' ||
      next.type === 'COMMA' ||
      next.type === 'COLON' ||
      next.type === 'RPAREN' ||
      next.type === 'RBRACKET'
    ) {
      return false;
    }
    return true;
  }

  private isIdentLike(offset = 0): boolean {
    const t = this.peek(offset);
    if (t.type === 'IDENT') return true;
    if (t.type === 'KEYWORD' && SOFT_IDENT_KEYWORDS.has(t.value)) return true;
    return false;
  }

  private expectIdent(context = 'identificateur'): Token {
    const t = this.peek();
    if (this.isIdentLike()) {
      return this.advance();
    }
    throw new AlgoError(
      `Un ${context} était attendu, mais « ${t.raw || 'fin de fichier'} » a été trouvé.`,
      t.line,
      'parse',
      t.col
    );
  }

  private expectToken(type: Token['type'], display: string, hint?: string): Token {
    const t = this.peek();
    if (t.type === type) {
      return this.advance();
    }
    throw new AlgoError(
      `Symbole « ${display} » attendu, mais « ${t.raw || 'fin de fichier'} » trouvé.`,
      t.line,
      'parse',
      t.col,
      hint
    );
  }

  private expectKw(kw: string, display: string, hint?: string): Token {
    const t = this.peek();
    if (this.isKw(kw)) {
      return this.advance();
    }
    throw new AlgoError(
      `Mot-clé « ${display} » attendu, mais « ${t.raw || 'fin de fichier'} » trouvé.`,
      t.line,
      'parse',
      t.col,
      hint
    );
  }

  public parseProgram(): ProgramNode {
    const program: ProgramNode = {
      name: 'SansTitre',
      constants: [],
      types: [],
      variables: [],
      subprograms: [],
      body: [],
    };

    this.skipNewlinesAndSemicolons();

    // Optional Algorithme header
    if (this.isKw('algorithme')) {
      this.advance();
      if (this.isIdentLike()) {
        program.name = this.advance().raw;
      }
      this.skipNewlinesAndSemicolons();
    }

    // Parse declarations and subprograms before Début
    while (this.peek().type !== 'EOF') {
      this.skipNewlinesAndSemicolons();
      if (this.peek().type === 'EOF') break;

      if (this.isKw('debut') && this.peek(1).type !== 'COMMA' && this.peek(1).type !== 'COLON') {
        break;
      }

      if (this.isKw('constantes') || this.isKw('constante')) {
        this.advance();
        this.skipNewlinesAndSemicolons();
        this.parseConstSection(program.constants);
      } else if (this.isKw('types') || this.isKw('type')) {
        this.advance();
        this.skipNewlinesAndSemicolons();
        this.parseTypeSection(program.types);
      } else if (this.isKw('variables') || this.isKw('variable')) {
        this.advance();
        this.skipNewlinesAndSemicolons();
        this.parseVarSection(program.variables);
      } else if (this.isKw('procedure')) {
        program.subprograms.push(this.parseSubprogram('procedure'));
      } else if (this.isKw('fonction')) {
        program.subprograms.push(this.parseSubprogram('function'));
      } else {
        // Fallback: maybe user omitted Début and started writing statements directly?
        break;
      }
    }

    this.skipNewlinesAndSemicolons();

    if (this.isKw('debut')) {
      this.advance();
      this.skipNewlinesAndSemicolons();
      program.body = this.parseStatementList(() => this.isFinBlockTerminator() || this.peek().type === 'EOF');

      if (this.isFinBlockTerminator()) {
        this.advance();
        // Optional trailing dot or program name after Fin
        if (this.peek().type === 'DOT') {
          this.advance();
        } else if (this.isIdentLike() && this.peek().line === this.tokens[this.pos - 1].line) {
          this.advance();
        }
      } else if (this.peek().type === 'EOF') {
        const last = this.peek();
        throw new AlgoError(
          'Mot-clé « Fin » manquant à la fin du programme principal.',
          last.line,
          'parse',
          last.col,
          'Tout bloc Début doit se terminer par Fin.'
        );
      }
    } else if (this.peek().type !== 'EOF') {
      // Allow standalone statements if no Début was written
      program.body = this.parseStatementList(() => this.peek().type === 'EOF' || this.isKw('procedure') || this.isKw('fonction'));
    }

    // Parse subprograms defined AFTER Fin (very common in Tunisian Bac Informatique!)
    while (this.peek().type !== 'EOF') {
      this.skipNewlinesAndSemicolons();
      if (this.peek().type === 'EOF') break;
      if (this.isKw('procedure')) {
        program.subprograms.push(this.parseSubprogram('procedure'));
      } else if (this.isKw('fonction')) {
        program.subprograms.push(this.parseSubprogram('function'));
      } else {
        const t = this.peek();
        throw new AlgoError(
          `Instruction inattendue « ${t.raw} » après la fin du programme.`,
          t.line,
          'parse',
          t.col,
          'Après Fin, seules des déclarations de Procédure ou Fonction sont autorisées.'
        );
      }
    }

    return program;
  }

  private isSectionHeader(): boolean {
    if (this.isKw('constantes') || this.isKw('constante')) {
      return this.peek(1).type !== 'COMMA' && this.peek(1).type !== 'COLON' && this.peek(1).type !== 'ASSIGN';
    }
    if (this.isKw('types') || this.isKw('type')) {
      // "Type Etudiant = Enregistrement" is a type declaration header
      return true;
    }
    if (this.isKw('variables') || this.isKw('variable')) {
      return this.peek(1).type !== 'COMMA' && this.peek(1).type !== 'COLON' && this.peek(1).type !== 'ASSIGN';
    }
    if (this.isKw('debut')) {
      return this.peek(1).type !== 'COMMA' && this.peek(1).type !== 'COLON' && this.peek(1).type !== 'ASSIGN';
    }
    if (this.isKw('procedure') || this.isKw('fonction')) return true;
    if (this.isFinBlockTerminator()) return true;
    return false;
  }

  private parseConstSection(target: ConstDecl[]): void {
    while (this.peek().type !== 'EOF') {
      this.skipNewlinesAndSemicolons();
      if (this.peek().type === 'EOF' || this.isSectionHeader()) break;

      const nameTok = this.expectIdent('nom de constante');
      let explicitType: TypeSpec | undefined;

      if (this.peek().type === 'COLON') {
        this.advance();
        // Could be "PI : 3.14" or "PI : Réel = 3.14"
        if (this.isTypeStart()) {
          explicitType = this.parseTypeSpec();
          if (this.peek().type === 'ASSIGN' || this.peek().type === 'EQ') {
            this.advance();
          }
        }
      } else if (this.peek().type === 'ASSIGN' || this.peek().type === 'EQ') {
        this.advance();
      } else {
        const t = this.peek();
        throw new AlgoError(
          `Symbole « ← » ou « = » attendu après la constante « ${nameTok.raw} ».`,
          t.line,
          'parse',
          t.col,
          `Exemple : ${nameTok.raw} ← 10`
        );
      }

      const value = this.parseExpression();
      target.push({ name: nameTok.raw, value, type: explicitType, line: nameTok.line });
      this.skipNewlinesAndSemicolons();
    }
  }

  private parseTypeSection(target: TypeDecl[]): void {
    while (this.peek().type !== 'EOF') {
      this.skipNewlinesAndSemicolons();
      if (this.peek().type === 'EOF') break;

      // Allow repeated "Type Foo = ..." lines
      if (this.isKw('type')) {
        this.advance();
      } else if (this.isSectionHeader()) {
        break;
      }

      const nameTok = this.expectIdent('nom de type');
      if (this.peek().type === 'EQ' || this.peek().type === 'COLON' || this.peek().type === 'ASSIGN') {
        this.advance();
      } else {
        const t = this.peek();
        throw new AlgoError(
          `Symbole « = » attendu dans la déclaration du type « ${nameTok.raw} ».`,
          t.line,
          'parse',
          t.col
        );
      }

      const spec = this.parseTypeSpec(nameTok.raw);
      target.push({ name: nameTok.raw, spec, line: nameTok.line });
      this.skipNewlinesAndSemicolons();
    }
  }

  private parseVarSection(target: VarDecl[]): void {
    while (this.peek().type !== 'EOF') {
      this.skipNewlinesAndSemicolons();
      if (this.peek().type === 'EOF' || this.isSectionHeader()) break;

      const names: Token[] = [this.expectIdent('nom de variable')];
      while (this.peek().type === 'COMMA') {
        this.advance();
        names.push(this.expectIdent('nom de variable'));
      }

      this.expectToken(
        'COLON',
        ':',
        'Déclarez le type avec « : », par exemple : x, y : Entier'
      );

      const typeSpec = this.parseTypeSpec();

      let initialValue: ExprNode | undefined;
      if (this.peek().type === 'ASSIGN' || this.peek().type === 'EQ') {
        this.advance();
        initialValue = this.parseExpression();
      }

      for (const n of names) {
        target.push({ name: n.raw, type: typeSpec, initialValue, line: n.line });
      }
      this.skipNewlinesAndSemicolons();
    }
  }

  private isTypeStart(): boolean {
    const t = this.peek();
    if (t.type === 'KEYWORD') {
      if (PRIMITIVE_MAP[t.value] || t.value === 'tableau' || t.value === 'enregistrement') {
        return true;
      }
    }
    return false;
  }

  private parseTypeSpec(recordTypeName = 'Enregistrement'): TypeSpec {
    const t = this.peek();

    if (t.type === 'KEYWORD' && PRIMITIVE_MAP[t.value]) {
      this.advance();
      const p = PRIMITIVE_MAP[t.value];
      return { kind: 'primitive', name: p.name, display: p.display };
    }

    if (this.isKw('tableau')) {
      this.advance();
      const dimensions: Array<{ low: ExprNode; high: ExprNode }> = [];

      // Support Tableau[1..10], Tableau[1..10, 1..5], Tableau[1..10][1..5], Tableau[10]
      while (this.peek().type === 'LBRACKET') {
        this.advance();
        do {
          const first = this.parseExpression();
          if (this.peek().type === 'DOTDOT') {
            this.advance();
            const high = this.parseExpression();
            dimensions.push({ low: first, high });
          } else {
            // Single size e.g. Tableau[10] -> 1..10
            dimensions.push({
              low: { kind: 'number', value: 1, isReal: false, line: t.line },
              high: first,
            });
          }
        } while (this.peek().type === 'COMMA' && this.advance());
        this.expectToken('RBRACKET', ']');
      }

      let elementType: TypeSpec | undefined;
      if (this.isKw('de')) {
        this.advance();
        elementType = this.parseTypeSpec();
      }

      if (dimensions.length === 0) {
        return {
          kind: 'array_unsized',
          elementType,
          display: elementType ? `Tableau de ${elementType.display}` : 'Tableau',
        };
      }

      const resolvedElem = elementType ?? { kind: 'primitive', name: 'entier', display: 'Entier' };
      return {
        kind: 'array',
        dimensions,
        elementType: resolvedElem,
        display: `Tableau de ${resolvedElem.display}`,
      };
    }

    if (this.isKw('enregistrement')) {
      this.advance();
      this.skipNewlinesAndSemicolons();
      const fields: Array<{ name: string; type: TypeSpec }> = [];

      while (
        this.peek().type !== 'EOF' &&
        !this.isCompoundEnd('finenregistrement', 'enregistrement') &&
        !this.isFinBlockTerminator()
      ) {
        this.skipNewlinesAndSemicolons();
        if (this.isCompoundEnd('finenregistrement', 'enregistrement') || this.isFinBlockTerminator()) {
          break;
        }
        const fieldNames: Token[] = [this.expectIdent('nom de champ')];
        while (this.peek().type === 'COMMA') {
          this.advance();
          fieldNames.push(this.expectIdent('nom de champ'));
        }
        this.expectToken('COLON', ':');
        const fieldType = this.parseTypeSpec();
        for (const fn of fieldNames) {
          fields.push({ name: fn.raw, type: fieldType });
        }
        this.skipNewlinesAndSemicolons();
      }

      if (this.isCompoundEnd('finenregistrement', 'enregistrement')) {
        this.consumeCompoundEnd('finenregistrement', 'enregistrement', 'FinEnregistrement');
      } else if (this.isFinBlockTerminator()) {
        this.advance();
      } else {
        throw new AlgoError(
          'Mot-clé « FinEnregistrement » manquant.',
          this.peek().line,
          'parse',
          this.peek().col
        );
      }

      return { kind: 'record', fields, display: recordTypeName };
    }

    if (this.isIdentLike()) {
      const name = this.advance().raw;
      return { kind: 'named', name, display: name };
    }

    throw new AlgoError(
      `Type de données attendu (Entier, Réel, Chaîne, Caractère, Booléen, Tableau...), mais « ${t.raw || 'fin de fichier'} » trouvé.`,
      t.line,
      'parse',
      t.col
    );
  }

  private parseSubprogram(kind: 'procedure' | 'function'): SubprogramDecl {
    const startTok = this.advance(); // Procédure or Fonction
    const nameTok = this.expectIdent(kind === 'procedure' ? 'nom de procédure' : 'nom de fonction');

    const params: ParamDecl[] = [];
    if (this.peek().type === 'LPAREN') {
      this.advance();
      this.parseParamList(params);
      this.expectToken('RPAREN', ')');
    }

    let returnType: TypeSpec | undefined;
    if (kind === 'function') {
      this.expectToken(
        'COLON',
        ':',
        `Précisez le type de retour de la fonction, par exemple : Fonction ${nameTok.raw}(...) : Entier`
      );
      returnType = this.parseTypeSpec();
    }

    this.skipNewlinesAndSemicolons();

    const constants: ConstDecl[] = [];
    const types: TypeDecl[] = [];
    const variables: VarDecl[] = [];

    while (this.peek().type !== 'EOF') {
      this.skipNewlinesAndSemicolons();
      if (this.isKw('debut') && this.peek(1).type !== 'COMMA' && this.peek(1).type !== 'COLON') {
        break;
      }
      if (this.isKw('constantes') || this.isKw('constante')) {
        this.advance();
        this.skipNewlinesAndSemicolons();
        this.parseConstSection(constants);
      } else if (this.isKw('types') || this.isKw('type')) {
        this.advance();
        this.skipNewlinesAndSemicolons();
        this.parseTypeSection(types);
      } else if (this.isKw('variables') || this.isKw('variable')) {
        this.advance();
        this.skipNewlinesAndSemicolons();
        this.parseVarSection(variables);
      } else {
        break;
      }
    }

    this.expectKw(
      'debut',
      'Début',
      `Le corps de ${kind === 'procedure' ? 'la procédure' : 'la fonction'} « ${nameTok.raw} » doit commencer par Début.`
    );
    this.skipNewlinesAndSemicolons();

    const endSingle = kind === 'procedure' ? 'finprocedure' : 'finfonction';
    const endWord = kind === 'procedure' ? 'procedure' : 'fonction';
    const endLabel = kind === 'procedure' ? 'FinProcédure' : 'FinFonction';

    const body = this.parseStatementList(
      () =>
        this.isCompoundEnd(endSingle, endWord) ||
        this.isFinBlockTerminator() ||
        this.peek().type === 'EOF'
    );

    if (this.isCompoundEnd(endSingle, endWord)) {
      this.consumeCompoundEnd(endSingle, endWord, endLabel);
    } else if (this.isFinBlockTerminator()) {
      this.advance();
    } else {
      throw new AlgoError(
        `Mot-clé « ${endLabel} » manquant pour fermer « ${nameTok.raw} ».`,
        this.peek().line,
        'parse',
        this.peek().col
      );
    }

    return {
      kind,
      name: nameTok.raw,
      params,
      returnType,
      constants,
      types,
      variables,
      body,
      line: startTok.line,
    };
  }

  private parseParamList(params: ParamDecl[]): void {
    while (this.peek().type !== 'RPAREN' && this.peek().type !== 'EOF') {
      const pending: Array<{ name: string; byRef: boolean; line: number }> = [];
      let groupByRef = false;

      // Check group-level Var or E/S
      if (this.isKw('var')) {
        this.advance();
        groupByRef = true;
      } else if (this.isESModifier()) {
        groupByRef = true;
      }

      while (true) {
        let itemByRef = groupByRef;
        if (this.peek().type === 'AT') {
          this.advance();
          itemByRef = true;
        } else if (this.isKw('var')) {
          this.advance();
          itemByRef = true;
        } else if (this.isESModifier()) {
          itemByRef = true;
        }

        const pName = this.expectIdent('nom de paramètre');
        pending.push({ name: pName.raw, byRef: itemByRef, line: pName.line });

        if (this.peek().type === 'COMMA') {
          this.advance();
          continue;
        }
        break;
      }

      let paramType: TypeSpec = { kind: 'primitive', name: 'entier', display: 'Entier' };
      if (this.peek().type === 'COLON') {
        this.advance();
        paramType = this.parseTypeSpec();
      }

      for (const p of pending) {
        params.push({ name: p.name, byRef: p.byRef, type: paramType, line: p.line });
      }

      if (this.peek().type === 'COMMA' || this.peek().type === 'SEMICOLON') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private isESModifier(): boolean {
    const t0 = this.peek(0);
    const t1 = this.peek(1);
    const t2 = this.peek(2);
    if (
      t0.type === 'IDENT' &&
      t0.raw.toLowerCase() === 'e' &&
      t1.type === 'SLASH' &&
      t2.type === 'IDENT' &&
      t2.raw.toLowerCase() === 's'
    ) {
      this.advance();
      this.advance();
      this.advance();
      return true;
    }
    return false;
  }

  private parseStatementList(shouldStop: () => boolean): StmtNode[] {
    const stmts: StmtNode[] = [];
    while (this.peek().type !== 'EOF') {
      this.skipNewlinesAndSemicolons();
      if (this.peek().type === 'EOF' || shouldStop()) break;
      stmts.push(this.parseStatement());
    }
    return stmts;
  }

  private parseStatement(): StmtNode {
    const t = this.peek();

    if (this.isKw('ecrire') || this.isKw('ecrireln')) {
      return this.parseWriteStmt();
    }
    if (this.isKw('lire')) {
      return this.parseReadStmt();
    }
    if (this.isKw('si')) {
      return this.parseIfStmt();
    }
    if (this.isKw('selon')) {
      return this.parseSwitchStmt();
    }
    if (this.isKw('pour')) {
      return this.parseForStmt();
    }
    if (this.isKw('tantque') || (this.isKw('tant') && this.isKw('que', 1))) {
      return this.parseWhileStmt();
    }
    if (this.isKw('repeter')) {
      return this.parseRepeatStmt();
    }
    if (this.isKw('retourner') || this.isKw('retourne')) {
      return this.parseReturnStmt();
    }

    // Assignment or procedure call
    if (this.isIdentLike()) {
      // Check if direct procedure call: Ident(...)
      if (this.peek(1).type === 'LPAREN') {
        const nameTok = this.advance();
        this.advance(); // (
        const args: ExprNode[] = [];
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseExpression());
          while (this.peek().type === 'COMMA') {
            this.advance();
            args.push(this.parseExpression());
          }
        }
        this.expectToken('RPAREN', ')');
        return { kind: 'call', name: nameTok.raw, args, line: nameTok.line };
      }

      // Otherwise parse LValue followed by ←
      const target = this.parseLValue();
      if (this.peek().type === 'ASSIGN') {
        this.advance();
        const value = this.parseExpression();
        return { kind: 'assign', target, value, line: target.line };
      }

      // Procedure call without parentheses if standalone ident on line?
      if (
        target.kind === 'var' &&
        (this.peek().type === 'NEWLINE' || this.peek().type === 'SEMICOLON' || this.peek().type === 'EOF')
      ) {
        return { kind: 'call', name: target.name, args: [], line: target.line };
      }

      const next = this.peek();
      const eqHint =
        next.type === 'EQ'
          ? `Utilisez « ← » pour affecter une valeur au lieu de « = » : ${this.formatLValue(target)} ← ...`
          : 'Utilisez ← (ou :=) pour affecter une valeur, par exemple : x ← 5';
      throw new AlgoError(
        `Opérateur d'affectation « ← » attendu après « ${this.formatLValue(target)} », mais « ${next.raw || 'fin de ligne'} » trouvé.`,
        next.line,
        'parse',
        next.col,
        eqHint
      );
    }

    throw new AlgoError(
      `Instruction inattendue « ${t.raw} ».`,
      t.line,
      'parse',
      t.col,
      'Vérifiez la syntaxe ou un mot-clé mal orthographié.'
    );
  }

  private formatLValue(lv: LValue): string {
    if (lv.kind === 'var') return lv.name;
    if (lv.kind === 'index') return `${this.formatLValue(lv.target)}[...]`;
    return `${this.formatLValue(lv.target)}.${lv.field}`;
  }

  private parseLValue(): LValue {
    const base = this.expectIdent('nom de variable');
    let lv: LValue = { kind: 'var', name: base.raw, line: base.line };

    while (true) {
      if (this.peek().type === 'LBRACKET') {
        const lb = this.advance();
        const indices: ExprNode[] = [this.parseExpression()];
        while (this.peek().type === 'COMMA') {
          this.advance();
          indices.push(this.parseExpression());
        }
        this.expectToken('RBRACKET', ']');
        lv = { kind: 'index', target: lv, indices, line: lb.line };
      } else if (this.peek().type === 'DOT') {
        this.advance();
        const field = this.expectIdent('nom de champ');
        lv = { kind: 'field', target: lv, field: field.raw, line: field.line };
      } else {
        break;
      }
    }
    return lv;
  }

  private parseWriteStmt(): StmtNode {
    const tok = this.advance();
    const newline = true; // Ecrire always outputs a console line unless inline chaining
    this.expectToken('LPAREN', '(', `Exemple : ${tok.raw}("Bonjour", x)`);
    const args: ExprNode[] = [];
    if (this.peek().type !== 'RPAREN') {
      args.push(this.parseExpression());
      while (this.peek().type === 'COMMA') {
        this.advance();
        args.push(this.parseExpression());
      }
    }
    this.expectToken('RPAREN', ')');
    return { kind: 'write', args, newline, line: tok.line };
  }

  private parseReadStmt(): StmtNode {
    const tok = this.advance();
    this.expectToken('LPAREN', '(', 'Exemple : Lire(x)');
    const targets: LValue[] = [this.parseLValue()];
    while (this.peek().type === 'COMMA') {
      this.advance();
      targets.push(this.parseLValue());
    }
    this.expectToken('RPAREN', ')');
    return { kind: 'read', targets, line: tok.line };
  }

  private parseIfStmt(): StmtNode {
    const tok = this.advance(); // Si
    const condition = this.parseExpression();
    this.expectKw('alors', 'Alors', 'La condition d’un Si doit être suivie du mot-clé Alors.');
    this.skipNewlinesAndSemicolons();

    const stopThen = () =>
      this.isKw('sinon') ||
      this.isKw('sinonsi') ||
      this.isCompoundEnd('finsi', 'si') ||
      this.peek().type === 'EOF';

    const thenBranch = this.parseStatementList(stopThen);
    const elseIfBranches: Array<{ condition: ExprNode; body: StmtNode[]; line: number }> = [];
    let elseBranch: StmtNode[] | null = null;

    while (this.isKw('sinonsi') || (this.isKw('sinon') && this.isKw('si', 1))) {
      const eiLine = this.peek().line;
      if (this.isKw('sinonsi')) {
        this.advance();
      } else {
        this.advance(); // Sinon
        this.advance(); // Si
      }
      const eiCond = this.parseExpression();
      this.expectKw('alors', 'Alors');
      this.skipNewlinesAndSemicolons();
      const eiBody = this.parseStatementList(stopThen);
      elseIfBranches.push({ condition: eiCond, body: eiBody, line: eiLine });
    }

    if (this.isKw('sinon')) {
      this.advance();
      this.skipNewlinesAndSemicolons();
      elseBranch = this.parseStatementList(
        () => this.isCompoundEnd('finsi', 'si') || this.peek().type === 'EOF'
      );
    }

    this.consumeCompoundEnd('finsi', 'si', 'FinSi');

    return {
      kind: 'if',
      condition,
      thenBranch,
      elseIfBranches,
      elseBranch,
      line: tok.line,
    };
  }

  private looksLikeSwitchCaseLabel(): boolean {
    if (
      this.isKw('sinon') ||
      this.isKw('autre') ||
      this.isKw('defaut') ||
      this.isCompoundEnd('finselon', 'selon')
    ) {
      return true;
    }

    // Cannot start a case label with a statement keyword
    if (
      this.isKw('ecrire') ||
      this.isKw('ecrireln') ||
      this.isKw('lire') ||
      this.isKw('si') ||
      this.isKw('pour') ||
      this.isKw('tantque') ||
      this.isKw('tant') ||
      this.isKw('repeter') ||
      this.isKw('selon') ||
      this.isKw('retourner') ||
      this.isKw('retourne')
    ) {
      return false;
    }

    let depth = 0;
    for (let offset = 0; offset < 64; offset++) {
      const t = this.peek(offset);
      if (t.type === 'EOF' || t.type === 'NEWLINE' || t.type === 'SEMICOLON' || t.type === 'ASSIGN') {
        return false;
      }
      if (t.type === 'LPAREN' || t.type === 'LBRACKET') depth++;
      else if (t.type === 'RPAREN' || t.type === 'RBRACKET') depth = Math.max(0, depth - 1);
      else if (t.type === 'COLON' && depth === 0) {
        return true;
      }
    }
    return false;
  }

  private parseSwitchStmt(): StmtNode {
    const tok = this.advance(); // Selon
    const expr = this.parseExpression();
    if (this.isKw('faire')) {
      this.advance();
    }
    this.skipNewlinesAndSemicolons();

    const cases: Array<{ values: Array<{ from: ExprNode; to?: ExprNode }>; body: StmtNode[]; line: number }> = [];
    let defaultBranch: StmtNode[] | null = null;

    while (this.peek().type !== 'EOF' && !this.isCompoundEnd('finselon', 'selon')) {
      this.skipNewlinesAndSemicolons();
      if (this.isCompoundEnd('finselon', 'selon') || this.peek().type === 'EOF') break;

      if (this.isKw('sinon') || this.isKw('autre') || this.isKw('defaut')) {
        this.advance();
        if (this.peek().type === 'COLON') this.advance();
        this.skipNewlinesAndSemicolons();
        defaultBranch = this.parseStatementList(
          () => this.isCompoundEnd('finselon', 'selon') || this.peek().type === 'EOF'
        );
        break;
      }

      const caseLine = this.peek().line;
      const values: Array<{ from: ExprNode; to?: ExprNode }> = [];
      while (true) {
        const from = this.parseExpression();
        if (this.peek().type === 'DOTDOT') {
          this.advance();
          const to = this.parseExpression();
          values.push({ from, to });
        } else {
          values.push({ from });
        }
        if (this.peek().type === 'COMMA') {
          this.advance();
          continue;
        }
        break;
      }

      this.expectToken('COLON', ':', 'Chaque cas de Selon doit se terminer par « : ».');
      this.skipNewlinesAndSemicolons();

      const body = this.parseStatementList(() => this.looksLikeSwitchCaseLabel());
      cases.push({ values, body, line: caseLine });
    }

    this.consumeCompoundEnd('finselon', 'selon', 'FinSelon');

    return {
      kind: 'switch',
      expr,
      cases,
      defaultBranch,
      line: tok.line,
    };
  }

  private parseForStmt(): StmtNode {
    const tok = this.advance(); // Pour
    const varTok = this.expectIdent('variable de boucle');

    if (this.isKw('de')) {
      this.advance();
    } else if (this.peek().type === 'ASSIGN') {
      this.advance();
    } else {
      throw new AlgoError(
        `Mot-clé « De » (ou « ← ») attendu dans la boucle Pour.`,
        this.peek().line,
        'parse',
        this.peek().col,
        `Exemple : Pour ${varTok.raw} De 1 A N Faire`
      );
    }

    const start = this.parseExpression();
    this.expectKw('a', 'A', `Exemple : Pour ${varTok.raw} De 1 A N Faire`);
    const end = this.parseExpression();

    let step: ExprNode | null = null;
    if (this.isKw('pas')) {
      this.advance();
      if (this.peek().type === 'EQ' || this.peek().type === 'ASSIGN') {
        this.advance();
      }
      step = this.parseExpression();
    }

    this.expectKw('faire', 'Faire', `Ajoutez « Faire » à la fin de l'en-tête Pour.`);
    this.skipNewlinesAndSemicolons();

    const body = this.parseStatementList(
      () => this.isCompoundEnd('finpour', 'pour') || this.peek().type === 'EOF'
    );
    this.consumeCompoundEnd('finpour', 'pour', 'FinPour');

    return {
      kind: 'for',
      variable: varTok.raw,
      start,
      end,
      step,
      body,
      line: tok.line,
    };
  }

  private parseWhileStmt(): StmtNode {
    const tok = this.advance();
    if (tok.value === 'tant') {
      this.expectKw('que', 'Que');
    }
    const condition = this.parseExpression();
    this.expectKw('faire', 'Faire', 'La condition de TantQue doit être suivie de Faire.');
    this.skipNewlinesAndSemicolons();

    const body = this.parseStatementList(
      () =>
        this.isCompoundEnd('fintantque', 'tantque') ||
        this.isCompoundEnd('fintantque', 'tant', 'que') ||
        this.peek().type === 'EOF'
    );

    if (this.isCompoundEnd('fintantque', 'tant', 'que')) {
      this.consumeCompoundEnd('fintantque', 'tant', 'FinTantQue', 'que');
    } else {
      this.consumeCompoundEnd('fintantque', 'tantque', 'FinTantQue');
    }

    return { kind: 'while', condition, body, line: tok.line };
  }

  private parseRepeatStmt(): StmtNode {
    const tok = this.advance(); // Répéter
    this.skipNewlinesAndSemicolons();

    const isUntil = () =>
      this.isKw('jusqua') ||
      (this.isKw('jusqu') && this.isKw('a', 1));

    const body = this.parseStatementList(() => isUntil() || this.peek().type === 'EOF');

    if (this.isKw('jusqua')) {
      this.advance();
    } else if (this.isKw('jusqu') && this.isKw('a', 1)) {
      this.advance();
      this.advance();
    } else {
      throw new AlgoError(
        `Mot-clé « Jusqu'à » manquant pour terminer la boucle Répéter.`,
        this.peek().line,
        'parse',
        this.peek().col
      );
    }

    const condition = this.parseExpression();
    return { kind: 'repeat', body, condition, line: tok.line };
  }

  private parseReturnStmt(): StmtNode {
    const tok = this.advance();
    if (
      this.peek().type === 'NEWLINE' ||
      this.peek().type === 'SEMICOLON' ||
      this.peek().type === 'EOF' ||
      this.isCompoundEnd('finsi', 'si') ||
      this.isCompoundEnd('finfonction', 'fonction') ||
      this.isCompoundEnd('finprocedure', 'procedure')
    ) {
      return { kind: 'return', value: null, line: tok.line };
    }
    const value = this.parseExpression();
    return { kind: 'return', value, line: tok.line };
  }

  // Expressions (precedence climbing / recursive descent)
  private parseExpression(): ExprNode {
    return this.parseOr();
  }

  private parseOr(): ExprNode {
    let left = this.parseAnd();
    while (this.isKw('ou')) {
      const op = this.advance();
      const right = this.parseAnd();
      left = { kind: 'binary', op: 'OU', left, right, line: op.line };
    }
    return left;
  }

  private parseAnd(): ExprNode {
    let left = this.parseNot();
    while (this.isKw('et')) {
      const op = this.advance();
      const right = this.parseNot();
      left = { kind: 'binary', op: 'ET', left, right, line: op.line };
    }
    return left;
  }

  private parseNot(): ExprNode {
    if (this.isKw('non')) {
      const op = this.advance();
      const operand = this.parseNot();
      return { kind: 'unary', op: 'NON', operand, line: op.line };
    }
    return this.parseComparison();
  }

  private parseComparison(): ExprNode {
    let left = this.parseAdditive();
    while (true) {
      const t = this.peek();
      let op: '=' | '≠' | '<' | '≤' | '>' | '≥' | null = null;
      if (t.type === 'EQ') op = '=';
      else if (t.type === 'NEQ') op = '≠';
      else if (t.type === 'LT') op = '<';
      else if (t.type === 'LTE') op = '≤';
      else if (t.type === 'GT') op = '>';
      else if (t.type === 'GTE') op = '≥';
      if (!op) break;
      this.advance();
      const right = this.parseAdditive();
      left = { kind: 'binary', op, left, right, line: t.line };
    }
    return left;
  }

  private parseAdditive(): ExprNode {
    let left = this.parseMultiplicative();
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const opTok = this.advance();
      const right = this.parseMultiplicative();
      left = {
        kind: 'binary',
        op: opTok.type === 'PLUS' ? '+' : '-',
        left,
        right,
        line: opTok.line,
      };
    }
    return left;
  }

  private parseMultiplicative(): ExprNode {
    let left = this.parsePower();
    while (true) {
      const t = this.peek();
      let op: '*' | '/' | 'DIV' | 'MOD' | null = null;
      if (t.type === 'STAR') op = '*';
      else if (t.type === 'SLASH') op = '/';
      else if (this.isKw('div')) op = 'DIV';
      else if (this.isKw('mod')) op = 'MOD';
      if (!op) break;
      this.advance();
      const right = this.parsePower();
      left = { kind: 'binary', op, left, right, line: t.line };
    }
    return left;
  }

  private parsePower(): ExprNode {
    const left = this.parseUnary();
    if (this.peek().type === 'CARET') {
      const opTok = this.advance();
      const right = this.parsePower(); // right-associative
      return { kind: 'binary', op: '^', left, right, line: opTok.line };
    }
    return left;
  }

  private parseUnary(): ExprNode {
    if (this.peek().type === 'MINUS') {
      const op = this.advance();
      return { kind: 'unary', op: '-', operand: this.parseUnary(), line: op.line };
    }
    if (this.peek().type === 'PLUS') {
      const op = this.advance();
      return { kind: 'unary', op: '+', operand: this.parseUnary(), line: op.line };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): ExprNode {
    let expr = this.parsePrimary();
    while (true) {
      if (this.peek().type === 'LBRACKET') {
        const lb = this.advance();
        const indices: ExprNode[] = [this.parseExpression()];
        while (this.peek().type === 'COMMA') {
          this.advance();
          indices.push(this.parseExpression());
        }
        this.expectToken('RBRACKET', ']');
        expr = { kind: 'index', target: expr, indices, line: lb.line };
      } else if (this.peek().type === 'DOT') {
        this.advance();
        const field = this.expectIdent('nom de champ');
        expr = { kind: 'field', target: expr, field: field.raw, line: field.line };
      } else {
        break;
      }
    }
    return expr;
  }

  private parsePrimary(): ExprNode {
    const t = this.peek();

    if (t.type === 'NUMBER') {
      this.advance();
      const isReal = t.value.includes('.');
      return { kind: 'number', value: Number(t.value), isReal, line: t.line };
    }

    if (t.type === 'STRING') {
      this.advance();
      return { kind: 'string', value: t.value, line: t.line };
    }

    if (t.type === 'CHAR') {
      this.advance();
      return { kind: 'char', value: t.value, line: t.line };
    }

    if (this.isKw('vrai')) {
      this.advance();
      return { kind: 'boolean', value: true, line: t.line };
    }

    if (this.isKw('faux')) {
      this.advance();
      return { kind: 'boolean', value: false, line: t.line };
    }

    if (t.type === 'LPAREN') {
      this.advance();
      const inner = this.parseExpression();
      this.expectToken('RPAREN', ')');
      return inner;
    }

    if (this.isIdentLike()) {
      const ident = this.advance();
      if (this.peek().type === 'LPAREN') {
        this.advance(); // (
        const args: ExprNode[] = [];
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseExpression());
          while (this.peek().type === 'COMMA') {
            this.advance();
            args.push(this.parseExpression());
          }
        }
        this.expectToken('RPAREN', ')');
        return { kind: 'call', name: ident.raw, args, line: ident.line };
      }
      return { kind: 'var', name: ident.raw, line: ident.line };
    }

    throw new AlgoError(
      `Expression attendue, mais « ${t.raw || 'fin de ligne'} » trouvé.`,
      t.line,
      'parse',
      t.col,
      'Vérifiez les opérateurs, parenthèses ou valeurs sur cette ligne.'
    );
  }
}

export function parse(tokens: Token[]): ProgramNode {
  return new Parser(tokens).parseProgram();
}
