import { normalizeWord } from './lexer';
import {
  AlgoArray,
  AlgoError,
  AlgoRecord,
  ExecutionCallbacks,
  ExecutionResult,
  ExprNode,
  LValue,
  ProgramNode,
  RuntimeValue,
  StmtNode,
  SubprogramDecl,
  TraceEntry,
  TypeSpec,
  VariableSnapshot,
} from './types';

interface Cell {
  displayName: string;
  typeSpec: TypeSpec | null;
  typeDisplay: string;
  isConstant: boolean;
  modified: boolean;
  get: () => RuntimeValue;
  set: (v: RuntimeValue) => void;
}

class Scope {
  public name: string;
  public parent: Scope | null;
  public cells = new Map<string, Cell>();

  constructor(name: string, parent: Scope | null = null) {
    this.name = name;
    this.parent = parent;
  }

  public define(
    name: string,
    initialValue: RuntimeValue,
    typeSpec: TypeSpec | null,
    isConstant = false
  ): Cell {
    let val = initialValue;
    const key = normalizeWord(name);
    const cell: Cell = {
      displayName: name,
      typeSpec,
      typeDisplay: typeSpec ? typeSpec.display : inferTypeDisplay(initialValue),
      isConstant,
      modified: false,
      get: () => val,
      set: (v: RuntimeValue) => {
        val = v;
        cell.modified = true;
      },
    };
    this.cells.set(key, cell);
    return cell;
  }

  public defineRef(name: string, refCell: Cell, typeSpec: TypeSpec | null): void {
    const key = normalizeWord(name);
    this.cells.set(key, {
      displayName: name,
      typeSpec: typeSpec ?? refCell.typeSpec,
      typeDisplay: typeSpec ? typeSpec.display : refCell.typeDisplay,
      isConstant: false,
      modified: false,
      get: () => refCell.get(),
      set: (v: RuntimeValue) => {
        refCell.set(v);
      },
    });
  }

  public resolve(name: string): Cell | undefined {
    const key = normalizeWord(name);
    if (this.cells.has(key)) return this.cells.get(key);
    return this.parent?.resolve(name);
  }

  /**
   * Resolves a variable for assignment/write/loop-counter (Bac Tunisien convention without Variables block):
   * - If already defined in this scope (local var or @ref param), return it.
   * - If inside a subprogram, check if it's a global constant (to guard against mutation);
   *   otherwise create a LOCAL variable in this scope so subprograms never clobber caller's `i`, `j`, `tmp`, etc.
   */
  public resolveLocalOrCreate(name: string, initialValue: RuntimeValue = 0): Cell {
    const key = normalizeWord(name);
    if (this.cells.has(key)) {
      return this.cells.get(key)!;
    }
    if (this.parent) {
      const parentCell = this.parent.resolve(name);
      if (parentCell && parentCell.isConstant) {
        return parentCell;
      }
    }
    return this.define(name, initialValue, null, false);
  }
}

class ReturnSignal {
  public value: RuntimeValue | undefined;
  constructor(value: RuntimeValue | undefined) {
    this.value = value;
  }
}

class AbortExecutionError extends Error {
  constructor() {
    super('Exécution interrompue par l’utilisateur.');
    this.name = 'AbortExecutionError';
  }
}

export function isAlgoArray(v: RuntimeValue): v is AlgoArray {
  return typeof v === 'object' && v !== null && v.__kind === 'array';
}

export function isAlgoRecord(v: RuntimeValue): v is AlgoRecord {
  return typeof v === 'object' && v !== null && v.__kind === 'record';
}

function inferTypeDisplay(v: RuntimeValue): string {
  if (typeof v === 'boolean') return 'Booléen';
  if (typeof v === 'number') return Number.isInteger(v) ? 'Entier' : 'Réel';
  if (typeof v === 'string') return v.length === 1 ? 'Caractère' : 'Chaîne';
  if (isAlgoArray(v)) {
    if (v.elementType) return `Tableau de ${v.elementType}`;
    const firstVal = v.data.values().next().value;
    if (firstVal !== undefined) return `Tableau de ${inferTypeDisplay(firstVal)}`;
    return 'Tableau';
  }
  if (isAlgoRecord(v)) return v.typeName;
  return 'Inconnu';
}

export function formatRuntimeOutput(v: RuntimeValue): string {
  if (typeof v === 'boolean') return v ? 'Vrai' : 'Faux';
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v);
    return String(Number(v.toPrecision(12)));
  }
  if (typeof v === 'string') return v;
  if (isAlgoArray(v)) {
    const entries = Array.from(v.data.entries()).sort((a, b) => a[0] - b[0]);
    return '[' + entries.map(([, val]) => formatRuntimeOutput(val)).join(', ') + ']';
  }
  if (isAlgoRecord(v)) {
    const parts = Array.from(v.fields.values()).map(
      (f) => `${f.displayName}: ${formatInspectorValue(f.value)}`
    );
    return `{ ${parts.join(', ')} }`;
  }
  return String(v);
}

export function formatInspectorValue(v: RuntimeValue): string {
  if (typeof v === 'boolean') return v ? 'Vrai' : 'Faux';
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v);
    return String(Number(v.toPrecision(12)));
  }
  if (typeof v === 'string') return `"${v}"`;
  if (isAlgoArray(v)) {
    const entries = Array.from(v.data.entries()).sort((a, b) => a[0] - b[0]);
    if (entries.length === 0) return '[ ] (vide)';
    return '[' + entries.map(([, val]) => formatInspectorValue(val)).join(', ') + ']';
  }
  if (isAlgoRecord(v)) {
    const parts = Array.from(v.fields.values()).map(
      (f) => `${f.displayName}: ${formatInspectorValue(f.value)}`
    );
    return `{ ${parts.join(', ')} }`;
  }
  return String(v);
}

function cloneValue(v: RuntimeValue): RuntimeValue {
  if (isAlgoArray(v)) {
    const copy = new Map<number, RuntimeValue>();
    for (const [k, val] of v.data.entries()) {
      copy.set(k, cloneValue(val));
    }
    return {
      __kind: 'array',
      low: v.low,
      high: v.high,
      elementType: v.elementType,
      elementTypeSpec: v.elementTypeSpec,
      data: copy,
    };
  }
  if (isAlgoRecord(v)) {
    const fields = new Map<string, { displayName: string; value: RuntimeValue; typeDisplay: string }>();
    for (const [k, f] of v.fields.entries()) {
      fields.set(k, {
        displayName: f.displayName,
        value: cloneValue(f.value),
        typeDisplay: f.typeDisplay,
      });
    }
    return {
      __kind: 'record',
      typeName: v.typeName,
      fields,
    };
  }
  return v;
}

