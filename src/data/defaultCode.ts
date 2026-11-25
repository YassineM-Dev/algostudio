export const DEFAULT_ALGO_FILENAME = 'Analyse_Nombre.algo';

export const DEFAULT_ALGO_CODE = `// Convention officielle Bac Tunisien (pas de bloc Variables — voir onglet TDO)
Algorithme AnalyseNombre
Début
    Ecrire("=== AlgoStudio : Analyseur d'Entier ===")
    Répéter
        Ecrire("Donner un entier N entre 2 et 100 : ")
        Lire(N)
    Jusqu'à (N ≥ 2) ET (N ≤ 100)

    // Recherche des diviseurs de N
    nbDiv ← 0
    Pour i De 1 À N Faire
        Si N MOD i = 0 Alors
            nbDiv ← nbDiv + 1
            Diviseurs[nbDiv] ← i
        FinSi
    FinPour

    premier ← EstPremier(N)
    Ecrire("Nombre de diviseurs : ", nbDiv)
    Ecrire("Liste des diviseurs : ", Diviseurs)

    Si premier Alors
        Ecrire("Résultat : ", N, " est un nombre PREMIER !")
    Sinon
        Ecrire("Résultat : ", N, " n'est pas premier.")
    FinSi
Fin

// Sous-programme placé après Fin (Convention Bac)
Fonction EstPremier(x : Entier) : Booléen
Début
    Si x < 2 Alors
        Retourner Faux
    FinSi
    d ← 2
    TantQue d * d ≤ x Faire
        Si x MOD d = 0 Alors
            Retourner Faux
        FinSi
        d ← d + 1
    FinTantQue
    Retourner Vrai
Fin
`;

export const QUICK_STARTERS: Array<{ id: string; label: string; fileName: string; code: string }> = [
  {
    id: 'welcome',
    label: 'Analyseur (Lire + Tableau)',
    fileName: DEFAULT_ALGO_FILENAME,
    code: DEFAULT_ALGO_CODE,
  },
  {
    id: 'tri-dicho',
    label: 'Tri Insertion + Dichotomie',
    fileName: 'Tri_Et_Dichotomie.algo',
    code: `Algorithme TriEtRecherche
Début
    N ← 8
    T[1] ← 42 ; T[2] ← 7 ; T[3] ← 19 ; T[4] ← 3
    T[5] ← 25 ; T[6] ← 11 ; T[7] ← 64 ; T[8] ← 15
    Ecrire("Tableau initial : ", T)

    TriInsertion(T, N)
    Ecrire("Tableau trié    : ", T)

    cible ← 25
    pos ← RechercheDicho(T, N, cible)
    Ecrire("Recherche dichotomique de ", cible, " -> position ", pos)
Fin

Procédure TriInsertion(@T : Tableau, N : Entier)
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
Fin

Fonction RechercheDicho(T : Tableau, N : Entier, x : Entier) : Entier
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
Fin
`,
  },
  {
    id: 'strings',
    label: 'Chaînes & Palindrome',
    fileName: 'Chaines_Palindrome.algo',
    code: `Algorithme DemoChainesBac
Début
    mot ← "Radar"
    estPal ← EstPalindrome(mot)
    extrait ← Sous_Chaine(Majus(mot), 1, 3)
    Ecrire("Mot : ", mot, " | Longueur : ", Long(mot))
    Ecrire("Préfixe (3 lettres) : ", extrait)
    Ecrire("Est palindrome ? ", estPal)
Fin

Fonction EstPalindrome(ch : Chaîne) : Booléen
Début
    m ← Majus(ch)
    g ← 1 ; d ← Long(m)
    TantQue g < d Faire
        Si m[g] ≠ m[d] Alors
            Retourner Faux
        FinSi
        g ← g + 1 ; d ← d - 1
    FinTantQue
    Retourner Vrai
Fin
`,
  },
];
