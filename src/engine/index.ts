import { tokenize } from './lexer';
import { parse } from './parser';
import { Interpreter } from './interpreter';
import { AlgoError, ExecutionCallbacks, ExecutionResult } from './types';

export * from './types';
export { tokenize, normalizeWord } from './lexer';
export { parse } from './parser';
export { Interpreter, formatInspectorValue, formatRuntimeOutput } from './interpreter';
export { formatPseudocode } from './formatter';

export async function runPseudocode(
  source: string,
  callbacks: ExecutionCallbacks
): Promise<ExecutionResult> {
  const start = performance.now();
  try {
    const tokens = tokenize(source);
    const ast = parse(tokens);
    const interpreter = new Interpreter(ast, callbacks);
    return await interpreter.run();
  } catch (err) {
    if (err instanceof AlgoError) {
      return {
        success: false,
        variables: [],
        trace: [],
        stepsExecuted: 0,
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
      variables: [],
      trace: [],
      stepsExecuted: 0,
      durationMs: Math.round(performance.now() - start),
      error: {
        message: err instanceof Error ? err.message : String(err),
        line: 1,
        col: 1,
        phase: 'parse',
      },
    };
  }
}