const MAX_CALL_DEPTH = 400;
const MAX_TRACE_ENTRIES = 250;

export class Interpreter {
  private program: ProgramNode;
  private callbacks: ExecutionCallbacks;
  private globalScope: Scope;
  private subprograms = new Map<string, SubprogramDecl>();
  private typeRegistry = new Map<string, TypeSpec>();
  private steps = 0;
  private maxSteps: number;
  private callDepth = 0;
  private trace: TraceEntry[] = [];
  private lastYieldTime = 0;

  constructor(program: ProgramNode, callbacks: ExecutionCallbacks) {
    this.program = program;
    this.callbacks = callbacks;
    this.globalScope = new Scope(program.name || 'Principal', null);
    this.maxSteps = callbacks.maxSteps ?? 250_000;
    this.lastYieldTime = performance.now();

    for (const sp of program.subprograms) {
      this.subprograms.set(normalizeWord(sp.name), sp);
    }
  }

  public async run(): Promise<ExecutionResult> {
    const start = performance.now();
    try {
      // Register global types
      for (const td of this.program.types) {
        this.typeRegistry.set(normalizeWord(td.name), td.spec);
      }

      // Initialize global constants
      for (const cd of this.program.constants) {
        const val = await this.evalExpr(cd.value, this.globalScope);
        this.globalScope.define(cd.name, val, cd.type ?? null, true);
      }

      // Initialize global variables
      for (const vd of this.program.variables) {
        const resolvedSpec = this.resolveTypeSpec(vd.type);
        const initVal = vd.initialValue
          ? await this.evalExpr(vd.initialValue, this.globalScope)
          : await this.defaultValueForType(resolvedSpec, this.globalScope);
        this.globalScope.define(vd.name, initVal, resolvedSpec, false);
      }

      this.emitVariables();

      // Execute main body
      await this.execBlock(this.program.body, this.globalScope);

      const variables = this.captureVariables();
      this.callbacks.onVariablesUpdate?.(variables);

      return {
        success: true,
        variables,
        trace: this.trace,
        stepsExecuted: this.steps,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      const variables = this.captureVariables();
      this.callbacks.onVariablesUpdate?.(variables);

      if (err instanceof AbortExecutionError) {
        return {
          success: false,
          aborted: true,
          variables,
          trace: this.trace,
          stepsExecuted: this.steps,
          durationMs: Math.round(performance.now() - start),
        };
      }

      if (err instanceof AlgoError) {
        return {
          success: false,
          variables,
          trace: this.trace,
          stepsExecuted: this.steps,
          durationMs: Math.round(performance.now() - start),
          error: {
            message: err.message,
            line: err.line,
            col: err.col,
            phase: err.phase,
            hint: err.hint,
          },
        };
      }

      return {
        success: false,
        variables,
        trace: this.trace,
        stepsExecuted: this.steps,
        durationMs: Math.round(performance.now() - start),
        error: {
          message: err instanceof Error ? err.message : String(err),
          line: 1,
          col: 1,
          phase: 'runtime',
        },
      };
    }
  }

  private async tick(line: number): Promise<void> {
    if (this.callbacks.signal?.aborted) {
      throw new AbortExecutionError();
    }
    this.steps++;
    if (this.steps > this.maxSteps) {
      throw new AlgoError(
        `Limite d'exécution dépassée (${this.maxSteps.toLocaleString('fr-FR')} opérations) : boucle infinie probable.`,
        line,
        'runtime',
        1,
        'Vérifiez la condition d’arrêt de votre boucle TantQue, Répéter ou Pour.'
      );
    }
    if (this.steps % 2000 === 0 && performance.now() - this.lastYieldTime > 16) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      this.lastYieldTime = performance.now();
      if (this.callbacks.signal?.aborted) {
        throw new AbortExecutionError();
      }
    }
  }

  private pushTrace(
    line: number,
    scope: string,
    action: TraceEntry['action'],
    target: string,
    value: string
  ): void {
    if (this.trace.length < MAX_TRACE_ENTRIES) {
      this.trace.push({
        step: this.trace.length + 1,
        line,
        scope,
        action,
        target,
        value,
      });
    }
  }

  private emitVariables(): void {
    if (this.callbacks.onVariablesUpdate) {
      this.callbacks.onVariablesUpdate(this.captureVariables());
    }
  }

  public captureVariables(): VariableSnapshot[] {
    const snapshots: VariableSnapshot[] = [];
    for (const cell of this.globalScope.cells.values()) {
      const val = cell.get();
      const arr = isAlgoArray(val);
      const rec = isAlgoRecord(val);
      let arrayEntries: Array<{ index: string; value: string }> | undefined;
      if (arr) {
        arrayEntries = Array.from(val.data.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([idx, v]) => ({
            index: String(idx),
            value: formatInspectorValue(v),
          }));
      }
      snapshots.push({
        name: cell.displayName,
        type: cell.typeSpec ? cell.typeDisplay : inferTypeDisplay(val),
        value: formatInspectorValue(val),
        isConstant: cell.isConstant,
        isArray: arr,
        isRecord: rec,
        arrayEntries,
        modified: cell.modified,
      });
    }
    return snapshots;
  }

  private resolveTypeSpec(spec: TypeSpec): TypeSpec {
    if (spec.kind === 'named') {
      const found = this.typeRegistry.get(normalizeWord(spec.name));
      if (found) return found;
    }
    return spec;
  }

  private async defaultValueForType(spec: TypeSpec, scope: Scope): Promise<RuntimeValue> {
    const resolved = this.resolveTypeSpec(spec);
    switch (resolved.kind) {
      case 'primitive':
        if (resolved.name === 'entier' || resolved.name === 'reel') return 0;
        if (resolved.name === 'chaine' || resolved.name === 'caractere') return '';
        if (resolved.name === 'booleen') return false;
        return 0;
      case 'array': {
        const firstDim = resolved.dimensions[0];
        const low = Math.trunc(this.expectNumber(await this.evalExpr(firstDim.low, scope), firstDim.low.line));
        const high = Math.trunc(this.expectNumber(await this.evalExpr(firstDim.high, scope), firstDim.high.line));
        const elemSpec =
          resolved.dimensions.length > 1
            ? ({
                kind: 'array',
                dimensions: resolved.dimensions.slice(1),
                elementType: resolved.elementType,
                display: `Tableau de ${resolved.elementType.display}`,
              } as TypeSpec)
            : this.resolveTypeSpec(resolved.elementType);
        return {
          __kind: 'array',
          low,
          high,
          elementType: resolved.elementType.display,
          elementTypeSpec: elemSpec,
          data: new Map<number, RuntimeValue>(),
        };
      }
      case 'array_unsized':
        return {
          __kind: 'array',
          elementType: resolved.elementType?.display,
          elementTypeSpec: resolved.elementType ? this.resolveTypeSpec(resolved.elementType) : undefined,
          data: new Map<number, RuntimeValue>(),
        };
      case 'record': {
        const fields = new Map<string, { displayName: string; value: RuntimeValue; typeDisplay: string }>();
        for (const f of resolved.fields) {
          const defVal = await this.defaultValueForType(f.type, scope);
          fields.set(normalizeWord(f.name), {
            displayName: f.name,
            value: defVal,
            typeDisplay: f.type.display,
          });
        }
        return {
          __kind: 'record',
          typeName: resolved.display,
          fields,
        };
      }
      case 'named':
        return 0;
    }
  }

