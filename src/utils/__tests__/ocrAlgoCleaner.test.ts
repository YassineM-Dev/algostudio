import { describe, expect, it } from 'vitest';
import { cleanOcrToAlgo, extractAlgoFilenameFromCode } from '../ocrAlgoCleaner';
import { runPseudocode } from '../../engine';

describe('Photo OCR -> Tunisian Bac Pseudocode Cleaner', () => {
  it('repairs arrows, comparison symbols, and French OCR keyword typos', async () => {
    const messyOcr = `
A1gorithme SommePairs
Debut
  S <- 0
  Pour i De 1 A 6 Faire
    Si (i mod 2 = 0) A1ors
      S < - S + i
    FinSi
  FinPour
  Ecnre("Somme = ", S)
Fin
`;
    const cleaned = cleanOcrToAlgo(messyOcr);
    expect(cleaned).toContain('Algorithme SommePairs');
    expect(cleaned).toContain('Début');
    expect(cleaned).toContain('S ← 0');
    expect(cleaned).toContain('Pour i De 1 À 6 Faire');
    expect(cleaned).toContain('Alors');
    expect(cleaned).toContain('S ← S + i');
    expect(cleaned).toContain('Fin Si');
    expect(cleaned).toContain('Fin Pour');
    expect(cleaned).toContain('Ecrire("Somme = ", S)');

    // Verify the cleaned algorithm executes cleanly in AlgoStudio's interpreter!
    const outputs: string[] = [];
    const res = await runPseudocode(cleaned, {
      onWrite: (t) => outputs.push(t),
      onRead: async () => '0',
    });
    expect(res.success).toBe(true);
    expect(outputs.join(' ')).toContain('12');
  });

  it('strips sequential editor line-number gutters automatically', () => {
    const withLineNums = [
      '1  Algorithme TestGutter',
      '2  Début',
      '3  x := 10',
      '4  Si x != 5 Alors',
      '5      Ecrire("OK")',
      '6  Fin Si',
      '7  Fin',
    ].join('\n');

    const cleaned = cleanOcrToAlgo(withLineNums);
    expect(cleaned).not.toMatch(/^\d+\s+Algorithme/m);
    expect(cleaned).toContain('x ← 10');
    expect(cleaned).toContain('Si x ≠ 5 Alors');
  });

  it('preserves text inside string literals untouched', () => {
    const raw = `Algorithme Chaine
Début
  Ecrire("Debut <- non modifie <= ici")
Fin`;
    const cleaned = cleanOcrToAlgo(raw);
    expect(cleaned).toContain('Ecrire("Debut <- non modifie <= ici")');
  });

  it('strips markdown code fences from AI Vision output and extracts filename', () => {
    const aiResp = '```algo\nAlgorithme Facto\nDébut\n  Ecrire(120)\nFin\n```';
    const cleaned = cleanOcrToAlgo(aiResp);
    expect(cleaned).not.toContain('```');
    expect(extractAlgoFilenameFromCode(cleaned)).toBe('Facto.algo');
    expect(extractAlgoFilenameFromCode('Début\nFin')).toBe('Photo_Algo.algo');
  });

  it('repairs real Tesseract French guillemet arrows and Consolas slashed-zero into runnable code', async () => {
    const realTesseractOut = [
      'Algorithme SommePhoto',
      'Debut',
      's«<- @',
      'Pour i De 1 A 5 Faire',
      's<«-s+i',
      'Fin Pour',
      'Ecrire("Somme = ", S)',
      'Fin',
    ].join('\n');
    const cleaned = cleanOcrToAlgo(realTesseractOut);
    expect(cleaned).toContain('s ← 0');
    expect(cleaned).toContain('Pour i De 1 À 5 Faire');
    expect(cleaned).toContain('s ← s+i');

    const outputs: string[] = [];
    const res = await runPseudocode(cleaned, {
      onWrite: (t) => outputs.push(t),
      onRead: async () => '0',
    });
    expect(res.success).toBe(true);
    expect(outputs.join(' ')).toContain('15');
  });
});
