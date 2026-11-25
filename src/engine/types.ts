export type TokenType =
  | 'KEYWORD'
  | 'IDENT'
  | 'NUMBER'
  | 'STRING'
  | 'CHAR'
  | 'ASSIGN'    // ← or :=
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'CARET'
  | 'EQ'        // =
  | 'NEQ'       // ≠, <>, !=
  | 'LT'
  | 'LTE'       // ≤, <=
  | 'GT'
  | 'GTE'       // ≥, >=
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'COLON'
  | 'SEMICOLON'
  | 'DOT'
  | 'DOTDOT'
  | 'AT'        // @
  | 'NEWLINE'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;       // Normalized value for keywords, raw for others
  raw: string;         // Original source text
  line: number;
  col: number;
}

export class AlgoError extends Error {
  line: number;
  col: number;
  phase: 'lex' | 'parse' | 'runtime';
  hint?: string;

  constructor(
    message: string,
    line: number,
    phase: 'lex' | 'parse' | 'runtime',
    col = 1,
    hint?: string
  ) {
    super(message);
    this.name = 'AlgoError';
    this.line = line;
    this.col = col;
    this.phase = phase;
    this.hint = hint;
  }
}

export type PrimitiveTypeName = 'entier' | 'reel' | 'chaine' | 'caractere' | 'booleen';

export type TypeSpec =
  | { kind: 'primitive'; name: PrimitiveTypeName; display: string }
  | {
      kind: 'array';
      dimensions: Array<{ low: ExprNode; high: ExprNode }>;
      elementType: TypeSpec;
      display: string;
    }
  | { kind: 'array_unsized'; elementType?: TypeSpec; display: string }
  | { kind: 'record'; fields: Array<{ name: string; type: TypeSpec }>; display: string }
  | { kind: 'named'; name: string; display: string };

export interface ConstDecl {
  name: string;
  value: ExprNode;
  type?: TypeSpec;
  line: number;
}

export interface TypeDecl {
  name: string;
  spec: TypeSpec;
  line: number;
}

export interface VarDecl {
  name: string;
  type: TypeSpec;
  initialValue?: ExprNode;
  line: number;
}

export interface ParamDecl {
  name: string;
  byRef: boolean;
  type: TypeSpec;
  line: number;
}

export interface SubprogramDecl {
  kind: 'procedure' | 'function';
  name: string;
  params: ParamDecl[];
  returnType?: TypeSpec;
  constants: ConstDecl[];
  types: TypeDecl[];
  variables: VarDecl[];
  body: StmtNode[];
  line: number;
}

export interface ProgramNode {
  name: string;
  constants: ConstDecl[];
  types: TypeDecl[];
  variables: VarDecl[];
  subprograms: SubprogramDecl[];
  body: StmtNode[];
}

export type LValue =
  | { kind: 'var'; name: string; line: number }
  | { kind: 'index'; target: LValue; indices: ExprNode[]; line: number }
  | { kind: 'field'; target: LValue; field: string; line: number };

export type StmtNode =
  | { kind: 'assign'; target: LValue; value: ExprNode; line: number }
  | { kind: 'write'; args: ExprNode[]; newline: boolean; line: number }
  | { kind: 'read'; targets: LValue[]; line: number }
  | {
      kind: 'if';
      condition: ExprNode;
      thenBranch: StmtNode[];
      elseIfBranches: Array<{ condition: ExprNode; body: StmtNode[]; line: number }>;
      elseBranch: StmtNode[] | null;
      line: number;
    }
  | {
      kind: 'switch';
      expr: ExprNode;
      cases: Array<{
        values: Array<{ from: ExprNode; to?: ExprNode }>;
        body: StmtNode[];
        line: number;
      }>;
      defaultBranch: StmtNode[] | null;
      line: number;
    }
  | {
      kind: 'for';
      variable: string;
      start: ExprNode;
      end: ExprNode;
      step: ExprNode | null;
      body: StmtNode[];
      line: number;
    }
  | { kind: 'while'; condition: ExprNode; body: StmtNode[]; line: number }
  | { kind: 'repeat'; body: StmtNode[]; condition: ExprNode; line: number }
  | { kind: 'call'; name: string; args: ExprNode[]; line: number }
  | { kind: 'return'; value: ExprNode | null; line: number };

export type ExprNode =
  | { kind: 'number'; value: number; isReal: boolean; line: number }
  | { kind: 'string'; value: string; line: number }
  | { kind: 'char'; value: string; line: number }
  | { kind: 'boolean'; value: boolean; line: number }
  | { kind: 'var'; name: string; line: number }
  | { kind: 'index'; target: ExprNode; indices: ExprNode[]; line: number }
  | { kind: 'field'; target: ExprNode; field: string; line: number }
  | { kind: 'unary'; op: '-' | '+' | 'NON'; operand: ExprNode; line: number }
  | {
      kind: 'binary';
      op:
        | '+'
        | '-'
        | '*'
        | '/'
        | 'DIV'
        | 'MOD'
        | '^'
        | '='
        | '≠'
        | '<'
        | '≤'
        | '>'
        | '≥'
        | 'ET'
        | 'OU';
      left: ExprNode;
      right: ExprNode;
      line: number;
    }
  | { kind: 'call'; name: string; args: ExprNode[]; line: number };

// Runtime value representation
export interface AlgoArray {
  __kind: 'array';
  low?: number;
  high?: number;
  elementType?: string;
  elementTypeSpec?: TypeSpec;
  data: Map<number, RuntimeValue>;
}

export interface AlgoRecord {
  __kind: 'record';
  typeName: string;
  fields: Map<string, { displayName: string; value: RuntimeValue; typeDisplay: string }>;
}

export type RuntimeValue = number | string | boolean | AlgoArray | AlgoRecord;

export interface VariableSnapshot {
  name: string;
  type: string;
  value: string;
  isConstant: boolean;
  isArray: boolean;
  isRecord: boolean;
  arrayEntries?: Array<{ index: string; value: string }>;
  modified: boolean;
}

export interface TraceEntry {
  step: number;
  line: number;
  scope: string;
  action: 'assign' | 'read' | 'write' | 'call' | 'return';
  target: string;
  value: string;
}

export interface ExecutionCallbacks {
  onWrite: (text: string, line: number) => void;
  onRead: (targetName: string, typeHint: string, line: number) => Promise<string>;
  onVariablesUpdate?: (vars: VariableSnapshot[]) => void;
  signal?: AbortSignal;
  maxSteps?: number;
}

export interface ExecutionResult {
  success: boolean;
  variables: VariableSnapshot[];
  trace: TraceEntry[];
  stepsExecuted: number;
  durationMs: number;
  error?: {
    message: string;
    line: number;
    col: number;
    phase: 'lex' | 'parse' | 'runtime';
    hint?: string;
  };
  aborted?: boolean;
}