  private async execBlock(stmts: StmtNode[], scope: Scope): Promise<void> {
    for (const stmt of stmts) {
      await this.execStmt(stmt, scope);
    }
  }

  private async execStmt(stmt: StmtNode, scope: Scope): Promise<void> {
    await this.tick(stmt.line);

    switch (stmt.kind) {
      case 'assign': {
        const val = await this.evalExpr(stmt.value, scope);
        await this.assignLValue(stmt.target, val, scope);
        this.pushTrace(
          stmt.line,
          scope.name,
          'assign',
          this.formatLValueLabel(stmt.target),
          formatInspectorValue(val)
        );
        return;
      }

      case 'write': {
        const parts: string[] = [];
        for (const arg of stmt.args) {
          const val = await this.evalExpr(arg, scope);
          parts.push(formatRuntimeOutput(val));
        }
        const text = parts.join('');
        this.callbacks.onWrite(text, stmt.line);
        this.pushTrace(stmt.line, scope.name, 'write', 'Console', text);
        return;
      }

      case 'read': {
        for (const target of stmt.targets) {
          const label = this.formatLValueLabel(target);
          const typeHint = this.getLValueTypeHint(target, scope);
          this.emitVariables();
          const rawInput = await this.callbacks.onRead(label, typeHint, stmt.line);
          if (this.callbacks.signal?.aborted) {
            throw new AbortExecutionError();
          }
          const parsedVal = this.parseInputValue(rawInput, typeHint, target.line, label);
          await this.assignLValue(target, parsedVal, scope);
          this.pushTrace(stmt.line, scope.name, 'read', label, formatInspectorValue(parsedVal));
          this.emitVariables();
        }
        return;
      }

      case 'if': {
        const cond = this.expectBoolean(await this.evalExpr(stmt.condition, scope), stmt.line);
        if (cond) {
          await this.execBlock(stmt.thenBranch, scope);
          return;
        }
        for (const ei of stmt.elseIfBranches) {
          const eiCond = this.expectBoolean(await this.evalExpr(ei.condition, scope), ei.line);
          if (eiCond) {
            await this.execBlock(ei.body, scope);
            return;
          }
        }
        if (stmt.elseBranch) {
          await this.execBlock(stmt.elseBranch, scope);
        }
        return;
      }

      case 'switch': {
        const targetVal = await this.evalExpr(stmt.expr, scope);
        for (const c of stmt.cases) {
          let matched = false;
          for (const v of c.values) {
            const fromVal = await this.evalExpr(v.from, scope);
            if (v.to) {
              const toVal = await this.evalExpr(v.to, scope);
              if (
                typeof targetVal === 'number' &&
                typeof fromVal === 'number' &&
                typeof toVal === 'number' &&
                targetVal >= fromVal &&
                targetVal <= toVal
              ) {
                matched = true;
                break;
              }
              if (
                typeof targetVal === 'string' &&
                typeof fromVal === 'string' &&
                typeof toVal === 'string' &&
                targetVal >= fromVal &&
                targetVal <= toVal
              ) {
                matched = true;
                break;
              }
            } else if (this.valuesEqual(targetVal, fromVal)) {
              matched = true;
              break;
            }
          }
          if (matched) {
            await this.execBlock(c.body, scope);
            return;
          }
        }
        if (stmt.defaultBranch) {
          await this.execBlock(stmt.defaultBranch, scope);
        }
        return;
      }

      case 'for': {
        const startVal = Math.trunc(
          this.expectNumber(await this.evalExpr(stmt.start, scope), stmt.line)
        );
        const endVal = Math.trunc(
          this.expectNumber(await this.evalExpr(stmt.end, scope), stmt.line)
        );
        const stepVal = stmt.step
          ? Math.trunc(this.expectNumber(await this.evalExpr(stmt.step, scope), stmt.line))
          : 1;

        if (stepVal === 0) {
          throw new AlgoError(
            'Le pas d’une boucle Pour ne peut pas être égal à 0.',
            stmt.line,
            'runtime'
          );
        }

        const cell = scope.resolveLocalOrCreate(stmt.variable, startVal);
        if (cell.isConstant) {
          throw new AlgoError(
            `Impossible d'utiliser la constante « ${cell.displayName} » comme compteur de boucle.`,
            stmt.line,
            'runtime'
          );
        }
        cell.typeDisplay = 'Entier';

        for (
          let idx = startVal;
          stepVal > 0 ? idx <= endVal : idx >= endVal;
          idx += stepVal
        ) {
          await this.tick(stmt.line);
          cell.set(idx);
          await this.execBlock(stmt.body, scope);
        }
        return;
      }

      case 'while': {
        while (this.expectBoolean(await this.evalExpr(stmt.condition, scope), stmt.line)) {
          await this.tick(stmt.line);
          await this.execBlock(stmt.body, scope);
        }
        return;
      }

      case 'repeat': {
        do {
          await this.tick(stmt.line);
          await this.execBlock(stmt.body, scope);
        } while (!this.expectBoolean(await this.evalExpr(stmt.condition, scope), stmt.line));
        return;
      }

      case 'call': {
        await this.execProcedureOrBuiltinCall(stmt.name, stmt.args, scope, stmt.line);
        return;
      }

      case 'return': {
        const val = stmt.value ? await this.evalExpr(stmt.value, scope) : undefined;
        this.pushTrace(
          stmt.line,
          scope.name,
          'return',
          scope.name,
          val !== undefined ? formatInspectorValue(val) : '∅'
        );
        throw new ReturnSignal(val);
      }
    }
  }

  private getLValueTypeHint(lv: LValue, scope: Scope): string {
    if (lv.kind === 'var') {
      const cell = scope.resolve(lv.name);
      return cell?.typeDisplay ?? 'Auto';
    }
    if (lv.kind === 'index') {
      const base = this.getLValueTypeHint(lv.target, scope);
      const match = base.match(/Tableau de (.+)/i);
      if (match) return match[1];
      return 'Auto';
    }
    if (lv.kind === 'field') {
      const cell = this.resolveRootVarCell(lv.target, scope);
      if (cell) {
        const val = cell.get();
        if (isAlgoRecord(val)) {
          const f = val.fields.get(normalizeWord(lv.field));
          if (f) return f.typeDisplay;
        }
      }
    }
    return 'Auto';
  }

