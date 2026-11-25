export interface CheatSheetTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface CheatSheetSnippet {
  title: string;
  code: string;
  runnableCode?: string;
}

export interface CheatSheetTopic {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  badge: string;
  keywords: string[];
  summary: string;
  keyPoints: string[];
  tables?: CheatSheetTable[];
  snippets: CheatSheetSnippet[];
  examTip: string;
}

export const CHEAT_SHEETS: CheatSheetTopic[] = [
  {
    id: 'structure-types',
    number: '01',
    title: 'Convention Bac, TDO & Types',
    subtitle: 'Structure officielle sans bloc Variables, TDO/TDNT, types et opérateurs',
    badge: 'Guide §1-2 + Bac',
    keywords: [
      'algorithme',
      'tdo',
      'tdnt',
      'finitude',
      'précision',
      'généralité',
      'efficacité',
      'entier',
      'réel',
      'chaîne',
      'caractère',
      'booléen',
      'div',
      'mod',
      'et',
      'ou',
      'non',
      'affectation',
      'priorité',
    ],
    summary:
      'Selon la convention du Bac Tunisien, on n’écrit PAS de bloc Variables au début de l’algorithme : le corps commence directement par Début ... Fin, et les objets (variables, constantes, modules) sont déclarés dans le TDO (Tableau de Déclaration des Objets) généré automatiquement dans l’onglet TDO de l’IDE.',
    keyPoints: [
      '4 propriétés d’un algorithme : Finitude, Précision, Généralité et Efficacité.',
      'Convention Bac : Algorithme Nom → Début → instructions → Fin, puis les Procédures/Fonctions après Fin.',
      'Affectation ← (tapez <- ou Alt+A). DIV = quotient entier (17 DIV 5 = 3), MOD = reste (17 MOD 5 = 2).',
      'Priorité : ( ) → ^ → NON → *, /, DIV, MOD → +, - → =, ≠, <, ≤, >, ≥ → ET → OU.',
    ],
    tables: [
      {
        caption: 'Les 5 types de données & Exemple de TDO (Bac Tunisien)',
        headers: ['Type', 'Description', 'Exemples de valeurs'],
        rows: [
          ['Entier', 'Nombres entiers relatifs (positifs, négatifs ou nul)', '-42, 0, 2026'],
          ['Réel', 'Nombres décimaux à virgule flottante', '3.14, -0.5, 12.0'],
          ['Caractère', 'Un seul symbole entre apostrophes', "'A', '7', '@'"],
          ['Chaîne', 'Suite de zéro ou plusieurs caractères', '"Bonjour", ""'],
          ['Booléen', 'Valeur logique de vérité', 'Vrai, Faux'],
        ],
      },
      {
        caption: 'Table de vérité des opérateurs logiques (NON → ET → OU)',
        headers: ['A', 'B', 'NON A', 'A ET B', 'A OU B'],
        rows: [
          ['Vrai', 'Vrai', 'Faux', 'Vrai', 'Vrai'],
          ['Vrai', 'Faux', 'Faux', 'Faux', 'Vrai'],
          ['Faux', 'Vrai', 'Vrai', 'Faux', 'Vrai'],
          ['Faux', 'Faux', 'Vrai', 'Faux', 'Faux'],
        ],
      },
    ],
    snippets: [
      {
        title: 'Structure officielle Bac (sans bloc Variables)',
        code: `Algorithme Surface_Cercle
Début
    PI ← 3.14159
    Ecrire("Donner le rayon : ")
    Lire(rayon)
    surface ← PI * rayon * rayon
    Ecrire("La surface est : ", surface)
    Ecrire("17 DIV 5 = ", 17 DIV 5, " | 17 MOD 5 = ", 17 MOD 5)
Fin`,
        runnableCode: `Algorithme Surface_Cercle
Début
    PI ← 3.14159
    Ecrire("Donner le rayon : ")
    Lire(rayon)
    surface ← PI * rayon * rayon
    Ecrire("La surface est : ", surface)
    Ecrire("17 DIV 5 = ", 17 DIV 5, " | 17 MOD 5 = ", 17 MOD 5)
Fin`,
      },
    ],
    examTip:
      'Sur votre copie du Bac, séparez toujours l’algorithme (Début...Fin) et le TDO (Objet | Type/Nature) placé juste en dessous.',
  },
  {
    id: 'conditionnelles',
    number: '02',
    title: 'Structures Conditionnelles',
    subtitle: 'Alternatives Si...Alors...Sinon et choix multiples Selon...FinSelon',
    badge: 'Guide §3',
    keywords: ['si', 'alors', 'sinon', 'sinon si', 'finsi', 'selon', 'finselon', 'condition', 'alternative'],
    summary:
      'Les structures conditionnelles orientent l’exécution selon la valeur Vrai ou Faux d’une condition (Si) ou testent plusieurs valeurs discrètes d’une variable (Selon).',
    keyPoints: [
      'Alternative simple : Si cond Alors ... FinSi.',
      'Alternative complète : Si cond Alors ... Sinon ... FinSi.',
      'Alternative imbriquée : Si ... Alors ... Sinon Si ... Alors ... Sinon ... FinSi.',
      'Selon : idéal pour tester plusieurs valeurs discrètes (6, 7) ou plages (1..5).',
    ],
    snippets: [
      {
        title: 'Si...Sinon & Selon (Guide §3)',
        code: `Algorithme DemoConditions
Début
    Ecrire("Donner la note (0..20) : ")
    Lire(note)
    Si note ≥ 10 Alors
        Ecrire("Admis")
    Sinon
        Ecrire("Ajourné")
    FinSi

    Ecrire("Donner le numéro du jour (1..7) : ")
    Lire(jour)
    Selon jour Faire
        1 : Ecrire("Lundi")
        2 : Ecrire("Mardi")
        6, 7 : Ecrire("Week-end")
        Sinon : Ecrire("Autre jour de la semaine")
    FinSelon
Fin`,
        runnableCode: `Algorithme DemoConditions
Début
    Ecrire("Donner la note (0..20) : ")
    Lire(note)
    Si note ≥ 10 Alors
        Ecrire("Admis")
    Sinon
        Ecrire("Ajourné")
    FinSi

    Ecrire("Donner le numéro du jour (1..7) : ")
    Lire(jour)
    Selon jour Faire
        1 : Ecrire("Lundi")
        2 : Ecrire("Mardi")
        6, 7 : Ecrire("Week-end")
        Sinon : Ecrire("Autre jour de la semaine")
    FinSelon
Fin`,
      },
    ],
    examTip:
      'Pour un intervalle [0, 20], écrivez toujours (note ≥ 0) ET (note ≤ 20). Raccourcis clavier : <= donne ≤ et >= donne ≥.',
  },
  {
    id: 'iteratives',
    number: '03',
    title: 'Structures Itératives (Boucles)',
    subtitle: 'Pour, TantQue, Répéter...Jusqu’à et critères de choix',
    badge: 'Guide §4',
    keywords: ['pour', 'de', 'a', 'pas', 'finpour', 'tantque', 'fintantque', 'répéter', "jusqu'à", 'boucle', 'saisie'],
    summary:
      'Le choix de la bonne boucle dépend du nombre d’itérations (connu ou non) et du moment où la condition est vérifiée (avant ou après).',
    keyPoints: [
      'Pour : nombre d’itérations connu (parcours de tableau, sommes). Pas négatif possible (Pas -1).',
      'TantQue : condition de maintien testée AVANT d’entrer (0 exécution possible).',
      'Répéter ... Jusqu’à : condition d’arrêt testée APRÈS le bloc (au moins 1 exécution : contrôle de saisie).',
    ],
    tables: [
      {
        caption: 'Comparatif des 3 boucles (Guide §4)',
        headers: ['Boucle', 'Test de condition', 'Nb min d’exécutions', 'Cas d’utilisation idéal'],
        rows: [
          ['Pour', 'Automatique (borne)', '0', 'Nombre d’itérations connu à l’avance (parcours de tableau)'],
          ['TantQue', 'Avant le bloc', '0', 'Nombre d’itérations inconnu ; peut ne jamais s’exécuter'],
          ["Répéter ... Jusqu'à", 'Après le bloc', '1', 'Doit s’exécuter au moins une fois (contrôle de saisie, menus)'],
        ],
      },
    ],
    snippets: [
      {
        title: 'Les 3 boucles classiques du Bac',
        code: `Algorithme DemoBoucles
Début
    // 1. Contrôle de saisie (Répéter ... Jusqu'à)
    Répéter
        Ecrire("Saisir un entier positif N : ")
        Lire(N)
    Jusqu'à N > 0

    // 2. Boucle Pour : somme de 1 à N
    somme ← 0
    Pour i De 1 À N Faire
        somme ← somme + i
    FinPour
    Ecrire("Somme de 1 à ", N, " = ", somme)

    // 3. Boucle TantQue : nombre de chiffres
    copie ← N ; nb ← 0
    TantQue copie > 0 Faire
        copie ← copie DIV 10
        nb ← nb + 1
    FinTantQue
    Ecrire("Nombre de chiffres = ", nb)
Fin`,
        runnableCode: `Algorithme DemoBoucles
Début
    Répéter
        Ecrire("Saisir un entier positif N : ")
        Lire(N)
    Jusqu'à N > 0

    somme ← 0
    Pour i De 1 À N Faire
        somme ← somme + i
    FinPour
    Ecrire("Somme de 1 à ", N, " = ", somme)

    copie ← N ; nb ← 0
    TantQue copie > 0 Faire
        copie ← copie DIV 10
        nb ← nb + 1
    FinTantQue
    Ecrire("Nombre de chiffres = ", nb)
Fin`,
      },
    ],
    examTip:
      'Dans TantQue la condition indique quand CONTINUER ; dans Jusqu’à la condition indique quand S’ARRÊTER.',
  },
  {
    id: 'tableaux-matrices',
    number: '04',
    title: 'Tableaux & Matrices',
    subtitle: 'Vecteurs 1D, matrices 2D, accès direct O(1) et parcours',
    badge: 'Guide §5',
    keywords: ['tableau', 'matrice', 'vecteur', 'indice', 'parcours', 'maximum', 'diagonale', '1d', '2d'],
    summary:
      'Un tableau stocke des éléments de même type accessibles directement en O(1) via leur indice T[i]. Une matrice possède deux indices : ligne i et colonne j (M[i, j]).',
    keyPoints: [
      'TDNT (Tableau des Nouveaux Types) : Tab = Tableau de N Entiers ; Mat = Tableau de L x C Entiers.',
      'Dans l’algorithme, on utilise directement T[i] et M[i, j] sans bloc Variables.',
      'Initialisez toujours max ou min avec T[1] et démarrez la boucle Pour à 2.',
      'Diagonale principale : i = j ; diagonale secondaire : i + j = N + 1.',
    ],
    snippets: [
      {
        title: 'Maximum d’un tableau & Somme d’une matrice',
        code: `Algorithme DemoTableauMatrice
Début
    T[1] ← 12 ; T[2] ← 45 ; T[3] ← 7 ; T[4] ← 89 ; T[5] ← 31
    max ← T[1]
    Pour i De 2 À 5 Faire
        Si T[i] > max Alors
            max ← T[i]
        FinSi
    FinPour
    Ecrire("Maximum de T = ", max)

    somme ← 0
    Pour i De 1 À 3 Faire
        Pour j De 1 À 3 Faire
            M[i, j] ← i * j
            somme ← somme + M[i, j]
        FinPour
    FinPour
    Ecrire("Somme matrice 3x3 = ", somme)
Fin`,
        runnableCode: `Algorithme DemoTableauMatrice
Début
    T[1] ← 12 ; T[2] ← 45 ; T[3] ← 7 ; T[4] ← 89 ; T[5] ← 31
    max ← T[1]
    Pour i De 2 À 5 Faire
        Si T[i] > max Alors
            max ← T[i]
        FinSi
    FinPour
    Ecrire("Maximum de T = ", max)

    somme ← 0
    Pour i De 1 À 3 Faire
        Pour j De 1 À 3 Faire
            M[i, j] ← i * j
            somme ← somme + M[i, j]
        FinPour
    FinPour
    Ecrire("Somme matrice 3x3 = ", somme)
Fin`,
      },
    ],
    examTip:
      'N’initialisez jamais un maximum à 0 : si tous les éléments sont négatifs, le résultat serait faux. Prenez toujours T[1].',
  },
  {
    id: 'chaines',
    number: '05',
    title: 'Chaînes de Caractères',
    subtitle: 'Toutes les fonctions standard : Long, Pos, Sous_Chaine, ConvCh, Valeur, Ord, Chr...',
    badge: 'Guide §5 + Bac',
    keywords: [
      'chaîne',
      'long',
      'longueur',
      'pos',
      'position',
      'sous_chaine',
      'souschaine',
      'efface',
      'insere',
      'convch',
      'valeur',
      'majus',
      'ord',
      'chr',
      'ascii',
    ],
    summary:
      'Une chaîne se manipule caractère par caractère via ch[i], par concaténation (+), et grâce aux 10 fonctions/procédures standard du Bac.',
    keyPoints: [
      'Concaténation : "Bac " + "Info" → "Bac Info".',
      'Codes ASCII à connaître : \'0\' = 48, \'A\' = 65, \'a\' = 97.',
      'AlgoStudio accepte ConvCh(n) ou ConvCh(n, ch), ainsi que Valeur(ch) ou Valeur(ch, x, err).',
    ],
    tables: [
      {
        caption: 'Table des fonctions & procédures sur les chaînes',
        headers: ['Opération', 'Rôle', 'Exemple', 'Résultat'],
        rows: [
          ['Long(ch)', 'Longueur de la chaîne', 'Long("Algo")', '4'],
          ['Pos(sous, ch)', 'Position de sous dans ch (0 si absente)', 'Pos("go", "Algo")', '3'],
          ['Sous_Chaine(ch, p, nb)', 'Extrait nb caractères depuis p', 'Sous_Chaine("BacInfo", 4, 4)', '"Info"'],
          ['Efface(ch, p, nb)', 'Supprime nb caractères depuis p', 'Efface("Bonjour", 4, 4)', '"Bon"'],
          ['Insere(s, ch, p)', 'Insère s dans ch à la position p', 'Insere("2026", "Bac ", 5)', '"Bac 2026"'],
          ['ConvCh(n) / ConvCh(n, ch)', 'Convertit un nombre en chaîne', 'ConvCh(2026)', '"2026"'],
          ['Valeur(ch) / Valeur(ch, x, e)', 'Convertit une chaîne en nombre', 'Valeur("42")', '42'],
          ['Majus(ch)', 'Convertit en MAJUSCULES', 'Majus("bac")', '"BAC"'],
          ['Ord(c)', 'Code ASCII du caractère c', "Ord('A')", '65'],
          ['Chr(code)', 'Caractère du code ASCII', 'Chr(65)', "'A'"],
        ],
      },
    ],
    snippets: [
      {
        title: 'Manipulation complète de chaînes',
        code: `Algorithme DemoChaines
Début
    ch ← "AlgoStudio Bac"
    p ← Pos("Studio", ch)
    mot ← Sous_Chaine(ch, p, 6)
    Ecrire("Long=", Long(ch), " | Extrait=", Majus(mot))
    ConvCh(2026, s)
    Valeur("18", v, err)
    Ecrire("Conv=", s, " | Val=", v, " | Chr(66)=", Chr(Ord('A') + 1))
Fin`,
        runnableCode: `Algorithme DemoChaines
Début
    ch ← "AlgoStudio Bac"
    p ← Pos("Studio", ch)
    mot ← Sous_Chaine(ch, p, 6)
    Ecrire("Long=", Long(ch), " | Extrait=", Majus(mot))
    ConvCh(2026, s)
    Valeur("18", v, err)
    Ecrire("Conv=", s, " | Val=", v, " | Chr(66)=", Chr(Ord('A') + 1))
Fin`,
      },
    ],
    examTip:
      'Pour tester si c est une majuscule : (c ≥ \'A\') ET (c ≤ \'Z\'). Pour un chiffre : (c ≥ \'0\') ET (c ≤ \'9\').',
  },
  {
    id: 'sous-programmes',
    number: '06',
    title: 'Modularité : Procédures & Fonctions',
    subtitle: 'Procédure vs Fonction, passage par Valeur vs Référence (@)',
    badge: 'Guide §6',
    keywords: ['procédure', 'fonction', 'retourner', 'valeur', 'référence', '@', 'var', 'local', 'echanger'],
    summary:
      'Une Fonction calcule et renvoie un résultat unique via Retourner ; une Procédure exécute une action ou modifie ses paramètres passés par référence (@).',
    keyPoints: [
      'Passage par Valeur (par défaut) : reçoit une copie, la variable appelante n’est pas modifiée.',
      'Passage par Référence (@x ou Var x) : reçoit l’adresse, toute modification est répercutée chez l’appelant.',
      'Les variables créées à l’intérieur d’un sous-programme sont locales (elles n’écrasent jamais les variables du programme principal).',
    ],
    tables: [
      {
        caption: 'Procédure vs Fonction & Modes de passage',
        headers: ['Concept', 'Syntaxe Bac', 'Comportement'],
        rows: [
          ['Fonction', 'Fonction F(n : Entier) : Booléen', 'Calcule et renvoie 1 valeur via Retourner'],
          ['Procédure', 'Procédure P(@T : Tableau, N : Entier)', 'Exécute une action sans retour direct'],
          ['Par Valeur', 'x : Entier', 'Copie locale protégée (entrée seule)'],
          ['Par Référence', '@x : Entier (ou Var x : Entier)', 'Modifie directement la variable appelante'],
        ],
      },
    ],
    snippets: [
      {
        title: 'Procédure Echanger(@a, @b) & Fonction EstPremier',
        code: `Algorithme DemoModularite
Début
    x ← 7 ; y ← 19
    Echanger(x, y)
    Ecrire("Après échange : x=", x, ", y=", y)
    Ecrire("EstPremier(", x, ") = ", EstPremier(x))
Fin

Procédure Echanger(@a : Entier, @b : Entier)
Début
    temp ← a ; a ← b ; b ← temp
Fin

Fonction EstPremier(n : Entier) : Booléen
Début
    Si n < 2 Alors Retourner Faux FinSi
    i ← 2
    TantQue i * i ≤ n Faire
        Si n MOD i = 0 Alors Retourner Faux FinSi
        i ← i + 1
    FinTantQue
    Retourner Vrai
Fin`,
        runnableCode: `Algorithme DemoModularite
Début
    x ← 7 ; y ← 19
    Echanger(x, y)
    Ecrire("Après échange : x=", x, ", y=", y)
    Ecrire("EstPremier(", x, ") = ", EstPremier(x))
Fin

Procédure Echanger(@a : Entier, @b : Entier)
Début
    temp ← a ; a ← b ; b ← temp
Fin

Fonction EstPremier(n : Entier) : Booléen
Début
    Si n < 2 Alors Retourner Faux FinSi
    i ← 2
    TantQue i * i ≤ n Faire
        Si n MOD i = 0 Alors Retourner Faux FinSi
        i ← i + 1
    FinTantQue
    Retourner Vrai
Fin`,
      },
    ],
    examTip:
      'Tout tableau rempli, inversé ou trié par une procédure DOIT porter @ devant son nom (@T : Tab).',
  },
  {
    id: 'recursivite',
    number: '07',
    title: 'La Récursivité',
    subtitle: 'Cas de base, cas récursif, pile d’appels et exponentiation rapide',
    badge: 'Guide §7',
    keywords: ['récursivité', 'cas de base', 'pile', 'stack overflow', 'factorielle', 'puissance'],
    summary:
      'Un module récursif s’appelle lui-même sur un sous-problème réduit. Il nécessite impérativement un cas de base (condition d’arrêt) et un appel récursif convergent.',
    keyPoints: [
      'Cas de base : stoppe les appels (ex : n ≤ 1 pour Factorielle).',
      'Cas récursif : réduit le paramètre (n - 1 ou n DIV 2) vers le cas de base.',
      'Sans condition d’arrêt atteignable → Stack Overflow (débordement de pile).',
    ],
    snippets: [
      {
        title: 'Factorielle & Puissance rapide O(log n)',
        code: `Algorithme DemoRecursivite
Début
    Ecrire("6! = ", Factorielle(6))
    Ecrire("2^10 = ", Puissance(2, 10))
Fin

Fonction Factorielle(n : Entier) : Entier
Début
    Si n ≤ 1 Alors
        Retourner 1
    Sinon
        Retourner n * Factorielle(n - 1)
    FinSi
Fin

Fonction Puissance(x : Réel, n : Entier) : Réel
Début
    Si n = 0 Alors Retourner 1 FinSi
    demi ← Puissance(x, n DIV 2)
    Si n MOD 2 = 0 Alors
        Retourner demi * demi
    Sinon
        Retourner x * demi * demi
    FinSi
Fin`,
        runnableCode: `Algorithme DemoRecursivite
Début
    Ecrire("6! = ", Factorielle(6))
    Ecrire("2^10 = ", Puissance(2, 10))
Fin

Fonction Factorielle(n : Entier) : Entier
Début
    Si n ≤ 1 Alors
        Retourner 1
    Sinon
        Retourner n * Factorielle(n - 1)
    FinSi
Fin

Fonction Puissance(x : Réel, n : Entier) : Réel
Début
    Si n = 0 Alors Retourner 1 FinSi
    demi ← Puissance(x, n DIV 2)
    Si n MOD 2 = 0 Alors
        Retourner demi * demi
    Sinon
        Retourner x * demi * demi
    FinSi
Fin`,
      },
    ],
    examTip:
      'Pour tracer une fonction récursive au Bac : dessinez la descente (empilement) puis la remontée (calcul des retours).',
  },
  {
    id: 'enregistrements-fichiers',
    number: '08',
    title: 'Enregistrements & Fichiers',
    subtitle: 'Structures hétérogènes, fichiers texte et fichiers typés',
    badge: 'Guide §5 + Bac',
    keywords: ['enregistrement', 'type', 'champ', 'fichier', 'texte', 'typé', 'ouvrir', 'fermer', 'finfichier'],
    summary:
      'Un enregistrement regroupe plusieurs champs de types différents (ex : e.nom, e.moyenne). Les fichiers sauvegardent durablement les données sur disque.',
    keyPoints: [
      'Notation pointée : classe[i].nom, classe[i].moyenne.',
      'Fichier texte : Ouvrir → TantQue NON FinFichier(F) Faire LireLigne(F, ligne) → Fermer(F).',
      'Fichier typé : lecture/écriture directe d’enregistrements via Lire(F, e) et Ecrire(F, e).',
    ],
    tables: [
      {
        caption: 'Fichiers texte vs Fichiers typés',
        headers: ['Type', 'Ouverture', 'Lecture / Écriture', 'Fin & Fermeture'],
        rows: [
          ['Fichier Texte', 'Ouvrir("f.txt", F, "r" | "w" | "a")', 'LireLigne(F, ch) / EcrireLigne(F, ch)', 'FinFichier(F), Fermer(F)'],
          ['Fichier Typé', 'Ouvrir("f.dat", F, "rb" | "wb")', 'Lire(F, e) / Ecrire(F, e)', 'FinFichier(F), Fermer(F)'],
        ],
      },
    ],
    snippets: [
      {
        title: 'Tableau d’enregistrements (Convention Bac sans bloc Variables)',
        code: `Algorithme DemoEnregistrement
Début
    classe[1].nom ← "Yasmine" ; classe[1].age ← 18 ; classe[1].moyenne ← 18.5
    classe[2].nom ← "Amine"   ; classe[2].age ← 17 ; classe[2].moyenne ← 16.0
    classe[3].nom ← "Sami"    ; classe[3].age ← 18 ; classe[3].moyenne ← 15.25
    Pour i De 1 À 3 Faire
        Ecrire(classe[i].nom, " (", classe[i].age, " ans) : ", classe[i].moyenne, "/20")
    FinPour
Fin`,
        runnableCode: `Algorithme DemoEnregistrement
Début
    classe[1].nom ← "Yasmine" ; classe[1].age ← 18 ; classe[1].moyenne ← 18.5
    classe[2].nom ← "Amine"   ; classe[2].age ← 17 ; classe[2].moyenne ← 16.0
    classe[3].nom ← "Sami"    ; classe[3].age ← 18 ; classe[3].moyenne ← 15.25
    Pour i De 1 À 3 Faire
        Ecrire(classe[i].nom, " (", classe[i].age, " ans) : ", classe[i].moyenne, "/20")
    FinPour
Fin`,
      },
    ],
    examTip:
      'N’oubliez jamais Fermer(F) ! Mode "w" écrase le fichier, mode "a" ajoute à la fin.',
  },
  {
    id: 'tris-recherche',
    number: '09',
    title: 'Recherche & Algorithmes de Tri',
    subtitle: 'Séquentielle, Dichotomique, Bulles, Sélection, Insertion, Shell, Fusion et Rapide',
    badge: 'Guide §8-9',
    keywords: ['tri', 'bulles', 'sélection', 'insertion', 'shell', 'fusion', 'rapide', 'recherche', 'séquentielle', 'dichotomique', 'stable'],
    summary:
      'Les tris élémentaires en O(n²) sont simples pour de petits tableaux ; les tris avancés atteignent O(n log n). Un tableau trié autorise la recherche dichotomique en O(log n).',
    keyPoints: [
      'Recherche séquentielle : O(n), tableau quelconque.',
      'Recherche dichotomique : O(log n), tableau TRIÉ obligatoire (20 comparaisons max pour 1 million d’éléments).',
      'Tri Fusion : garanti O(n log n) et stable, mémoire O(n).',
      'Tri Rapide : très rapide en place O(n log n) en moyenne, O(n²) dans le pire cas.',
    ],
    tables: [
      {
        caption: 'Comparatif complet des Tris & Recherches (Guide §8-9)',
        headers: ['Algorithme', 'Meilleur cas', 'Cas moyen', 'Pire cas', 'Mémoire', 'Stable'],
        rows: [
          ['Tri à bulles', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'Oui'],
          ['Tri par sélection', 'O(n²)', 'O(n²)', 'O(n²)', 'O(1)', 'Non'],
          ['Tri par insertion', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'Oui'],
          ['Tri Shell', 'O(n log n)', 'O(n^1.5)', 'O(n²)', 'O(1)', 'Non'],
          ['Tri fusion (Merge)', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', 'Oui'],
          ['Tri rapide (Quick)', 'O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'Non'],
          ['Recherche séquentielle', 'O(1)', 'O(n)', 'O(n)', 'O(1)', 'Tableau quelconque'],
          ['Recherche dichotomique', 'O(1)', 'O(log n)', 'O(log n)', 'O(1)', 'Tableau TRIÉ'],
        ],
      },
    ],
    snippets: [
      {
        title: 'Tri par Insertion (Convention Bac)',
        code: `Procédure TriInsertion(@T : Tableau, N : Entier)
Début
    Pour i De 2 À N Faire
        cle ← T[i] ; j ← i - 1
        TantQue (j ≥ 1) ET (T[j] > cle) Faire
            T[j + 1] ← T[j] ; j ← j - 1
        FinTantQue
        T[j + 1] ← cle
    FinPour
Fin`,
      },
    ],
    examTip:
      'Retrouvez tous les algorithmes de tri prêts à lancer en 1 clic dans l’onglet Modules Usuels.',
  },
  {
    id: 'structures-dynamiques',
    number: '10',
    title: 'Structures Dynamiques & Graphes',
    subtitle: 'Listes chaînées, Piles (LIFO), Files (FIFO), Arbres ABR et parcours BFS/DFS',
    badge: 'Guide §10',
    keywords: [
      'liste chaînée',
      'pointeur',
      'nil',
      'pile',
      'lifo',
      'empiler',
      'dépiler',
      'file',
      'fifo',
      'enfiler',
      'défiler',
      'arbre',
      'abr',
      'préfixe',
      'infixe',
      'postfixe',
      'graphe',
      'bfs',
      'dfs',
    ],
    summary:
      'Les structures dynamiques (pointeurs) allouent la mémoire selon les besoins. Piles, Files, Arbres et Graphes modélisent les problèmes avancés du Guide.',
    keyPoints: [
      'Liste chaînée : nœuds (valeur + suivant → NIL). Insertion tête O(1), accès k-ième O(n).',
      'Pile (LIFO) : Empiler, Dépiler, Sommet en O(1) — récursivité, Ctrl+Z, parenthèses.',
      'File (FIFO) : Enfiler, Défiler en O(1) — files d’attente, BFS.',
      'ABR : parcours Infixe (Gauche → Racine → Droite) affiche les clés dans l’ordre croissant.',
    ],
    tables: [
      {
        caption: 'Parcours d’Arbres Binaires & Graphes (Guide §10)',
        headers: ['Structure / Parcours', 'Ordre / Outil', 'Usage principal'],
        rows: [
          ['Arbre — Préfixe', 'Racine → Gauche → Droite', 'Copier ou sérialiser un arbre'],
          ['Arbre — Infixe', 'Gauche → Racine → Droite', 'Afficher un ABR dans l’ordre croissant'],
          ['Arbre — Postfixe', 'Gauche → Droite → Racine', 'Libérer la mémoire / évaluer une expression'],
          ['Graphe — BFS (Largeur)', 'Utilise une File (FIFO)', 'Plus court chemin (graphe non pondéré)'],
          ['Graphe — DFS (Profondeur)', 'Utilise une Pile / Récursivité', 'Détecter des cycles, composantes connexes'],
        ],
      },
    ],
    snippets: [
      {
        title: 'Simulation d’une Pile (LIFO)',
        code: `Algorithme DemoPileLIFO
Début
    sommet ← 0
    Empiler(P, sommet, 10) ; Empiler(P, sommet, 20) ; Empiler(P, sommet, 30)
    Ecrire("Dépilé (LIFO) : ", Depiler(P, sommet), ", puis ", Depiler(P, sommet))
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
Fin`,
        runnableCode: `Algorithme DemoPileLIFO
Début
    sommet ← 0
    Empiler(P, sommet, 10) ; Empiler(P, sommet, 20) ; Empiler(P, sommet, 30)
    Ecrire("Dépilé (LIFO) : ", Depiler(P, sommet), ", puis ", Depiler(P, sommet))
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
Fin`,
      },
    ],
    examTip:
      'Graphe G = (S, A) : Matrice d’adjacence → accès O(1), espace O(S²). Listes d’adjacence → espace optimal O(S + A).',
  },
  {
    id: 'complexite',
    number: '11',
    title: 'Analyse de Complexité (Grand O)',
    subtitle: 'Hiérarchie O(1) à O(2ⁿ) et règles pratiques de calcul',
    badge: 'Guide §11',
    keywords: ['complexité', 'grand o', 'o(1)', 'o(log n)', 'o(n)', 'o(n log n)', 'o(n²)', 'o(2^n)'],
    summary:
      'La notation O(f(n)) exprime la borne supérieure dans le pire cas en ignorant constantes multiplicatives et termes de moindre degré (3n² + 5n + 2 = O(n²)).',
    keyPoints: [
      'Blocs séquentiels : addition → on garde le terme dominant : O(n) + O(n²) = O(n²).',
      'Boucles imbriquées de taille n : multiplication → O(n) × O(n) = O(n²).',
      'Division par 2 à chaque étape (dichotomie, puissance rapide) → O(log n).',
    ],
    tables: [
      {
        caption: 'Classes de complexité (Guide §11)',
        headers: ['Complexité', 'Nom', 'Performance', 'Exemples typiques'],
        rows: [
          ['O(1)', 'Constante', 'Instantanée', 'Accès à T[i], Empiler / Dépiler dans une pile'],
          ['O(log n)', 'Logarithmique', 'Excellente', 'Recherche dichotomique, ABR équilibré'],
          ['O(n)', 'Linéaire', 'Très bonne', 'Parcours simple d’un tableau, maximum'],
          ['O(n log n)', 'Quasi-linéaire', 'Bonne', 'Tri fusion, tri rapide (moyenne)'],
          ['O(n²)', 'Quadratique', 'Lente si n grand', 'Deux boucles imbriquées, bulles, insertion'],
          ['O(2ⁿ)', 'Exponentielle', 'Très coûteuse', 'Fibonacci récursif naïf, sous-ensembles'],
        ],
      },
    ],
    snippets: [
      {
        title: 'Comparer O(n) vs O(n²)',
        code: `// O(n) : une seule boucle
Pour i De 1 À N Faire
    somme ← somme + T[i]
FinPour

// O(n²) : deux boucles imbriquées
Pour i De 1 À N Faire
    Pour j De 1 À N Faire
        cpt ← cpt + 1
    FinPour
FinPour`,
      },
    ],
    examTip:
      'Pour justifier la complexité, comptez toujours le nombre d’itérations de la boucle la plus imbriquée.',
  },
  {
    id: 'paradigmes-methodologie',
    number: '12',
    title: 'Paradigmes & Méthodologie Bac',
    subtitle: 'Diviser pour régner, Glouton, Prog. Dynamique, Backtracking & Méthode en 5 étapes',
    badge: 'Guide §12',
    keywords: [
      'paradigme',
      'diviser pour régner',
      'glouton',
      'programmation dynamique',
      'backtracking',
      'méthodologie',
      'trace',
      'fibonacci',
    ],
    summary:
      'Quatre grandes stratégies permettent de résoudre les problèmes complexes, associées à la méthode en 5 étapes du Guide pour réussir tout sujet d’algorithmique.',
    keyPoints: [
      'Diviser pour régner : découper, résoudre récursivement, combiner (Tri fusion, Tri rapide, Dichotomie).',
      'Glouton (Greedy) : choix localement optimal à chaque étape (rendu de monnaie, Dijkstra).',
      'Programmation dynamique : mémoriser les sous-problèmes déjà calculés (Fibonacci O(n), sac à dos).',
      'Backtracking : explorer et abandonner dès qu’une contrainte échoue (Sudoku, N reines).',
    ],
    tables: [
      {
        caption: 'Méthodologie en 5 étapes (Guide §12)',
        headers: ['Étape', 'Action', 'Vérification clé'],
        rows: [
          ['1. Comprendre', 'Identifier entrées, sorties et contraintes', 'Taille max, valeurs négatives/nulles'],
          ['2. Exemple main', 'Simuler avec 3 ou 4 valeurs sur brouillon', 'Repérer cas limites (vide, doublons)'],
          ['3. Structure', 'Choisir variable, tableau, matrice, pile ou file', 'Adapter aux opérations fréquentes'],
          ['4. Pseudocode', 'Rédiger Début...Fin + TDO proprement', 'Vérifier conditions d’arrêt des boucles'],
          ['5. Trace', 'Dérouler ligne par ligne avec tableau de trace', 'Valider exactitude et complexité'],
        ],
      },
    ],
    snippets: [
      {
        title: 'Programmation Dynamique : Fibonacci en O(n)',
        code: `Algorithme FibonacciDP
Début
    N ← 15
    F[0] ← 0 ; F[1] ← 1
    Pour i De 2 À N Faire
        F[i] ← F[i - 1] + F[i - 2]
    FinPour
    Ecrire("Fib(", N, ") = ", F[N])
Fin`,
        runnableCode: `Algorithme FibonacciDP
Début
    N ← 15
    F[0] ← 0 ; F[1] ← 1
    Pour i De 2 À N Faire
        F[i] ← F[i - 1] + F[i - 2]
    FinPour
    Ecrire("Fib(", N, ") = ", F[N])
Fin`,
      },
    ],
    examTip:
      'Utilisez l’onglet « TDO & Trace » de l’IDE pour vérifier automatiquement votre TDO et votre trace d’exécution !',
  },
];
