export type ModuleCategory = 'math' | 'arrays' | 'sorting' | 'strings' | 'advanced';

export interface StandardModule {
  id: string;
  title: string;
  signature: string;
  category: ModuleCategory;
  complexity: string;
  space: string;
  description: string;
  tags: string[];
  code: string;
  requiresInput?: boolean;
}

export const MODULE_CATEGORIES: Array<{ id: ModuleCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Tous' },
  { id: 'math', label: 'Maths & Arithmétique' },
  { id: 'arrays', label: 'Tableaux & Recherche' },
  { id: 'sorting', label: 'Algorithmes de Tri' },
  { id: 'strings', label: 'Chaînes' },
  { id: 'advanced', label: 'Structures & Paradigmes (Guide)' },
];

export const STANDARD_MODULES: StandardModule[] = [
  // ======================== MATHÉMATIQUES & ARITHMÉTIQUE ========================
  {
    id: 'est-premier',
    title: 'EstPremier(n)',
    signature: 'Fonction EstPremier(n : Entier) : Booléen',
    category: 'math',
    complexity: 'O(√n)',
    space: 'O(1)',
    description:
      'Teste si un entier n est premier en vérifiant uniquement les diviseurs potentiels jusqu’à √n.',
    tags: ['Arithmétique', 'Premier', 'Classique Bac'],
    code: `Algorithme TestNombrePremier
Début
    Ecrire("=== Nombres premiers entre 1 et 50 ===")
    Pour n De 1 À 50 Faire
        Si EstPremier(n) Alors
            Ecrire(n, " est premier")
        FinSi
    FinPour
Fin

// Retourne Vrai si n est premier, Faux sinon
Fonction EstPremier(n : Entier) : Booléen
Début
    Si n < 2 Alors
        Retourner Faux
    FinSi
    i ← 2
    TantQue i * i ≤ n Faire
        Si n MOD i = 0 Alors
            Retourner Faux
        FinSi
        i ← i + 1
    FinTantQue
    Retourner Vrai
Fin`,
  },
  {
    id: 'pgcd-euclide',
    title: 'PGCD(a, b) — Euclide',
    signature: 'Fonction PGCD(a, b : Entier) : Entier',
    category: 'math',
    complexity: 'O(log min(a,b))',
    space: 'O(1)',
    description:
      'Calcule le Plus Grand Commun Diviseur de deux entiers par l’algorithme d’Euclide (version itérative et récursive).',
    tags: ['Euclide', 'DIV/MOD', 'Récursif'],
    code: `Algorithme CalculPGCD
Début
    a ← 252 ; b ← 105
    Ecrire("PGCD itératif(", a, ", ", b, ") = ", PGCD_Iter(a, b))
    Ecrire("PGCD récursif(", a, ", ", b, ") = ", PGCD_Rec(a, b))
Fin

// Version itérative (algorithme d'Euclide)
Fonction PGCD_Iter(a, b : Entier) : Entier
Début
    TantQue b ≠ 0 Faire
        r ← a MOD b
        a ← b
        b ← r
    FinTantQue
    Retourner a
Fin

// Version récursive
Fonction PGCD_Rec(a, b : Entier) : Entier
Début
    Si b = 0 Alors
        Retourner a
    Sinon
        Retourner PGCD_Rec(b, a MOD b)
    FinSi
Fin`,
  },
  {
    id: 'ppcm',
    title: 'PPCM(a, b)',
    signature: 'Fonction PPCM(a, b : Entier) : Entier',
    category: 'math',
    complexity: 'O(log min(a,b))',
    space: 'O(1)',
    description:
      'Calcule le Plus Petit Commun Multiple via la propriété fondamentale PPCM(a, b) = (a × b) DIV PGCD(a, b).',
    tags: ['Arithmétique', 'PGCD'],
    code: `Algorithme CalculPPCM
Début
    a ← 18 ; b ← 24
    Ecrire("PGCD(", a, ", ", b, ") = ", PGCD(a, b))
    Ecrire("PPCM(", a, ", ", b, ") = ", PPCM(a, b))
Fin

Fonction PGCD(a, b : Entier) : Entier
Début
    TantQue b ≠ 0 Faire
        r ← a MOD b
        a ← b
        b ← r
    FinTantQue
    Retourner a
Fin

Fonction PPCM(a, b : Entier) : Entier
Début
    Si (a = 0) OU (b = 0) Alors
        Retourner 0
    FinSi
    Retourner (a DIV PGCD(a, b)) * b
Fin`,
  },
  {
    id: 'factorielle',
    title: 'Factorielle(n) — Itérative & Récursive',
    signature: 'Fonction Factorielle(n : Entier) : Entier',
    category: 'math',
    complexity: 'O(n)',
    space: 'O(1) / O(n)',
    description:
      'Calcule n! = 1 × 2 × ... × n avec les deux approches incontournables : boucle Pour et récursivité.',
    tags: ['Récursivité', 'Classique Bac'],
    code: `Algorithme DemoFactorielle
Début
    Pour n De 0 À 7 Faire
        Ecrire(n, "! = ", FactIter(n), " (récursif : ", FactRec(n), ")")
    FinPour
Fin

// Version itérative : O(1) en mémoire
Fonction FactIter(n : Entier) : Entier
Début
    res ← 1
    Pour i De 2 À n Faire
        res ← res * i
    FinPour
    Retourner res
Fin

// Version récursive : cas de base n ≤ 1
Fonction FactRec(n : Entier) : Entier
Début
    Si n ≤ 1 Alors
        Retourner 1
    Sinon
        Retourner n * FactRec(n - 1)
    FinSi
Fin`,
  },
  {
    id: 'puissance',
    title: 'Puissance(x, n)',
    signature: 'Fonction Puissance(x : Réel, n : Entier) : Réel',
    category: 'math',
    complexity: 'O(log n)',
    space: 'O(log n)',
    description:
      'Exponentiation rapide par dichotomie (Diviser pour régner) permettant de calculer xⁿ en O(log n) multiplications.',
    tags: ['Diviser pour régner', 'Récursif'],
    code: `Algorithme ExponentiationRapide
Début
    base ← 2 ; exp ← 10
    Ecrire(base, "^", exp, " = ", Puissance(base, exp))
    Ecrire("3^5 = ", Puissance(3, 5))
    Ecrire("2^-3 = ", Puissance(2, -3))
Fin

// Calcul rapide de x^n en O(log n)
Fonction Puissance(x : Réel, n : Entier) : Réel
Début
    Si n = 0 Alors
        Retourner 1
    FinSi
    Si n < 0 Alors
        Retourner 1 / Puissance(x, -n)
    FinSi
    demi ← Puissance(x, n DIV 2)
    Si n MOD 2 = 0 Alors
        Retourner demi * demi
    Sinon
        Retourner x * demi * demi
    FinSi
Fin`,
  },
  {
    id: 'est-parfait',
    title: 'EstParfait(n)',
    signature: 'Fonction EstParfait(n : Entier) : Booléen',
    category: 'math',
    complexity: 'O(n)',
    space: 'O(1)',
    description:
      'Un entier est parfait s’il est égal à la somme de ses diviseurs propres (ex : 6 = 1 + 2 + 3, 28 = 1 + 2 + 4 + 7 + 14).',
    tags: ['Diviseurs', 'Classique Bac'],
    code: `Algorithme NombresParfaits
Début
    Ecrire("=== Nombres parfaits entre 1 et 500 ===")
    Pour n De 1 À 500 Faire
        Si EstParfait(n) Alors
            Ecrire(n, " est un nombre parfait !")
        FinSi
    FinPour
Fin

// Vérifie si n = somme de ses diviseurs stricts
Fonction EstParfait(n : Entier) : Booléen
Début
    Si n < 2 Alors
        Retourner Faux
    FinSi
    somme ← 1
    Pour i De 2 À n DIV 2 Faire
        Si n MOD i = 0 Alors
            somme ← somme + i
        FinSi
    FinPour
    Retourner somme = n
Fin`,
  },
  {
    id: 'conversion-base',
    title: 'Conversion Décimal → Binaire / Base B',
    signature: 'Fonction ConvBase(n, base : Entier) : Chaîne',
    category: 'math',
    complexity: 'O(log_B n)',
    space: 'O(log_B n)',
    description:
      'Convertit un entier décimal positif vers le binaire (base 2), l’octal (base 8) ou l’hexadécimal (base 16) par divisions successives.',
    tags: ['Bases', 'Binaire', 'Hexadécimal'],
    code: `Algorithme ConversionBase
Début
    n ← 2026
    Ecrire("Décimal     : ", n)
    Ecrire("Binaire (2) : ", ConvBase(n, 2))
    Ecrire("Octal (8)   : ", ConvBase(n, 8))
    Ecrire("Hexa (16)   : ", ConvBase(n, 16))
Fin

// Convertit un entier décimal n >= 0 vers toute base B (2 à 16)
Fonction ConvBase(n : Entier, base : Entier) : Chaîne
Début
    Si n = 0 Alors
        Retourner "0"
    FinSi
    chiffres ← "0123456789ABCDEF"
    res ← ""
    TantQue n > 0 Faire
        reste ← n MOD base
        res ← chiffres[reste + 1] + res
        n ← n DIV base
    FinTantQue
    Retourner res
Fin`,
  },

  // ======================== TABLEAUX & RECHERCHE ========================
  {
    id: 'remplir-tableau',
    title: 'Remplir(T, N)',
    signature: 'Procédure Remplir(@T : Tableau, N : Entier)',
    category: 'arrays',
    complexity: 'O(n)',
    space: 'O(1)',
    description:
      'Lit la taille N avec contrôle de saisie (Répéter...Jusqu’à) puis remplit un tableau T[1..N] de façon interactive.',
    tags: ['Interactif', 'Lire', 'Passage @'],
    requiresInput: true,
    code: `Algorithme RemplissageTableau
Début
    SaisirTaille(N)
    Remplir(T, N)
    Ecrire("Contenu du tableau saisi :")
    Afficher(T, N)
Fin

// Lecture contrôlée de la taille
Procédure SaisirTaille(@N : Entier)
Début
    Répéter
        Ecrire("Donner la taille N (entre 1 et 20) : ")
        Lire(N)
    Jusqu'à (N ≥ 1) ET (N ≤ 20)
Fin

// Remplissage interactif du tableau par référence
Procédure Remplir(@T : Tableau, N : Entier)
Début
    Pour i De 1 À N Faire
        Ecrire("Donner T[", i, "] : ")
        Lire(T[i])
    FinPour
Fin

Procédure Afficher(T : Tableau, N : Entier)
Début
    ligne ← "[ "
    Pour i De 1 À N Faire
        ligne ← ligne + ConvCh(T[i])
        Si i < N Alors ligne ← ligne + " | " FinSi
    FinPour
    Ecrire(ligne, " ]")
Fin`,
  },
  {
    id: 'afficher-tableau',
    title: 'Afficher(T, N)',
    signature: 'Procédure Afficher(T : Tableau, N : Entier)',
    category: 'arrays',
    complexity: 'O(n)',
    space: 'O(1)',
    description:
      'Parcourt et formate proprement l’affichage des N éléments d’un tableau avec leur somme et leur moyenne.',
    tags: ['Parcours', 'Tableau'],
    code: `Algorithme AfficherTableau
Début
    N ← 6
    T[1] ← 14 ; T[2] ← 18 ; T[3] ← 11 ; T[4] ← 16 ; T[5] ← 19 ; T[6] ← 12
    Afficher(T, N)

    somme ← 0
    Pour i De 1 À N Faire
        somme ← somme + T[i]
    FinPour
    Ecrire("Somme = ", somme, " | Moyenne = ", somme / N)
Fin

Procédure Afficher(T : Tableau, N : Entier)
Début
    ligne ← "["
    Pour i De 1 À N Faire
        ligne ← ligne + ConvCh(T[i])
        Si i < N Alors
            ligne ← ligne + ", "
        FinSi
    FinPour
    ligne ← ligne + "]"
    Ecrire("T = ", ligne)
Fin`,
  },
  {
    id: 'recherche-sequentielle',
    title: 'Recherche Séquentielle',
    signature: 'Fonction RechercheSeq(T : Tableau, N, x : Entier) : Entier',
    category: 'arrays',
    complexity: 'O(n)',
    space: 'O(1)',
    description:
      'Recherche une valeur cible x dans un tableau quelconque (trié ou non) avec arrêt anticipé dès qu’elle est trouvée.',
    tags: ['Recherche', 'TantQue'],
    code: `Algorithme DemoRechercheSequentielle
Début
    N ← 7
    T[1] ← 23 ; T[2] ← 8 ; T[3] ← 45 ; T[4] ← 12 ; T[5] ← 91 ; T[6] ← 17 ; T[7] ← 34
    Ecrire("Tableau : ", T)

    pos ← RechercheSeq(T, N, 91)
    Ecrire("Position de 91 : ", pos)

    pos ← RechercheSeq(T, N, 50)
    Ecrire("Position de 50 : ", pos, " (-1 = absent)")
Fin

// Retourne l'indice de x dans T[1..N], ou -1 si introuvable
Fonction RechercheSeq(T : Tableau, N : Entier, x : Entier) : Entier
Début
    i ← 1
    trouve ← Faux
    TantQue (i ≤ N) ET (NON trouve) Faire
        Si T[i] = x Alors
            trouve ← Vrai
        Sinon
            i ← i + 1
        FinSi
    FinTantQue
    Si trouve Alors
        Retourner i
    Sinon
        Retourner -1
    FinSi
Fin`,
  },
  {
    id: 'recherche-dichotomique',
    title: 'Recherche Dichotomique',
    signature: 'Fonction RechercheDicho(T : Tableau, N, x : Entier) : Entier',
    category: 'arrays',
    complexity: 'O(log n)',
    space: 'O(1)',
    description:
      'Recherche ultra-rapide sur tableau TRIÉ en divisant l’intervalle de recherche par 2 à chaque itération.',
    tags: ['Recherche', 'Tableau Trié', 'Classique Bac'],
    code: `Algorithme DemoRechercheDichotomique
Début
    N ← 8
    T[1] ← 4 ; T[2] ← 11 ; T[3] ← 18 ; T[4] ← 25 ; T[5] ← 33 ; T[6] ← 47 ; T[7] ← 62 ; T[8] ← 89
    Ecrire("Tableau trié : ", T)

    pos ← RechercheDicho(T, N, 47)
    Ecrire("Recherche de 47 -> indice ", pos)

    pos ← RechercheDicho(T, N, 20)
    Ecrire("Recherche de 20 -> indice ", pos, " (introuvable)")
Fin

// Exige un tableau T[1..N] trié par ordre croissant
Fonction RechercheDicho(T : Tableau, N : Entier, x : Entier) : Entier
Début
    debut ← 1
    fin ← N
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
Fin`,
  },
  {
    id: 'min-max',
    title: 'Min / Max d’un Tableau',
    signature: 'Procédure MinMax(T : Tableau, N : Entier, @posMin, @posMax : Entier)',
    category: 'arrays',
    complexity: 'O(n)',
    space: 'O(1)',
    description:
      'Détermine simultanément les valeurs et les indices du minimum et du maximum d’un tableau en un seul parcours.',
    tags: ['Parcours', 'Passage @'],
    code: `Algorithme RechercheMinMax
Début
    N ← 7
    T[1] ← 15 ; T[2] ← -4 ; T[3] ← 38 ; T[4] ← 0 ; T[5] ← 72 ; T[6] ← -12 ; T[7] ← 29
    MinMax(T, N, pMin, pMax)
    Ecrire("Tableau : ", T)
    Ecrire("Minimum = ", T[pMin], " à l'indice ", pMin)
    Ecrire("Maximum = ", T[pMax], " à l'indice ", pMax)
Fin

Procédure MinMax(T : Tableau, N : Entier, @posMin : Entier, @posMax : Entier)
Début
    posMin ← 1
    posMax ← 1
    Pour i De 2 À N Faire
        Si T[i] < T[posMin] Alors
            posMin ← i
        FinSi
        Si T[i] > T[posMax] Alors
            posMax ← i
        FinSi
    FinPour
Fin`,
  },
  {
    id: 'inverser-tableau',
    title: 'Inverser un Tableau',
    signature: 'Procédure Inverser(@T : Tableau, N : Entier)',
    category: 'arrays',
    complexity: 'O(n)',
    space: 'O(1)',
    description:
      'Inverse les éléments d’un tableau en place sans tableau auxiliaire en échangeant T[i] et T[N - i + 1].',
    tags: ['En place', 'Échange'],
    code: `Algorithme InverserUnTableau
Début
    N ← 6
    T[1] ← 10 ; T[2] ← 20 ; T[3] ← 30 ; T[4] ← 40 ; T[5] ← 50 ; T[6] ← 60
    Ecrire("Avant inversion : ", T)
    Inverser(T, N)
    Ecrire("Après inversion : ", T)
Fin

Procédure Echanger(@a : Entier, @b : Entier)
Début
    tmp ← a
    a ← b
    b ← tmp
Fin

// Inversion en place : N DIV 2 échanges suffisent
Procédure Inverser(@T : Tableau, N : Entier)
Début
    Pour i De 1 À N DIV 2 Faire
        Echanger(T[i], T[N - i + 1])
    FinPour
Fin`,
  },
  {
    id: 'insertion-suppression',
    title: 'Insertion / Suppression dans un Tableau',
    signature: 'Procédure Inserer(@T, @N, val, pos) & Supprimer(@T, @N, pos)',
    category: 'arrays',
    complexity: 'O(n)',
    space: 'O(1)',
    description:
      'Décalage à droite pour insérer une valeur à l’indice pos, et décalage à gauche pour supprimer un élément tout en mettant à jour N.',
    tags: ['Décalage', 'Classique Bac'],
    code: `Algorithme InsertionSuppression
Début
    N ← 5
    T[1] ← 10 ; T[2] ← 20 ; T[3] ← 30 ; T[4] ← 40 ; T[5] ← 50
    Ecrire("Initial :")
    Afficher(T, N)

    Inserer(T, N, 25, 3)
    Ecrire("Après insertion de 25 à l'indice 3 :")
    Afficher(T, N)

    Supprimer(T, N, 5)
    Ecrire("Après suppression de l'indice 5 :")
    Afficher(T, N)
Fin

// Insère val à la position pos (1..N+1) en décalant vers la droite
Procédure Inserer(@T : Tableau, @N : Entier, val : Entier, pos : Entier)
Début
    Pour i De N À pos Pas -1 Faire
        T[i + 1] ← T[i]
    FinPour
    T[pos] ← val
    N ← N + 1
Fin

// Supprime l'élément à la position pos (1..N) en décalant vers la gauche
Procédure Supprimer(@T : Tableau, @N : Entier, pos : Entier)
Début
    Pour i De pos À N - 1 Faire
        T[i] ← T[i + 1]
    FinPour
    N ← N - 1
Fin

Procédure Afficher(T : Tableau, N : Entier)
Début
    s ← "["
    Pour i De 1 À N Faire
        s ← s + ConvCh(T[i])
        Si i < N Alors s ← s + ", " FinSi
    FinPour
    Ecrire(s, "] (N=", N, ")")
Fin`,
  },

  // ======================== ALGORITHMES DE TRI ========================
  {
    id: 'tri-bulles',
    title: 'Tri à Bulles (Bubble Sort)',
    signature: 'Procédure TriBulles(@T : Tableau, N : Entier)',
    category: 'sorting',
    complexity: 'O(n²)',
    space: 'O(1)',
    description:
      'Compare les paires adjacentes et fait remonter les plus grands éléments à la fin. Optimisé avec un booléen permut (meilleur cas O(n)).',
    tags: ['Stable', 'En place', 'Classique Bac'],
    code: `Algorithme DemoTriBulles
Début
    N ← 7
    T[1] ← 64 ; T[2] ← 34 ; T[3] ← 25 ; T[4] ← 12 ; T[5] ← 22 ; T[6] ← 11 ; T[7] ← 90
    Ecrire("Avant Tri à Bulles : ", T)
    TriBulles(T, N)
    Ecrire("Après Tri à Bulles : ", T)
Fin

Procédure TriBulles(@T : Tableau, N : Entier)
Début
    borne ← N
    Répéter
        permut ← Faux
        Pour i De 1 À borne - 1 Faire
            Si T[i] > T[i + 1] Alors
                tmp ← T[i]
                T[i] ← T[i + 1]
                T[i + 1] ← tmp
                permut ← Vrai
            FinSi
        FinPour
        borne ← borne - 1
    Jusqu'à (NON permut) OU (borne ≤ 1)
Fin`,
  },
  {
    id: 'tri-selection',
    title: 'Tri par Sélection (Selection Sort)',
    signature: 'Procédure TriSelection(@T : Tableau, N : Entier)',
    category: 'sorting',
    complexity: 'O(n²)',
    space: 'O(1)',
    description:
      'À chaque étape i, recherche l’indice du minimum dans T[i..N] puis l’échange avec T[i]. Effectue au plus N - 1 échanges.',
    tags: ['En place', 'Classique Bac'],
    code: `Algorithme DemoTriSelection
Début
    N ← 7
    T[1] ← 29 ; T[2] ← 10 ; T[3] ← 14 ; T[4] ← 37 ; T[5] ← 13 ; T[6] ← 5 ; T[7] ← 42
    Ecrire("Avant Tri Sélection : ", T)
    TriSelection(T, N)
    Ecrire("Après Tri Sélection : ", T)
Fin

Procédure TriSelection(@T : Tableau, N : Entier)
Début
    Pour i De 1 À N - 1 Faire
        posMin ← i
        Pour j De i + 1 À N Faire
            Si T[j] < T[posMin] Alors
                posMin ← j
            FinSi
        FinPour
        Si posMin ≠ i Alors
            tmp ← T[i]
            T[i] ← T[posMin]
            T[posMin] ← tmp
        FinSi
    FinPour
Fin`,
  },
  {
    id: 'tri-insertion',
    title: 'Tri par Insertion (Insertion Sort)',
    signature: 'Procédure TriInsertion(@T : Tableau, N : Entier)',
    category: 'sorting',
    complexity: 'O(n²)',
    space: 'O(1)',
    description:
      'Insère chaque élément clé à sa position exacte dans la sous-partie gauche déjà triée. Optimal O(n) sur les tableaux presque triés.',
    tags: ['Stable', 'En place', 'Classique Bac'],
    code: `Algorithme DemoTriInsertion
Début
    N ← 7
    T[1] ← 42 ; T[2] ← 7 ; T[3] ← 19 ; T[4] ← 3 ; T[5] ← 25 ; T[6] ← 11 ; T[7] ← 1
    Ecrire("Avant Tri Insertion : ", T)
    TriInsertion(T, N)
    Ecrire("Après Tri Insertion : ", T)
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
Fin`,
  },
  {
    id: 'tri-shell',
    title: 'Tri Shell (Shell Sort)',
    signature: 'Procédure TriShell(@T : Tableau, N : Entier)',
    category: 'sorting',
    complexity: 'O(n^1.5)',
    space: 'O(1)',
    description:
      'Généralisation très efficace du tri par insertion utilisant la suite d’écarts de Knuth (h = 3h + 1) puis réduisant h ← h DIV 3 jusqu’à 1.',
    tags: ['Bac Tunisien', 'En place', 'Knuth'],
    code: `Algorithme DemoTriShell
Début
    N ← 8
    T[1] ← 55 ; T[2] ← 12 ; T[3] ← 89 ; T[4] ← 3 ; T[5] ← 34 ; T[6] ← 21 ; T[7] ← 8 ; T[8] ← 13
    Ecrire("Avant Tri Shell : ", T)
    TriShell(T, N)
    Ecrire("Après Tri Shell : ", T)
Fin

// Tri Shell avec suite de pas de Knuth (1, 4, 13, 40, ...)
Procédure TriShell(@T : Tableau, N : Entier)
Début
    h ← 1
    TantQue h < N DIV 3 Faire
        h ← 3 * h + 1
    FinTantQue

    TantQue h ≥ 1 Faire
        Pour i De h + 1 À N Faire
            cle ← T[i]
            j ← i - h
            TantQue (j ≥ 1) ET (T[j] > cle) Faire
                T[j + h] ← T[j]
                j ← j - h
            FinTantQue
            T[j + h] ← cle
        FinPour
        h ← h DIV 3
    FinTantQue
Fin`,
  },
  {
    id: 'tri-fusion',
    title: 'Tri Fusion (Merge Sort)',
    signature: 'Procédure TriFusion(@T : Tableau, g, d : Entier)',
    category: 'sorting',
    complexity: 'O(n log n)',
    space: 'O(n)',
    description:
      'Algorithme Diviser pour régner garantissant O(n log n) dans le pire cas : coupe le tableau en deux, trie récursivement puis fusionne.',
    tags: ['Diviser pour régner', 'Stable', 'Récursif'],
    code: `Algorithme DemoTriFusion
Début
    N ← 8
    T[1] ← 38 ; T[2] ← 27 ; T[3] ← 43 ; T[4] ← 3 ; T[5] ← 9 ; T[6] ← 82 ; T[7] ← 10 ; T[8] ← 15
    Ecrire("Avant Tri Fusion : ", T)
    TriFusion(T, 1, N)
    Ecrire("Après Tri Fusion : ", T)
Fin

// Fusionne deux sous-tableaux triés T[g..m] et T[m+1..d]
Procédure Fusionner(@T : Tableau, g : Entier, m : Entier, d : Entier)
Début
    i ← g ; j ← m + 1 ; k ← g
    TantQue (i ≤ m) ET (j ≤ d) Faire
        Si T[i] ≤ T[j] Alors
            Aux[k] ← T[i]
            i ← i + 1
        Sinon
            Aux[k] ← T[j]
            j ← j + 1
        FinSi
        k ← k + 1
    FinTantQue

    TantQue i ≤ m Faire
        Aux[k] ← T[i] ; i ← i + 1 ; k ← k + 1
    FinTantQue
    TantQue j ≤ d Faire
        Aux[k] ← T[j] ; j ← j + 1 ; k ← k + 1
    FinTantQue

    Pour k De g À d Faire
        T[k] ← Aux[k]
    FinPour
Fin

Procédure TriFusion(@T : Tableau, g : Entier, d : Entier)
Début
    Si g < d Alors
        m ← (g + d) DIV 2
        TriFusion(T, g, m)
        TriFusion(T, m + 1, d)
        Fusionner(T, g, m, d)
    FinSi
Fin`,
  },
  {
    id: 'tri-rapide',
    title: 'Tri Rapide (Quick Sort)',
    signature: 'Procédure TriRapide(@T : Tableau, g, d : Entier)',
    category: 'sorting',
    complexity: 'O(n log n)',
    space: 'O(log n)',
    description:
      'Partitionne le tableau autour d’un pivot (Lomuto) puis trie récursivement les deux sous-partitions en place.',
    tags: ['Diviser pour régner', 'En place', 'Récursif'],
    code: `Algorithme DemoTriRapide
Début
    N ← 8
    T[1] ← 50 ; T[2] ← 23 ; T[3] ← 9 ; T[4] ← 18 ; T[5] ← 61 ; T[6] ← 32 ; T[7] ← 4 ; T[8] ← 27
    Ecrire("Avant Tri Rapide : ", T)
    TriRapide(T, 1, N)
    Ecrire("Après Tri Rapide : ", T)
Fin

Procédure Echanger(@a : Entier, @b : Entier)
Début
    tmp ← a ; a ← b ; b ← tmp
Fin

// Partition de Lomuto : place le pivot T[d] à sa position définitive
Fonction Partition(@T : Tableau, g : Entier, d : Entier) : Entier
Début
    pivot ← T[d]
    i ← g - 1
    Pour j De g À d - 1 Faire
        Si T[j] ≤ pivot Alors
            i ← i + 1
            Echanger(T[i], T[j])
        FinSi
    FinPour
    Echanger(T[i + 1], T[d])
    Retourner i + 1
Fin

Procédure TriRapide(@T : Tableau, g : Entier, d : Entier)
Début
    Si g < d Alors
        p ← Partition(T, g, d)
        TriRapide(T, g, p - 1)
        TriRapide(T, p + 1, d)
    FinSi
Fin`,
  },

  // ======================== CHAÎNES DE CARACTÈRES ========================
  {
    id: 'palindrome',
    title: 'EstPalindrome(ch)',
    signature: 'Fonction EstPalindrome(ch : Chaîne) : Booléen',
    category: 'strings',
    complexity: 'O(n)',
    space: 'O(1)',
    description:
      'Vérifie si une chaîne se lit identiquement de gauche à droite et de droite à gauche (insensible à la casse grâce à Majus).',
    tags: ['Chaînes', 'Classique Bac'],
    code: `Algorithme VerifPalindrome
Début
    mot1 ← "Kayak"
    mot2 ← "Algorithme"
    Ecrire(mot1, " est palindrome ? ", EstPalindrome(mot1))
    Ecrire(mot2, " est palindrome ? ", EstPalindrome(mot2))
Fin

Fonction EstPalindrome(ch : Chaîne) : Booléen
Début
    m ← Majus(ch)
    g ← 1
    d ← Long(m)
    TantQue g < d Faire
        Si m[g] ≠ m[d] Alors
            Retourner Faux
        FinSi
        g ← g + 1
        d ← d - 1
    FinTantQue
    Retourner Vrai
Fin`,
  },
  {
    id: 'compter-voyelles',
    title: 'Compteur de Voyelles & Occurrences',
    signature: 'Fonction NbVoyelles(ch : Chaîne) : Entier',
    category: 'strings',
    complexity: 'O(n)',
    space: 'O(1)',
    description:
      'Compte le nombre de voyelles et d’occurrences d’un caractère dans une phrase en utilisant Majus() et Pos().',
    tags: ['Chaînes', 'Pos', 'Majus'],
    code: `Algorithme AnalyseChaine
Début
    phrase ← "Bac Informatique AlgoStudio"
    Ecrire("Phrase : ", phrase)
    Ecrire("Longueur : ", Long(phrase))
    Ecrire("Nombre de voyelles : ", NbVoyelles(phrase))
    Ecrire("Occurrences de 'a' : ", NbOccurrences(phrase, 'a'))
Fin

Fonction NbVoyelles(ch : Chaîne) : Entier
Début
    cpt ← 0
    Pour i De 1 À Long(ch) Faire
        c ← Majus(ch[i])
        Si Pos(c, "AEIOUY") > 0 Alors
            cpt ← cpt + 1
        FinSi
    FinPour
    Retourner cpt
Fin

Fonction NbOccurrences(ch : Chaîne, cible : Caractère) : Entier
Début
    cpt ← 0
    Pour i De 1 À Long(ch) Faire
        Si Majus(ch[i]) = Majus(cible) Alors
            cpt ← cpt + 1
        FinSi
    FinPour
    Retourner cpt
Fin`,
  },
  {
    id: 'inverser-chaine',
    title: 'InverserChaîne(ch) — Récursive',
    signature: 'Fonction InverserCh(ch : Chaîne) : Chaîne',
    category: 'strings',
    complexity: 'O(n)',
    space: 'O(n)',
    description:
      'Inverse une chaîne de caractères récursivement grâce à Sous_Chaine() et Long().',
    tags: ['Chaînes', 'Récursif', 'Sous_Chaine'],
    code: `Algorithme InversionChaine
Début
    texte ← "ALGOSTUDIO"
    Ecrire("Originale : ", texte)
    Ecrire("Inversée  : ", InverserCh(texte))
Fin

Fonction InverserCh(ch : Chaîne) : Chaîne
Début
    Si Long(ch) ≤ 1 Alors
        Retourner ch
    Sinon
        Retourner InverserCh(Sous_Chaine(ch, 2, Long(ch) - 1)) + ch[1]
    FinSi
Fin`,
  },

  // ======================== STRUCTURES & PARADIGMES (GUIDE §10-12) ========================
  {
    id: 'pile-lifo',
    title: 'Pile (LIFO — Empiler / Dépiler)',
    signature: 'Procédure Empiler(@P, @sommet, x) & Fonction Depiler(@P, @sommet)',
    category: 'advanced',
    complexity: 'O(1)',
    space: 'O(n)',
    description:
      'Structure Pile (Last In, First Out) tirée du Guide §10 : le dernier élément empilé est le premier retiré (appels récursifs, Ctrl+Z, parenthèses).',
    tags: ['Guide §10', 'LIFO', 'O(1)'],
    code: `Algorithme StructurePileLIFO
Début
    sommet ← 0
    Empiler(P, sommet, 10)
    Empiler(P, sommet, 25)
    Empiler(P, sommet, 40)
    Ecrire("Sommet actuel : ", SommetPile(P, sommet))
    TantQue sommet > 0 Faire
        Ecrire("Dépilé : ", Depiler(P, sommet))
    FinTantQue
Fin

Procédure Empiler(@P : Tableau, @sommet : Entier, x : Entier)
Début
    sommet ← sommet + 1
    P[sommet] ← x
Fin

Fonction Depiler(@P : Tableau, @sommet : Entier) : Entier
Début
    val ← P[sommet]
    sommet ← sommet - 1
    Retourner val
Fin

Fonction SommetPile(P : Tableau, sommet : Entier) : Entier
Début
    Retourner P[sommet]
Fin`,
  },
  {
    id: 'file-fifo',
    title: 'File (FIFO — Enfiler / Défiler)',
    signature: 'Procédure Enfiler(@F, @queue, x) & Fonction Defiler(@F, @tete)',
    category: 'advanced',
    complexity: 'O(1)',
    space: 'O(n)',
    description:
      'Structure File (First In, First Out) tirée du Guide §10 : le premier élément arrivé est le premier servi (files d’attente, imprimantes, parcours BFS).',
    tags: ['Guide §10', 'FIFO', 'O(1)'],
    code: `Algorithme StructureFileFIFO
Début
    tete ← 1 ; queue ← 0
    Enfiler(F, queue, "Client_1")
    Enfiler(F, queue, "Client_2")
    Enfiler(F, queue, "Client_3")
    TantQue tete ≤ queue Faire
        Ecrire("Service FIFO -> ", Defiler(F, tete))
    FinTantQue
Fin

Procédure Enfiler(@F : Tableau, @queue : Entier, elem : Chaîne)
Début
    queue ← queue + 1
    F[queue] ← elem
Fin

Fonction Defiler(@F : Tableau, @tete : Entier) : Chaîne
Début
    val ← F[tete]
    tete ← tete + 1
    Retourner val
Fin`,
  },
  {
    id: 'fibonacci-dp',
    title: 'Fibonacci (Programmation Dynamique)',
    signature: 'Fonction FibonacciDP(n : Entier) : Entier',
    category: 'advanced',
    complexity: 'O(n)',
    space: 'O(n)',
    description:
      'Paradigme Programmation Dynamique (Guide §12) : calcule Fibonacci en O(n) par tableau ascendant au lieu de O(2ⁿ) en récursif naïf.',
    tags: ['Guide §12', 'Prog. Dynamique', 'O(n)'],
    code: `Algorithme FibonacciDynamique
Début
    N ← 12
    Ecrire("=== Suite de Fibonacci (DP O(n)) ===")
    Pour i De 0 À N Faire
        Ecrire("F(", i, ") = ", FibonacciDP(i))
    FinPour
Fin

// Programmation dynamique ascendante en O(n)
Fonction FibonacciDP(n : Entier) : Entier
Début
    Si n ≤ 1 Alors
        Retourner n
    FinSi
    dp[0] ← 0
    dp[1] ← 1
    Pour k De 2 À n Faire
        dp[k] ← dp[k - 1] + dp[k - 2]
    FinPour
    Retourner dp[n]
Fin`,
  },
  {
    id: 'rendu-monnaie-glouton',
    title: 'Rendu de Monnaie (Algorithme Glouton)',
    signature: 'Algorithme RenduMonnaieGlouton',
    category: 'advanced',
    complexity: 'O(k)',
    space: 'O(1)',
    description:
      'Paradigme Glouton / Greedy (Guide §12) : choisit à chaque étape la plus grande coupure possible pour rendre un montant optimalement.',
    tags: ['Guide §12', 'Glouton', 'DIV/MOD'],
    code: `Algorithme RenduMonnaieGlouton
Début
    // Système monétaire canonique trié par ordre décroissant
    Pieces[1] ← 50 ; Pieces[2] ← 20 ; Pieces[3] ← 10
    Pieces[4] ← 5  ; Pieces[5] ← 2  ; Pieces[6] ← 1

    montant ← 88
    reste ← montant
    Ecrire("Rendu optimal pour ", montant, " DT :")

    Pour i De 1 À 6 Faire
        nb ← reste DIV Pieces[i]
        Si nb > 0 Alors
            Ecrire("  ", nb, " x billet/pièce de ", Pieces[i], " DT")
            reste ← reste MOD Pieces[i]
        FinSi
    FinPour
Fin`,
  },
];