  private resolveRootVarCell(lv: LValue, scope: Scope): Cell | undefined {
    if (lv.kind === 'var') return scope.resolve(lv.name);
    return this.resolveRootVarCell(lv.target, scope);
  }

  private parseInputValue(raw: string, typeHint: string, line: number, label: string): RuntimeValue {
    const trimmed = raw.trim();
    const normHint = normalizeWord(typeHint);

    if (normHint === 'entier') {
      if (!/^[+-]?\d+$/.test(trimmed)) {
        throw new AlgoError(
          `Valeur entière invalide « ${raw} » pour la variable « ${label} ».`,
          line,
          'runtime',
          1,
          'Saisissez un nombre entier (ex: 42, -5, 0).'
        );
      }
      return parseInt(trimmed, 10);
    }

    if (normHint === 'reel') {
      const normalized = trimmed.replace(',', '.');
      const num = Number(normalized);
      if (trimmed === '' || Number.isNaN(num)) {
        throw new AlgoError(
          `Valeur réelle invalide « ${raw} » pour la variable « ${label} ».`,
          line,
          'runtime',
          1,
          'Saisissez un nombre décimal (ex: 14.5 ou -3.14).'
        );
      }
      return num;
    }

    if (normHint === 'booleen') {
      const low = normalizeWord(trimmed);
      if (low === 'vrai' || low === 'true' || low === '1' || low === 'oui') return true;
      if (low === 'faux' || low === 'false' || low === '0' || low === 'non') return false;
      throw new AlgoError(
        `Valeur booléenne invalide « ${raw} » pour « ${label} ».`,
        line,
        'runtime',
        1,
        'Saisissez Vrai ou Faux.'
      );
    }

    if (normHint === 'caractere') {
      if (raw.length === 0) return '';
      return raw[0];
    }

    if (normHint === 'chaine') {
      return raw;
    }

    // Auto inference when undeclared or untyped array
    if (/^[+-]?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^[+-]?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
    const low = normalizeWord(trimmed);
    if (low === 'vrai') return true;
    if (low === 'faux') return false;
    return raw;
  }

  private formatLValueLabel(lv: LValue): string {
    if (lv.kind === 'var') return lv.name;
    if (lv.kind === 'index') return `${this.formatLValueLabel(lv.target)}[...]`;
    return `${this.formatLValueLabel(lv.target)}.${lv.field}`;
  }

  private async resolveLValueCell(lv: LValue, scope: Scope): Promise<Cell> {
    if (lv.kind === 'var') {
      return scope.resolveLocalOrCreate(lv.name, 0);
    }

    if (lv.kind === 'index') {
      const parentCell = await this.resolveLValueCell(lv.target, scope);
      const indices: number[] = [];
      for (const idxExpr of lv.indices) {
        const n = this.expectNumber(await this.evalExpr(idxExpr, scope), idxExpr.line);
        if (!Number.isInteger(n)) {
          throw new AlgoError(
            `L'indice d'un tableau doit être un entier (reçu : ${n}).`,
            idxExpr.line,
            'runtime'
          );
        }
        indices.push(n);
      }

      const parentVal = parentCell.get();

      // String character modification: ch[i] ← 'A'
      if (typeof parentVal === 'string') {
        if (indices.length !== 1) {
          throw new AlgoError('Une chaîne ne possède qu’un seul indice.', lv.line, 'runtime');
        }
        const pos = indices[0];
        return {
          displayName: `${parentCell.displayName}[${pos}]`,
          typeSpec: { kind: 'primitive', name: 'caractere', display: 'Caractère' },
          typeDisplay: 'Caractère',
          isConstant: false,
          modified: true,
          get: () => {
            const cur = parentCell.get();
            if (typeof cur !== 'string') return '';
            if (pos < 1 || pos > cur.length) {
              throw new AlgoError(
                `Indice de chaîne hors limites : ${pos} (la chaîne a une longueur de ${cur.length}).`,
                lv.line,
                'runtime'
              );
            }
            return cur[pos - 1];
          },
          set: (v: RuntimeValue) => {
            const cur = parentCell.get();
            if (typeof cur !== 'string') return;
            if (pos < 1 || pos > cur.length) {
              throw new AlgoError(
                `Indice de chaîne hors limites : ${pos} (longueur ${cur.length}).`,
                lv.line,
                'runtime'
              );
            }
            const replacement = formatRuntimeOutput(v);
            const ch = replacement.length > 0 ? replacement[0] : '';
            parentCell.set(cur.slice(0, pos - 1) + ch + cur.slice(pos));
          },
        };
      }

      // Ensure array exists
      let arr: AlgoArray;
      if (isAlgoArray(parentVal)) {
        arr = parentVal;
      } else {
        arr = { __kind: 'array', data: new Map() };
        parentCell.set(arr);
      }

      // Traverse dimensions (e.g. M[i, j])
      let currentArr = arr;
      for (let d = 0; d < indices.length - 1; d++) {
        const idx = indices[d];
        this.checkArrayBounds(currentArr, idx, lv.line, parentCell.displayName);
        let next = currentArr.data.get(idx);
        if (!next || !isAlgoArray(next)) {
          next = { __kind: 'array', elementType: currentArr.elementType, data: new Map() };
          currentArr.data.set(idx, next);
        }
        currentArr = next;
      }

      const finalIdx = indices[indices.length - 1];
      this.checkArrayBounds(currentArr, finalIdx, lv.line, parentCell.displayName);

      // Lazily instantiate nested records/arrays when accessed as an LValue (e.g., classe[1].nom ← "Ali")
      if (!currentArr.data.has(finalIdx) && currentArr.elementTypeSpec) {
        const resolvedElem = this.resolveTypeSpec(currentArr.elementTypeSpec);
        if (resolvedElem.kind === 'record' || resolvedElem.kind === 'array') {
          const defObj = await this.defaultValueForType(resolvedElem, scope);
          currentArr.data.set(finalIdx, defObj);
        }
      }

      return {
        displayName: `${parentCell.displayName}[${indices.join(', ')}]`,
        typeSpec: null,
        typeDisplay: currentArr.elementType ?? 'Auto',
        isConstant: false,
        modified: true,
        get: () => {
          if (currentArr.data.has(finalIdx)) {
            return currentArr.data.get(finalIdx)!;
          }
          return this.defaultForElementType(currentArr.elementType);
        },
        set: (v: RuntimeValue) => {
          currentArr.data.set(finalIdx, v);
          parentCell.modified = true;
        },
      };
    }

    // Record field (auto-creates record dynamically if undeclared in Bac Tunisien mode)
    const parentCell = await this.resolveLValueCell(lv.target, scope);
    let parentVal = parentCell.get();
    if (!isAlgoRecord(parentVal)) {
      if (!parentCell.typeSpec) {
        parentVal = {
          __kind: 'record',
          typeName: 'Enregistrement',
          fields: new Map(),
        };
        parentCell.set(parentVal);
        parentCell.typeDisplay = 'Enregistrement';
      } else {
        throw new AlgoError(
          `« ${parentCell.displayName} » n'est pas un enregistrement, impossible d'accéder au champ « .${lv.field} ».`,
          lv.line,
          'runtime'
        );
      }
    }
    const fKey = normalizeWord(lv.field);
    let fieldEntry = parentVal.fields.get(fKey);
    if (!fieldEntry) {
      if (!parentCell.typeSpec) {
        fieldEntry = { displayName: lv.field, value: 0, typeDisplay: 'Auto' };
        parentVal.fields.set(fKey, fieldEntry);
      } else {
        throw new AlgoError(
          `Le champ « ${lv.field} » n'existe pas dans l'enregistrement « ${parentVal.typeName} ».`,
          lv.line,
          'runtime'
        );
      }
    }

    return {
      displayName: `${parentCell.displayName}.${lv.field}`,
      typeSpec: null,
      typeDisplay: fieldEntry.typeDisplay,
      isConstant: false,
      modified: true,
      get: () => fieldEntry!.value,
      set: (v: RuntimeValue) => {
        fieldEntry!.value = v;
        if (fieldEntry!.typeDisplay === 'Auto') {
          fieldEntry!.typeDisplay = inferTypeDisplay(v);
        }
        parentCell.modified = true;
      },
    };
  }

  private checkArrayBounds(arr: AlgoArray, idx: number, line: number, name: string): void {
    if (arr.low !== undefined && arr.high !== undefined) {
      if (idx < arr.low || idx > arr.high) {
        throw new AlgoError(
          `Indice hors limites pour « ${name} » : ${idx} (bornes déclarées : ${arr.low}..${arr.high}).`,
          line,
          'runtime',
          1,
          `Vérifiez que votre indice reste compris entre ${arr.low} et ${arr.high}.`
        );
      }
    }
  }

  private defaultForElementType(elemType?: string): RuntimeValue {
    if (!elemType) return 0;
    const norm = normalizeWord(elemType);
    if (norm === 'chaine' || norm === 'caractere') return '';
    if (norm === 'booleen') return false;
    return 0;
  }

  private async assignLValue(lv: LValue, value: RuntimeValue, scope: Scope): Promise<void> {
    const cell = await this.resolveLValueCell(lv, scope);
    if (cell.isConstant) {
      throw new AlgoError(
        `Impossible de modifier la constante « ${cell.displayName} ».`,
        lv.line,
        'runtime'
      );
    }
    if (cell.typeSpec?.kind === 'primitive') {
      if (cell.typeSpec.name === 'entier' && typeof value === 'number' && !Number.isInteger(value)) {
        throw new AlgoError(
          `Type incompatible : impossible d'affecter le réel ${value} à l'entier « ${cell.displayName} ».`,
          lv.line,
          'runtime',
          1,
          'Utilisez la division entière DIV ou la fonction Arrondi() / Ent().'
        );
      }
    }
    cell.set(cloneValue(value));
    // Dynamically update inferred TDO type for undeclared Bac Tunisien variables
    if (!cell.typeSpec) {
      cell.typeDisplay = inferTypeDisplay(value);
    }
  }

  private exprToLValue(expr: ExprNode): LValue | null {
    if (expr.kind === 'var') return { kind: 'var', name: expr.name, line: expr.line };
    if (expr.kind === 'index') {
      const t = this.exprToLValue(expr.target);
      if (!t) return null;
      return { kind: 'index', target: t, indices: expr.indices, line: expr.line };
    }
    if (expr.kind === 'field') {
      const t = this.exprToLValue(expr.target);
      if (!t) return null;
      return { kind: 'field', target: t, field: expr.field, line: expr.line };
    }
    return null;
  }

  private async execProcedureOrBuiltinCall(
    name: string,
    args: ExprNode[],
    scope: Scope,
    line: number
  ): Promise<void> {
    const norm = normalizeWord(name);

    // Built-in mutating procedures (Tunisian Bac conventions!)
    if (norm === 'convch' && args.length === 2) {
      const numVal = await this.evalExpr(args[0], scope);
      const target = this.exprToLValue(args[1]);
      if (!target) {
        throw new AlgoError(
          'Le 2e argument de ConvCh(x, ch) doit être une variable chaîne.',
          line,
          'runtime'
        );
      }
      await this.assignLValue(target, formatRuntimeOutput(numVal), scope);
      return;
    }

    if (norm === 'valeur' && args.length === 3) {
      const strVal = this.expectString(await this.evalExpr(args[0], scope), line);
      const targetVal = this.exprToLValue(args[1]);
      const targetErr = this.exprToLValue(args[2]);
      if (!targetVal || !targetErr) {
        throw new AlgoError(
          'Les arguments 2 et 3 de Valeur(ch, x, err) doivent être des variables.',
          line,
          'runtime'
        );
      }
      const trimmed = strVal.trim().replace(',', '.');
      const parsed = Number(trimmed);
      if (trimmed === '' || Number.isNaN(parsed)) {
        await this.assignLValue(targetVal, 0, scope);
        await this.assignLValue(targetErr, 1, scope);
      } else {
        await this.assignLValue(targetVal, parsed, scope);
        await this.assignLValue(targetErr, 0, scope);
      }
      return;
    }

    if (norm === 'efface' && args.length === 3) {
      const target = this.exprToLValue(args[0]);
      const strVal = this.expectString(await this.evalExpr(args[0], scope), line);
      const pos = Math.trunc(this.expectNumber(await this.evalExpr(args[1], scope), line));
      const count = Math.trunc(this.expectNumber(await this.evalExpr(args[2], scope), line));
      const res = this.doEfface(strVal, pos, count);
      if (target) {
        await this.assignLValue(target, res, scope);
      }
      return;
    }

    if ((norm === 'insere' || norm === 'inserer') && args.length === 3) {
      const sub = this.expectString(await this.evalExpr(args[0], scope), line);
      const target = this.exprToLValue(args[1]);
      const dest = this.expectString(await this.evalExpr(args[1], scope), line);
      const pos = Math.trunc(this.expectNumber(await this.evalExpr(args[2], scope), line));
      const res = this.doInsere(sub, dest, pos);
      if (target) {
        await this.assignLValue(target, res, scope);
      }
      return;
    }

    // User-defined procedure or function called as statement
    const sp = this.subprograms.get(norm);
    if (!sp) {
      // Fallback: built-in Afficher(...) alias for Ecrire(...) when user hasn't declared Procédure Afficher
      if (norm === 'afficher') {
        const parts: string[] = [];
        for (const arg of args) {
          parts.push(formatRuntimeOutput(await this.evalExpr(arg, scope)));
        }
        const text = parts.join('');
        this.callbacks.onWrite(text, line);
        this.pushTrace(line, scope.name, 'write', 'Console', text);
        return;
      }

      throw new AlgoError(
        `Procédure « ${name} » introuvable.`,
        line,
        'runtime',
        1,
        'Vérifiez l’orthographe du nom ou que la procédure est bien déclarée.'
      );
    }

    await this.invokeSubprogram(sp, args, scope, line);
  }

  private async invokeSubprogram(
    sp: SubprogramDecl,
    args: ExprNode[],
    callerScope: Scope,
    line: number
  ): Promise<RuntimeValue | undefined> {
    if (this.callDepth >= MAX_CALL_DEPTH) {
      throw new AlgoError(
        `Débordement de la pile d'appels dans « ${sp.name} » (récursion trop profonde > ${MAX_CALL_DEPTH}).`,
        line,
        'runtime',
        1,
        'Vérifiez que votre fonction récursive atteint bien son cas de base.'
      );
    }

    if (args.length !== sp.params.length) {
      throw new AlgoError(
        `« ${sp.name} » attend ${sp.params.length} paramètre(s), mais ${args.length} fourni(s).`,
        line,
        'runtime'
      );
    }

    const localScope = new Scope(sp.name, this.globalScope);

    // Bind parameters
    for (let i = 0; i < sp.params.length; i++) {
      const param = sp.params[i];
      const argExpr = args[i];
      if (param.byRef) {
        const lv = this.exprToLValue(argExpr);
        if (!lv) {
          throw new AlgoError(
            `Le paramètre « ${param.name} » de « ${sp.name} » est passé par référence (@/Var) : passez une variable ou un élément de tableau.`,
            line,
            'runtime'
          );
        }
        const refCell = await this.resolveLValueCell(lv, callerScope);
        localScope.defineRef(param.name, refCell, param.type);
      } else {
        const val = await this.evalExpr(argExpr, callerScope);
        localScope.define(param.name, cloneValue(val), param.type, false);
      }
    }

    // For Pascal-style return assignment (NomFonction ← val), prepare optional return slot
    let fnReturnCell: Cell | null = null;
    if (sp.kind === 'function') {
      const defRet = sp.returnType
        ? await this.defaultValueForType(sp.returnType, localScope)
        : 0;
      fnReturnCell = localScope.define(sp.name, defRet, sp.returnType ?? null, false);
    }

    // Local constants & variables
    for (const cd of sp.constants) {
      const val = await this.evalExpr(cd.value, localScope);
      localScope.define(cd.name, val, cd.type ?? null, true);
    }
    for (const vd of sp.variables) {
      const resolved = this.resolveTypeSpec(vd.type);
      const initVal = vd.initialValue
        ? await this.evalExpr(vd.initialValue, localScope)
        : await this.defaultValueForType(resolved, localScope);
      localScope.define(vd.name, initVal, resolved, false);
    }

    this.pushTrace(line, callerScope.name, 'call', sp.name, `${args.length} arg(s)`);
    this.callDepth++;

    try {
      await this.execBlock(sp.body, localScope);
    } catch (sig) {
      if (sig instanceof ReturnSignal) {
        this.callDepth--;
        return sig.value;
      }
      this.callDepth--;
      throw sig;
    }

    this.callDepth--;

    if (sp.kind === 'function') {
      if (fnReturnCell && fnReturnCell.modified) {
        return fnReturnCell.get();
      }
      throw new AlgoError(
        `La fonction « ${sp.name} » s'est terminée sans exécuter l'instruction Retourner.`,
        sp.line,
        'runtime',
        1,
        'Ajoutez « Retourner ... » pour renvoyer le résultat de la fonction.'
      );
    }

    return undefined;
  }

  private async evalExpr(expr: ExprNode, scope: Scope): Promise<RuntimeValue> {
    switch (expr.kind) {
      case 'number':
        return expr.value;
      case 'string':
      case 'char':
        return expr.value;
      case 'boolean':
        return expr.value;

      case 'var': {
        const cell = scope.resolve(expr.name);
        if (!cell) {
          throw new AlgoError(
            `Variable « ${expr.name} » non déclarée ou non initialisée.`,
            expr.line,
            'runtime',
            1,
            `Déclarez « ${expr.name} » dans la section Variables ou affectez-lui une valeur avant de l'utiliser.`
          );
        }
        return cell.get();
      }

      case 'index': {
        const target = await this.evalExpr(expr.target, scope);
        const indices: number[] = [];
        for (const idxExpr of expr.indices) {
          const n = this.expectNumber(await this.evalExpr(idxExpr, scope), idxExpr.line);
          if (!Number.isInteger(n)) {
            throw new AlgoError(
              `L'indice doit être un entier (reçu : ${n}).`,
              idxExpr.line,
              'runtime'
            );
          }
          indices.push(n);
        }

        if (typeof target === 'string') {
          if (indices.length !== 1) {
            throw new AlgoError('Une chaîne ne prend qu’un seul indice.', expr.line, 'runtime');
          }
          const idx = indices[0];
          if (idx < 1 || idx > target.length) {
            throw new AlgoError(
              `Indice de chaîne hors limites : ${idx} (les chaînes sont indexées de 1 à ${target.length}).`,
              expr.line,
              'runtime'
            );
          }
          return target[idx - 1];
        }

        if (isAlgoArray(target)) {
          let cur: RuntimeValue = target;
          for (const idx of indices) {
            if (!isAlgoArray(cur)) {
              throw new AlgoError('Trop d’indices pour ce tableau.', expr.line, 'runtime');
            }
            this.checkArrayBounds(cur, idx, expr.line, 'Tableau');
            if (cur.data.has(idx)) {
              cur = cur.data.get(idx)!;
            } else {
              cur = this.defaultForElementType(cur.elementType);
            }
          }
          return cur;
        }

        throw new AlgoError(
          'Impossible d’utiliser l’opérateur d’indexation [ ] sur cette valeur.',
          expr.line,
          'runtime'
        );
      }

      case 'field': {
        const target = await this.evalExpr(expr.target, scope);
        if (!isAlgoRecord(target)) {
          throw new AlgoError(
            `Impossible d’accéder au champ « .${expr.field} » sur une valeur qui n'est pas un enregistrement.`,
            expr.line,
            'runtime'
          );
        }
        const f = target.fields.get(normalizeWord(expr.field));
        if (!f) {
          throw new AlgoError(
            `Champ « ${expr.field} » introuvable dans « ${target.typeName} ».`,
            expr.line,
            'runtime'
          );
        }
        return f.value;
      }

      case 'unary': {
        const val = await this.evalExpr(expr.operand, scope);
        if (expr.op === '-') return -this.expectNumber(val, expr.line);
        if (expr.op === '+') return +this.expectNumber(val, expr.line);
        if (expr.op === 'NON') return !this.expectBoolean(val, expr.line);
        throw new AlgoError(`Opérateur unaire inconnu : ${expr.op}`, expr.line, 'runtime');
      }

      case 'binary': {
        // Short-circuit logical operators!
        if (expr.op === 'ET') {
          const left = this.expectBoolean(await this.evalExpr(expr.left, scope), expr.line);
          if (!left) return false;
          return this.expectBoolean(await this.evalExpr(expr.right, scope), expr.line);
        }
        if (expr.op === 'OU') {
          const left = this.expectBoolean(await this.evalExpr(expr.left, scope), expr.line);
          if (left) return true;
          return this.expectBoolean(await this.evalExpr(expr.right, scope), expr.line);
        }

        const left = await this.evalExpr(expr.left, scope);
        const right = await this.evalExpr(expr.right, scope);

        switch (expr.op) {
          case '+':
            if (typeof left === 'string' || typeof right === 'string') {
              return formatRuntimeOutput(left) + formatRuntimeOutput(right);
            }
            return this.expectNumber(left, expr.line) + this.expectNumber(right, expr.line);

          case '-':
            return this.expectNumber(left, expr.line) - this.expectNumber(right, expr.line);

          case '*':
            return this.expectNumber(left, expr.line) * this.expectNumber(right, expr.line);

          case '/': {
            const b = this.expectNumber(right, expr.line);
            if (b === 0) {
              throw new AlgoError('Division par zéro impossible.', expr.line, 'runtime');
            }
            return this.expectNumber(left, expr.line) / b;
          }

          case 'DIV': {
            const a = this.expectNumber(left, expr.line);
            const b = this.expectNumber(right, expr.line);
            if (b === 0) {
              throw new AlgoError('Division entière (DIV) par zéro impossible.', expr.line, 'runtime');
            }
            return Math.trunc(a / b);
          }

          case 'MOD': {
            const a = this.expectNumber(left, expr.line);
            const b = this.expectNumber(right, expr.line);
            if (b === 0) {
              throw new AlgoError('Modulo (MOD) par zéro impossible.', expr.line, 'runtime');
            }
            return a % b;
          }

          case '^':
            return Math.pow(
              this.expectNumber(left, expr.line),
              this.expectNumber(right, expr.line)
            );

          case '=':
            return this.valuesEqual(left, right);
          case '≠':
            return !this.valuesEqual(left, right);
          case '<':
            return this.compareValues(left, right, expr.line) < 0;
          case '≤':
            return this.compareValues(left, right, expr.line) <= 0;
          case '>':
            return this.compareValues(left, right, expr.line) > 0;
          case '≥':
            return this.compareValues(left, right, expr.line) >= 0;
        }
        throw new AlgoError(`Opérateur binaire inconnu : ${expr.op}`, expr.line, 'runtime');
      }

      case 'call': {
        return await this.evalFunctionCall(expr.name, expr.args, scope, expr.line);
      }
    }
  }

  private async evalFunctionCall(
    name: string,
    args: ExprNode[],
    scope: Scope,
    line: number
  ): Promise<RuntimeValue> {
    const norm = normalizeWord(name);

    // Check user-defined function first (allows shadowing if desired)
    const userFn = this.subprograms.get(norm);
    if (userFn) {
      if (userFn.kind === 'procedure') {
        throw new AlgoError(
          `« ${name} » est une Procédure, pas une Fonction : elle ne peut pas être utilisée dans une expression.`,
          line,
          'runtime'
        );
      }
      const res = await this.invokeSubprogram(userFn, args, scope, line);
      return res ?? 0;
    }

    // Built-in standard library functions
    const evalArgs = async () => {
      const vals: RuntimeValue[] = [];
      for (const a of args) vals.push(await this.evalExpr(a, scope));
      return vals;
    };

    switch (norm) {
      case 'long':
      case 'longueur': {
        const [v] = await evalArgs();
        if (typeof v === 'string') return v.length;
        if (isAlgoArray(v)) {
          if (v.low !== undefined && v.high !== undefined) return v.high - v.low + 1;
          return v.data.size;
        }
        throw new AlgoError('Long() attend une chaîne de caractères ou un tableau.', line, 'runtime');
      }

      case 'sous_chaine':
      case 'souschaine': {
        const vals = await evalArgs();
        if (vals.length < 2 || vals.length > 3) {
          throw new AlgoError(
            'Sous_Chaine(ch, pos, nb) attend 2 ou 3 arguments.',
            line,
            'runtime'
          );
        }
        const ch = this.expectString(vals[0], line);
        const pos = Math.trunc(this.expectNumber(vals[1], line));
        const startIdx = Math.max(0, pos - 1);
        if (vals.length === 2) {
          return ch.substring(startIdx);
        }
        const nb = Math.max(0, Math.trunc(this.expectNumber(vals[2], line)));
        return ch.substring(startIdx, startIdx + nb);
      }

      case 'pos':
      case 'position': {
        const vals = await evalArgs();
        if (vals.length !== 2) {
          throw new AlgoError('Pos(sous_chaine, chaine) attend 2 arguments.', line, 'runtime');
        }
        const sub = this.expectString(vals[0], line);
        const ch = this.expectString(vals[1], line);
        const found = ch.indexOf(sub);
        return found === -1 ? 0 : found + 1;
      }

      case 'convch': {
        const vals = await evalArgs();
        if (vals.length !== 1) {
          throw new AlgoError(
            'En tant que fonction, ConvCh(x) attend 1 argument (ou utilisez la procédure ConvCh(x, ch)).',
            line,
            'runtime'
          );
        }
        return formatRuntimeOutput(vals[0]);
      }

      case 'valeur': {
        const vals = await evalArgs();
        if (vals.length !== 1) {
          throw new AlgoError(
            'En tant que fonction, Valeur(ch) attend 1 argument (ou utilisez Valeur(ch, x, err)).',
            line,
            'runtime'
          );
        }
        const s = this.expectString(vals[0], line).trim().replace(',', '.');
        const num = Number(s);
        if (s === '' || Number.isNaN(num)) {
          throw new AlgoError(
            `Impossible de convertir « ${vals[0]} » en nombre avec Valeur().`,
            line,
            'runtime'
          );
        }
        return num;
      }

      case 'efface': {
        const vals = await evalArgs();
        if (vals.length !== 3) {
          throw new AlgoError('Efface(ch, pos, nb) attend 3 arguments.', line, 'runtime');
        }
        return this.doEfface(
          this.expectString(vals[0], line),
          Math.trunc(this.expectNumber(vals[1], line)),
          Math.trunc(this.expectNumber(vals[2], line))
        );
      }

      case 'insere':
      case 'inserer': {
        const vals = await evalArgs();
        if (vals.length !== 3) {
          throw new AlgoError('Insere(sous, ch, pos) attend 3 arguments.', line, 'runtime');
        }
        return this.doInsere(
          this.expectString(vals[0], line),
          this.expectString(vals[1], line),
          Math.trunc(this.expectNumber(vals[2], line))
        );
      }

      case 'majus':
      case 'majuscule': {
        const [v] = await evalArgs();
        return this.expectString(v, line).toUpperCase();
      }

      case 'minus':
      case 'minuscule': {
        const [v] = await evalArgs();
        return this.expectString(v, line).toLowerCase();
      }

      case 'concat': {
        const vals = await evalArgs();
        return vals.map((v) => formatRuntimeOutput(v)).join('');
      }

      case 'estnum': {
        const [v] = await evalArgs();
        const s = this.expectString(v, line).trim().replace(',', '.');
        return s !== '' && !Number.isNaN(Number(s));
      }

      case 'ord': {
        const [v] = await evalArgs();
        const s = this.expectString(v, line);
        if (s.length === 0) {
          throw new AlgoError('Ord() ne peut pas être appelé sur une chaîne vide.', line, 'runtime');
        }
        return s.charCodeAt(0);
      }

      case 'chr': {
        const [v] = await evalArgs();
        const code = Math.trunc(this.expectNumber(v, line));
        return String.fromCharCode(code);
      }

      case 'abs': {
        const [v] = await evalArgs();
        return Math.abs(this.expectNumber(v, line));
      }

      case 'racine':
      case 'sqrt': {
        const [v] = await evalArgs();
        const n = this.expectNumber(v, line);
        if (n < 0) {
          throw new AlgoError(`Racine carrée d'un nombre négatif (${n}) impossible.`, line, 'runtime');
        }
        return Math.sqrt(n);
      }

      case 'arrondi':
      case 'round': {
        const [v] = await evalArgs();
        return Math.round(this.expectNumber(v, line));
      }

      case 'ent':
      case 'tronc':
      case 'trunc': {
        const [v] = await evalArgs();
        return Math.trunc(this.expectNumber(v, line));
      }

      case 'puiss':
      case 'pow': {
        const [a, b] = await evalArgs();
        return Math.pow(this.expectNumber(a, line), this.expectNumber(b, line));
      }

      case 'alea':
      case 'hasard': {
        const vals = await evalArgs();
        if (vals.length === 0) return Math.random();
        if (vals.length === 1) {
          const max = Math.trunc(this.expectNumber(vals[0], line));
          return Math.floor(Math.random() * max);
        }
        const min = Math.trunc(this.expectNumber(vals[0], line));
        const max = Math.trunc(this.expectNumber(vals[1], line));
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      case 'min': {
        const vals = await evalArgs();
        if (vals.length === 0) throw new AlgoError('Min() attend au moins un argument.', line, 'runtime');
        return Math.min(...vals.map((v) => this.expectNumber(v, line)));
      }

      case 'max': {
        const vals = await evalArgs();
        if (vals.length === 0) throw new AlgoError('Max() attend au moins un argument.', line, 'runtime');
        return Math.max(...vals.map((v) => this.expectNumber(v, line)));
      }

      case 'sin': {
        const [v] = await evalArgs();
        return Math.sin(this.expectNumber(v, line));
      }
      case 'cos': {
        const [v] = await evalArgs();
        return Math.cos(this.expectNumber(v, line));
      }
      case 'tan': {
        const [v] = await evalArgs();
        return Math.tan(this.expectNumber(v, line));
      }
      case 'exp': {
        const [v] = await evalArgs();
        return Math.exp(this.expectNumber(v, line));
      }
      case 'ln':
      case 'log': {
        const [v] = await evalArgs();
        const n = this.expectNumber(v, line);
        if (n <= 0) throw new AlgoError('Logarithme défini uniquement pour x > 0.', line, 'runtime');
        return Math.log(n);
      }

      default:
        throw new AlgoError(
          `Fonction « ${name} » inconnue.`,
          line,
          'runtime',
          1,
          'Vérifiez le nom de la fonction ou déclarez-la avec Fonction.'
        );
    }
  }

  private doEfface(ch: string, pos: number, nb: number): string {
    const start = Math.max(0, pos - 1);
    const count = Math.max(0, nb);
    return ch.slice(0, start) + ch.slice(start + count);
  }

  private doInsere(sub: string, ch: string, pos: number): string {
    const idx = Math.max(0, Math.min(ch.length, pos - 1));
    return ch.slice(0, idx) + sub + ch.slice(idx);
  }

  private expectNumber(v: RuntimeValue, line: number): number {
    if (typeof v === 'number') return v;
    throw new AlgoError(
      `Nombre attendu, mais valeur « ${formatInspectorValue(v)} » (${inferTypeDisplay(v)}) reçue.`,
      line,
      'runtime'
    );
  }

  private expectString(v: RuntimeValue, line: number): string {
    if (typeof v === 'string') return v;
    throw new AlgoError(
      `Chaîne ou caractère attendu, mais « ${formatInspectorValue(v)} » (${inferTypeDisplay(v)}) reçu.`,
      line,
      'runtime'
    );
  }

  private expectBoolean(v: RuntimeValue, line: number): boolean {
    if (typeof v === 'boolean') return v;
    throw new AlgoError(
      `Condition booléenne attendue (Vrai ou Faux), mais « ${formatInspectorValue(v)} » reçu.`,
      line,
      'runtime',
      1,
      'Utilisez un opérateur de comparaison (=, ≠, <, ≤, >, ≥) ou logique (ET, OU, NON).'
    );
  }

  private valuesEqual(a: RuntimeValue, b: RuntimeValue): boolean {
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) < 1e-12;
    }
    return a === b;
  }

  private compareValues(a: RuntimeValue, b: RuntimeValue, line: number): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'string' && typeof b === 'string') {
      return a < b ? -1 : a > b ? 1 : 0;
    }
    throw new AlgoError(
      `Impossible de comparer « ${formatInspectorValue(a)} » (${inferTypeDisplay(a)}) et « ${formatInspectorValue(b)} » (${inferTypeDisplay(b)}).`,
      line,
      'runtime'
    );
  }
}
