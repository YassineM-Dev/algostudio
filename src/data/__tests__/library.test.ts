import { describe, expect, it } from 'vitest';
import { runPseudocode } from '../../engine';
import { STANDARD_MODULES } from '../standardModules';
import { CHEAT_SHEETS } from '../cheatSheets';
import { QUICK_STARTERS } from '../defaultCode';
import { BAC_EXAMS, BAC_YEAR_ARCHIVES } from '../bacExams';

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

describe('Bac Algorithmique Archive (2008–2026) Completeness & Purity', () => {
  it('covers every year from 2008 to 2026 with both Théorique and Pratique énoncés', () => {
    expect(BAC_YEAR_ARCHIVES.length).toBe(19);
    for (let year = 2008; year <= 2026; year++) {
      const thPrincipale = BAC_EXAMS.find(
        (e) =>
          e.year === year &&
          e.epreuve === 'Théorique' &&
          e.session === 'Principale' &&
          e.kind === 'Énoncé'
      );
      expect(thPrincipale, `Missing Théorique Principale énoncé for ${year}`).toBeDefined();

      if (year >= 2009) {
        const thControle = BAC_EXAMS.find(
          (e) =>
            e.year === year &&
            e.epreuve === 'Théorique' &&
            e.session === 'Contrôle' &&
            e.kind === 'Énoncé'
        );
        expect(thControle, `Missing Théorique Contrôle énoncé for ${year}`).toBeDefined();
      }

      const prEnonce = BAC_EXAMS.find(
        (e) => e.year === year && e.epreuve === 'Pratique' && e.kind === 'Énoncé'
      );
      expect(prEnonce, `Missing Pratique énoncé for ${year}`).toBeDefined();
    }
  });

  it('contains strictly Algorithmique & Programmation items with direct PDF/ZIP HTTPS links', () => {
    expect(BAC_EXAMS.length).toBeGreaterThanOrEqual(110);
    for (const item of BAC_EXAMS) {
      expect(item.downloadUrl).toMatch(/^https:\/\/.+\.(pdf|zip)$/i);
      expect(item.downloadUrl).not.toMatch(/\/(sti|tic|bd|eco|lettres|sport)[-_./]/i);
      expect(item.downloadUrl).toMatch(/algo/i);
    }
  });
});
