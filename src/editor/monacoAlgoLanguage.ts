import 'monaco-editor/esm/vs/editor/editor.all';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Configure local monaco-editor worker (zero external CDN requests)
if (typeof self !== 'undefined') {
  (self as unknown as { MonacoEnvironment?: { getWorker: () => Worker } }).MonacoEnvironment = {
    getWorker() {
      return new editorWorker();
    },
  };
}

loader.config({ monaco });

export const ALGO_LANGUAGE_ID = 'algostudio';
export const ALGO_DARK_THEME_ID = 'algostudio-dark';
export const ALGO_LIGHT_THEME_ID = 'algostudio-light';

let registered = false;

export function registerAlgoLanguage(): void {
  if (registered) return;
  registered = true;

  monaco.languages.register({
    id: ALGO_LANGUAGE_ID,
    extensions: ['.algo'],
    aliases: ['AlgoStudio', 'Pseudocode', 'Algorithme'],
  });

  monaco.languages.setLanguageConfiguration(ALGO_LANGUAGE_ID, {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['(', ')'],
      ['[', ']'],
      ['{', '}'],
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '{', close: '}' },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    indentationRules: {
      increaseIndentPattern:
        /^\s*(Début|Debut|Variables?|Constantes?|Types?|Alors|Sinon|Faire|Répéter|Repeter|Enregistrement|Si\b.*\bAlors|Pour\b.*\bFaire|TantQue\b.*\bFaire|Selon\b.*\bFaire)\s*$/i,
      decreaseIndentPattern:
        /^\s*(Fin|FinSi|Fin\s+Si|FinPour|Fin\s+Pour|FinTantQue|Fin\s+TantQue|FinSelon|Fin\s+Selon|FinFonction|Fin\s+Fonction|FinProcédure|FinProcedure|FinEnregistrement|Sinon|SinonSi|Sinon\s+Si|Jusqu'à|Jusqu'a|Jusqua)\b/i,
    },
  });

  monaco.languages.setMonarchTokensProvider(ALGO_LANGUAGE_ID, {
    ignoreCase: true,
    defaultToken: '',
    tokenPostfix: '.algo',

    structureKeywords: [
      'Algorithme',
      'Constantes',
      'Constante',
      'Types',
      'Type',
      'Variables',
      'Variable',
      'Début',
      'Debut',
      'Fin',
      'Procédure',
      'Procedure',
      'FinProcédure',
      'FinProcedure',
      'Fonction',
      'FinFonction',
      'Retourner',
      'Retourne',
      'Enregistrement',
      'FinEnregistrement',
    ],

    controlKeywords: [
      'Si',
      'Alors',
      'Sinon',
      'SinonSi',
      'FinSi',
      'Selon',
      'FinSelon',
      'Pour',
      'De',
      'A',
      'À',
      'Pas',
      'Faire',
      'FinPour',
      'TantQue',
      'FinTantQue',
      'Répéter',
      'Repeter',
      "Jusqu'à",
      "Jusqu'a",
      'Jusqua',
    ],

    typeKeywords: [
      'Tableau',
      'Entier',
      'Réel',
      'Reel',
      'Chaîne',
      'Chaine',
      'Caractère',
      'Caractere',
      'Booléen',
      'Booleen',
      'Var',
    ],

    boolLiterals: ['Vrai', 'Faux'],

    wordOperators: ['Mod', 'Div', 'ET', 'OU', 'NON'],

    builtinFunctions: [
      'Ecrire',
      'Écrire',
      'EcrireLn',
      'Afficher',
      'Lire',
      'Long',
      'Longueur',
      'Sous_Chaine',
      'SousChaine',
      'Pos',
      'Position',
      'ConvCh',
      'Valeur',
      'Efface',
      'Insere',
      'Inserer',
      'Majus',
      'Majuscule',
      'Minus',
      'Minuscule',
      'Concat',
      'EstNum',
      'Ord',
      'Chr',
      'Abs',
      'Racine',
      'Sqrt',
      'Arrondi',
      'Ent',
      'Tronc',
      'Alea',
      'Aléa',
      'Hasard',
      'Min',
      'Max',
      'Puiss',
    ],

    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/#.*$/, 'comment'],
        [/\/\*/, 'comment', '@commentBlock'],
        [/\{[^}]*\}/, 'comment'],

        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string.char'],

        [/\bJusqu'[àa]\b/i, 'keyword.control'],

        [/←|:=|<-/, 'operator.assign'],
        [/≠|≤|≥|<>|!=|<=|>=/, 'operator.compare'],
        [/@/, 'keyword.ref'],
        [/\.\./, 'delimiter.range'],
        [/[+\-*/^=<>]/, 'operator'],

        [/\b\d+\.\d+\b/, 'number.float'],
        [/\b\d+\b/, 'number'],

        [
          /[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*/,
          {
            cases: {
              '@structureKeywords': 'keyword.structure',
              '@controlKeywords': 'keyword.control',
              '@typeKeywords': 'type',
              '@boolLiterals': 'constant.boolean',
              '@wordOperators': 'operator.word',
              '@builtinFunctions': 'predefined',
              '@default': 'identifier',
            },
          },
        ],

        [/[()[\],:;]/, 'delimiter'],
      ],

      commentBlock: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
    },
  });

  // Dark Theme
  monaco.editor.defineTheme(ALGO_DARK_THEME_ID, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword.structure', foreground: 'FF3B47', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: 'FF6B57', fontStyle: 'bold' },
      { token: 'keyword.ref', foreground: 'FF2A2A', fontStyle: 'bold' },
      { token: 'type', foreground: 'C084FC', fontStyle: 'bold' },
      { token: 'constant.boolean', foreground: '34D399', fontStyle: 'bold' },
      { token: 'operator.assign', foreground: 'FF2A2A', fontStyle: 'bold' },
      { token: 'operator.compare', foreground: 'FBBF24' },
      { token: 'operator.word', foreground: 'FBBF24', fontStyle: 'bold' },
      { token: 'operator', foreground: 'E2E8F0' },
      { token: 'predefined', foreground: '38BDF8', fontStyle: 'bold' },
      { token: 'string', foreground: '86EFAC' },
      { token: 'string.char', foreground: '6EE7B7' },
      { token: 'number', foreground: 'FDE047' },
      { token: 'number.float', foreground: 'FDE047' },
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'identifier', foreground: 'F4F4F8' },
      { token: 'delimiter', foreground: '94A3B8' },
      { token: 'delimiter.range', foreground: 'F472B6' },
    ],
    colors: {
      'editor.background': '#0E0E14',
      'editor.foreground': '#F4F4F8',
      'editor.lineHighlightBackground': '#171722',
      'editor.lineHighlightBorder': '#232334',
      'editorCursor.foreground': '#FF2A2A',
      'editor.selectionBackground': '#E5091445',
      'editor.inactiveSelectionBackground': '#E5091422',
      'editorLineNumber.foreground': '#4B4B63',
      'editorLineNumber.activeForeground': '#FF4D57',
      'editorIndentGuide.background1': '#1D1D2A',
      'editorIndentGuide.activeBackground1': '#36364D',
      'editorGutter.background': '#0B0B0F',
      'editorWidget.background': '#14141B',
      'editorWidget.border': '#262635',
      'editorSuggestWidget.background': '#14141B',
      'editorSuggestWidget.border': '#2A2A3B',
      'editorSuggestWidget.selectedBackground': '#E5091433',
      'editorSuggestWidget.highlightForeground': '#FF4D57',
    },
  });

  // Light Theme (Crisp, high-contrast academic light mode)
  monaco.editor.defineTheme(ALGO_LIGHT_THEME_ID, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword.structure', foreground: 'C80815', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: 'C2410C', fontStyle: 'bold' },
      { token: 'keyword.ref', foreground: 'DC0915', fontStyle: 'bold' },
      { token: 'type', foreground: '7C3AED', fontStyle: 'bold' },
      { token: 'constant.boolean', foreground: '059669', fontStyle: 'bold' },
      { token: 'operator.assign', foreground: 'DC0915', fontStyle: 'bold' },
      { token: 'operator.compare', foreground: 'B45309', fontStyle: 'bold' },
      { token: 'operator.word', foreground: 'B45309', fontStyle: 'bold' },
      { token: 'operator', foreground: '334155' },
      { token: 'predefined', foreground: '0369A1', fontStyle: 'bold' },
      { token: 'string', foreground: '15803D' },
      { token: 'string.char', foreground: '047857' },
      { token: 'number', foreground: 'A16207' },
      { token: 'number.float', foreground: 'A16207' },
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'identifier', foreground: '0F172A' },
      { token: 'delimiter', foreground: '475569' },
      { token: 'delimiter.range', foreground: 'BE185D' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#0F172A',
      'editor.lineHighlightBackground': '#F8FAFC',
      'editor.lineHighlightBorder': '#E2E8F0',
      'editorCursor.foreground': '#DC0915',
      'editor.selectionBackground': '#E5091426',
      'editor.inactiveSelectionBackground': '#E5091414',
      'editorLineNumber.foreground': '#94A3B8',
      'editorLineNumber.activeForeground': '#DC0915',
      'editorIndentGuide.background1': '#E2E8F0',
      'editorIndentGuide.activeBackground1': '#CBD5E1',
      'editorGutter.background': '#F8FAFC',
      'editorWidget.background': '#FFFFFF',
      'editorWidget.border': '#CBD5E1',
      'editorSuggestWidget.background': '#FFFFFF',
      'editorSuggestWidget.border': '#CBD5E1',
      'editorSuggestWidget.selectedBackground': '#FEE2E2',
      'editorSuggestWidget.highlightForeground': '#DC0915',
    },
  });

  // Auto-completion snippets in authentic Bac Tunisien style (no Variables block required!)
  monaco.languages.registerCompletionItemProvider(ALGO_LANGUAGE_ID, {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = [
        {
          label: 'Algorithme (Bac Tunisien)',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ['Algorithme ${1:Nom}', 'Début', '    $0', 'Fin'].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Structure officielle Bac Tunisien (sans bloc Variables)',
          range,
        },
        {
          label: 'Si...Alors...FinSi',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ['Si ${1:condition} Alors', '    $0', 'FinSi'].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Structure conditionnelle simple',
          range,
        },
        {
          label: 'Si...Sinon...FinSi',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'Si ${1:condition} Alors',
            '    ${2:// instructions}',
            'Sinon',
            '    $0',
            'FinSi',
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Structure conditionnelle complète',
          range,
        },
        {
          label: 'Selon...FinSelon',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'Selon ${1:variable} Faire',
            '    ${2:1} : ${3:Ecrire("Cas 1")}',
            '    Sinon : ${4:Ecrire("Autre")}',
            'FinSelon',
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Structure à choix multiples',
          range,
        },
        {
          label: 'Pour...FinPour',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ['Pour ${1:i} De ${2:1} À ${3:N} Faire', '    $0', 'FinPour'].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Boucle Pour avec compteur',
          range,
        },
        {
          label: 'TantQue...FinTantQue',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ['TantQue ${1:condition} Faire', '    $0', 'FinTantQue'].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Boucle conditionnelle pré-testée',
          range,
        },
        {
          label: "Répéter...Jusqu'à",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ['Répéter', '    $0', "Jusqu'à ${1:condition}"].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Boucle post-testée (contrôle de saisie)',
          range,
        },
        {
          label: 'Fonction (Bac Tunisien)',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'Fonction ${1:Nom}(${2:n} : ${3:Entier}) : ${4:Entier}',
            'Début',
            '    $0',
            '    Retourner ${5:res}',
            'Fin',
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Déclaration de fonction (convention Bac)',
          range,
        },
        {
          label: 'Procédure (Bac Tunisien)',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'Procédure ${1:Nom}(@${2:T} : Tableau, ${3:N} : Entier)',
            'Début',
            '    $0',
            'Fin',
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Déclaration de procédure avec passage par référence @',
          range,
        },
        {
          label: 'Ecrire',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Ecrire($0)',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Affiche des valeurs dans la console',
          range,
        },
        {
          label: 'Lire',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Lire(${1:x})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Lit une valeur saisie par l’utilisateur',
          range,
        },
        {
          label: 'Sous_Chaine',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Sous_Chaine(${1:ch}, ${2:pos}, ${3:nb})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Extrait nb caractères à partir de pos',
          range,
        },
        {
          label: 'Long',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Long(${1:ch})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Longueur d’une chaîne de caractères',
          range,
        },
        {
          label: 'Pos',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Pos(${1:sous}, ${2:ch})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Position de sous dans ch (0 si absente)',
          range,
        },
        {
          label: 'ConvCh',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'ConvCh(${1:n})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Convertit un nombre en chaîne',
          range,
        },
        {
          label: 'Valeur',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Valeur(${1:ch})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Convertit une chaîne numérique en nombre',
          range,
        },
      ];

      return { suggestions };
    },
  });
}
