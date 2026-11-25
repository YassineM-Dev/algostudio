import { describe, expect, it } from 'vitest';
import { formatPseudocode, runPseudocode } from '../index';

async function execute(code: string, inputs: string[] = []) {
  const outputs: string[] = [];
  let inputIdx = 0;
  const result = await runPseudocode(code, {
    onWrite: (text) => outputs.push(text),
    onRead: async () => {
      if (inputIdx >= inputs.length) throw new Error('Unexpected read');
      return inputs[inputIdx++];
    },
  });
  return { outputs, result };
}

describe('AlgoStudio Pseudocode Engine', () => {
  it('executes variables, constants, arithmetic (DIV, MOD) and Ecrire/Lire', async () => {
    const code = `
Algorithme SurfaceCercle
Constantes
    PI ← 3.14
Variables
    r : Entier
    s : Réel
    q, reste : Entier
Début
    Lire(r)
    s ← PI * r * r
    q ← 17 DIV 5
    reste ← 17 MOD 5
    Ecrire("Surface = ", s)
    Ecrire("17 DIV 5 = ", q, " | MOD = ", reste)
Fin
`;
    const { outputs, result } = await execute(code, ['10']);
    expect(result.success).toBe(true);
    expect(outputs).toEqual(['Surface = 314', '17 DIV 5 = 3 | MOD = 2']);
    expect(result.variables.find((v) => v.name === 'q')?.value).toBe('3');
    expect(result.variables.find((v) => v.name === 'reste')?.value).toBe('2');
  });

  it('handles Si/SinonSi/Sinon and Selon structures', async () => {
    const code = `
Algorithme Conditions
Variables
    note, jour : Entier
Début
    note ← 15
    Si note ≥ 16 Alors
        Ecrire("Très Bien")
    Sinon Si note ≥ 14 Alors
        Ecrire("Bien")
    Sinon
        Ecrire("Passable")
    FinSi

    jour ← 6
    Selon jour Faire
        1 : Ecrire("Lundi")
        6, 7 : Ecrire("Week-end")
        Sinon : Ecrire("Semaine")
    FinSelon
Fin
`;
    const { outputs, result } = await execute(code);
    expect(result.success).toBe(true);
    expect(outputs).toEqual(['Bien', 'Week-end']);
  });

  it('executes Pour (with positive & negative Pas), TantQue, and Répéter...Jusqu\'à', async () => {
    const code = `
Algorithme Boucles
Variables
    i, s, n, cpt : Entier
Début
    s ← 0
    Pour i De 1 À 5 Faire
        s ← s + i
    FinPour
    Ecrire("Somme=", s)

    s ← 0
    Pour i De 10 A 2 Pas -2 Faire
        s ← s + i
    FinPour
    Ecrire("Pairs=", s)

    n ← 12345
    cpt ← 0
    TantQue n > 0 Faire
        n ← n DIV 10
        cpt ← cpt + 1
    FinTantQue
    Ecrire("Chiffres=", cpt)

    Répéter
        Lire(n)
    Jusqu'à (n ≥ 0) ET (n ≤ 20)
    Ecrire("Note=", n)
Fin
`;
    const { outputs, result } = await execute(code, ['-4', '25', '17']);
    expect(result.success).toBe(true);
    expect(outputs).toEqual(['Somme=15', 'Pairs=30', 'Chiffres=5', 'Note=17']);
  });

  it('supports 1D arrays, pass-by-reference (@ and Var), and Sorting + Binary Search (including debut/fin vars)', async () => {
    const code = `
Algorithme TriEtRecherche
Variables
    T : Tableau[1..6] de Entier
    N, pos : Entier

Procédure TriInsertion(@T : Tableau, N : Entier)
Variables
    i, j, cle : Entier
Début
    Pour i De 2 À N Faire
        cle ← T[i]
        j ← i - 1
        TantQue (j ≥ 1) ET (T[j] > cle) Faire
            T[j + 1] ← T[j]
            j ← j - 1
        FinTantQue
        T[j + 1] ← cle
    FinPour
FinProcédure

Fonction RechercheDichotomique(T : Tableau, N : Entier, x : Entier) : Entier
Variables debut, fin, milieu : Entier
Début
    debut ← 1 ; fin ← N
    TantQue debut ≤ fin Faire
        milieu ← (debut + fin) DIV 2
        Si T[milieu] = x Alors
            Retourner milieu
        Sinon Si x < T[milieu] Alors
            fin ← milieu - 1
        Sinon
            debut ← milieu + 1
        FinSi
    FinTantQue
    Retourner -1
FinFonction

Début
    N ← 6
    T[1] ← 42 ; T[2] ← 7 ; T[3] ← 19 ; T[4] ← 3 ; T[5] ← 25 ; T[6] ← 11
    TriInsertion(T, N)
    pos ← RechercheDichotomique(T, N, 19)
    Ecrire("Trié=", T)
    Ecrire("Pos19=", pos)
Fin
`;
    const { outputs, result } = await execute(code);
    expect(result.success).toBe(true);
    expect(outputs).toEqual(['Trié=[3, 7, 11, 19, 25, 42]', 'Pos19=4']);
  });

  it('supports recursive functions (Factorielle & PGCD) and string standard functions', async () => {
    const code = `
Algorithme StringsEtRec
Variables
    ch, sub, s : Chaîne
    p, v, err : Entier

Fonction Fact(n : Entier) : Entier
Début
    Si n ≤ 1 Alors Retourner 1 FinSi
    Retourner n * Fact(n - 1)
FinFonction

Début
    Ecrire("5! = ", Fact(5))
    ch ← "AlgoStudio"
    Ecrire("Long=", Long(ch))
    sub ← Sous_Chaine(ch, 5, 6)
    p ← Pos("Studio", ch)
    Ecrire("Sub=", sub, " Pos=", p)
    ConvCh(2026, s)
    Valeur("42", v, err)
    Ecrire("Conv=", s, " Val=", v, " Err=", err)
    Ecrire("Maj=", Majus(sub), " OrdA=", Ord('A'), " Chr65=", Chr(65))
    Efface(ch, 5, 6)
    Insere("Bac", ch, 5)
    Ecrire("Modif=", ch)
Fin
`;
    const { outputs, result } = await execute(code);
    expect(result.success).toBe(true);
    expect(outputs).toEqual([
      '5! = 120',
      'Long=10',
      'Sub=Studio Pos=5',
      'Conv=2026 Val=42 Err=0',
      'Maj=STUDIO OrdA=65 Chr65=A',
      'Modif=AlgoBac',
    ]);
  });

  it('supports Enregistrement and 2D Matrices', async () => {
    const code = `
Algorithme RecordsMatrices
Types
    Etudiant = Enregistrement
        nom : Chaîne
        moyenne : Réel
    FinEnregistrement
Variables
    e : Etudiant
    M : Tableau[1..2, 1..2] de Entier
Début
    e.nom ← "Yasmine"
    e.moyenne ← 18.5
    M[1, 1] ← 10 ; M[1, 2] ← 20 ; M[2, 1] ← 30 ; M[2, 2] ← 40
    Ecrire(e.nom, " : ", e.moyenne)
    Ecrire("Somme diag = ", M[1, 1] + M[2, 2])
Fin
`;
    const { outputs, result } = await execute(code);
    expect(result.success).toBe(true);
    expect(outputs).toEqual(['Yasmine : 18.5', 'Somme diag = 50']);
  });

  it('reports exact line number on syntax and runtime errors', async () => {
    const syntaxErr = `Algorithme Test
Variables
    x : Entier
Début
    x ← 5
    Si x > 2
        Ecrire("Oubli de Alors")
    FinSi
Fin`;
    const res1 = await execute(syntaxErr);
    expect(res1.result.success).toBe(false);
    expect(res1.result.error?.phase).toBe('parse');
    expect(res1.result.error?.line).toBe(6);

    const divZero = `Algorithme DivZero
Variables
    a : Entier
Début
    a ← 10 DIV 0
Fin`;
    const res2 = await execute(divZero);
    expect(res2.result.success).toBe(false);
    expect(res2.result.error?.phase).toBe('runtime');
    expect(res2.result.error?.line).toBe(5);
  });

  it('formats pseudocode cleanly with Unicode operators and indentation', () => {
    const messy = `Algorithme Demo
Variables
x : Entier
Début
x := 5
Si x >= 3 Alors
Ecrire("OK")
Sinon
Ecrire("Non")
FinSi
Fin`;
    const formatted = formatPseudocode(messy);
    expect(formatted).toContain('    x : Entier');
    expect(formatted).toContain('    x ← 5');
    expect(formatted).toContain('    Si x ≥ 3 Alors');
    expect(formatted).toContain('        Ecrire("OK")');
    expect(formatted).toContain('    FinSi');
  });

  it('runs authentic Tunisian Bac pseudocode WITHOUT Variables declarations and keeps local loop counters isolated', async () => {
    const code = `
Algorithme BacTunisienSansVariables
Début
    Saisir(N)
    Remplir(T, N)
    Somme ← 0
    Pour i De 1 À N Faire
        Somme ← Somme + Double(T[i])
    FinPour
    Ecrire("Somme des doubles = ", Somme)
    classe[1].nom ← "Yasmine"
    classe[1].moyenne ← 18.5
    Ecrire(classe[1].nom, " -> ", classe[1].moyenne)
Fin

Procédure Saisir(@N : Entier)
Début
    Lire(N)
Fin

Procédure Remplir(@T : Tableau, N : Entier)
Début
    Pour i De 1 À N Faire
        T[i] ← i * 10
    FinPour
Fin

Fonction Double(x : Entier) : Entier
Début
    // Utilise la même variable locale i sans écraser le i du programme principal !
    i ← 999
    Retourner x * 2
Fin
`;
    const { outputs, result } = await execute(code, ['4']);
    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    expect(outputs).toEqual(['Somme des doubles = 200', 'Yasmine -> 18.5']);
    expect(result.variables.find((v) => v.name === 'T')?.type).toBe('Tableau de Entier');
    expect(result.variables.find((v) => v.name === 'Somme')?.value).toBe('200');
  });
});
