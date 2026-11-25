import { describe, expect, it } from 'vitest';
import { runPseudocode } from '../../engine';
import { STANDARD_MODULES } from '../standardModules';
import { CHEAT_SHEETS } from '../cheatSheets';
import { QUICK_STARTERS } from '../defaultCode';

const SAMPLE_INPUTS_BY_ID: Record<string, string[]> = {
  'remplir-tableau': ['3', '10', '20', '30'],
  'structure-types': ['5'],
  conditionnelles: ['16.5', '6'],
  iteratives: ['125'],
  welcome: ['29'],
};

async function runWithInputs(code: string, inputs: string[] = []) {
  const outputs: string[] = [];
  let idx = 0;
  const result = await runPseudocode(code, {
    onWrite: (t) => outputs.push(t),
    onRead: async () => inputs[idx++] ?? '5',
  });
  return { outputs, result };
}

describe('All Standard Library Modules Execute Cleanly', () => {
  for (const mod of STANDARD_MODULES) {
    it(`runs module "${mod.title}" (${mod.id}) without errors`, async () => {
      const inputs = SAMPLE_INPUTS_BY_ID[mod.id] ?? [];
      const { outputs, result } = await runWithInputs(mod.code, inputs);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
      expect(outputs.length).toBeGreaterThan(0);
    });
  }

  it('sorts arrays accurately in all 6 sorting algorithms', async () => {
    const sortingIds = [
      'tri-bulles',
      'tri-selection',
      'tri-insertion',
      'tri-shell',
      'tri-fusion',
      'tri-rapide',
    ];
    for (const id of sortingIds) {
      const mod = STANDARD_MODULES.find((m) => m.id === id)!;
      const { result } = await runWithInputs(mod.code);
      expect(result.success).toBe(true);
      const tVar = result.variables.find((v) => v.name === 'T');
      expect(tVar?.arrayEntries).toBeDefined();
      const nums = tVar!.arrayEntries!.map((e) => Number(e.value));
      for (let i = 1; i < nums.length; i++) {
        expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
      }
    }
  });
});

describe('All Runnable Cheat Sheet Snippets & Quick Starters Execute Cleanly', () => {
  for (const sheet of CHEAT_SHEETS) {
    for (const snippet of sheet.snippets) {
      if (!snippet.runnableCode) continue;
      it(`runs cheat sheet snippet "${sheet.title} - ${snippet.title}"`, async () => {
        const inputs = SAMPLE_INPUTS_BY_ID[sheet.id] ?? [];
        const { outputs, result } = await runWithInputs(snippet.runnableCode!, inputs);
        expect(result.error).toBeUndefined();
        expect(result.success).toBe(true);
        expect(outputs.length).toBeGreaterThan(0);
      });
    }
  }

  for (const starter of QUICK_STARTERS) {
    it(`runs quick starter "${starter.label}"`, async () => {
      const inputs = SAMPLE_INPUTS_BY_ID[starter.id] ?? [];
      const { outputs, result } = await runWithInputs(starter.code, inputs);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
      expect(outputs.length).toBeGreaterThan(0);
    });
  }
});
