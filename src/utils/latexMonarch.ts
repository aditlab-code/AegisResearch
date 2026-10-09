export const LATEX_LANGUAGE_ID = 'latex'

export const latexMonarchTokens = {
  defaultToken: '',
  tokenPostfix: '.latex',

  keywords: [
    '\\documentclass',
    '\\usepackage',
    '\\begin',
    '\\end',
    '\\maketitle',
    '\\tableofcontents',
    '\\input',
    '\\include',
    '\\bibliographystyle',
    '\\bibliography',
    '\\addbibresource',
  ],

  sections: [
    '\\part',
    '\\chapter',
    '\\section',
    '\\subsection',
    '\\subsubsection',
    '\\paragraph',
    '\\subparagraph',
  ],

  formats: [
    '\\textbf',
    '\\textit',
    '\\underline',
    '\\emph',
    '\\texttt',
    '\\textsc',
    '\\textsf',
    '\\centering',
    '\\raggedright',
    '\\raggedleft',
  ],

  spacing: [
    '\\newline',
    '\\newpage',
    '\\clearpage',
    '\\hspace',
    '\\vspace',
    '\\bigskip',
    '\\medskip',
    '\\smallskip',
    '\\\\',
  ],

  tokenizer: {
    root: [
      // Comments
      [/(%.*$)/, 'comment'],

      // Inline math: $ ... $
      [/\$(?:[^\$\\]|\\.)*\$/, 'string.math'],

      // Display math: $$ ... $$
      [/\$\$(?:[^\$\\]|\\.)*\$\$/, 'string.math.display'],

      // Sectioning commands with high priority
      [
        /\\(?:part|chapter|section|subsection|subsubsection|paragraph)\*?/,
        'keyword.section',
      ],

      // Formatting commands
      [
        /\\(?:textbf|textit|underline|emph|texttt|textsc|textsf)/,
        'type.format',
      ],

      // Preamble & environment keywords
      [
        /\\(?:documentclass|usepackage|begin|end|maketitle|tableofcontents|input|include)/,
        'keyword.core',
      ],

      // Spacing & layout commands
      [
        /\\(?:newline|newpage|clearpage|hspace|vspace|bigskip|medskip|smallskip|\\\\)/,
        'constant.spacing',
      ],

      // Generic commands
      [/\\\w+/, 'keyword'],

      // Braces & brackets
      [/[{}]/, 'delimiter.curly'],
      [/[\[\]]/, 'delimiter.square'],

      // Numbers
      [/\b\d+\b/, 'number'],
    ],
  },
}

export const LATEX_THEME_RULES = [
  { token: 'comment', foreground: '15803d', fontStyle: 'italic' }, // emerald-700
  { token: 'string.math', foreground: 'b91c1c', fontStyle: 'bold' }, // red-700
  { token: 'string.math.display', foreground: '991b1b', fontStyle: 'bold' },
  { token: 'keyword.section', foreground: '4338ca', fontStyle: 'bold' }, // indigo-700
  { token: 'type.format', foreground: 'b45309', fontStyle: 'bold' }, // amber-700
  { token: 'keyword.core', foreground: '0f766e', fontStyle: 'bold' }, // teal-700
  { token: 'constant.spacing', foreground: '6b7280' }, // stone-500
  { token: 'delimiter.curly', foreground: '374151', fontStyle: 'bold' }, // slate-700
  { token: 'delimiter.square', foreground: '4b5563' },
  { token: 'keyword', foreground: '1d4ed8' }, // blue-700
  { token: 'number', foreground: 'd97706' },
]

export const LATEX_DARK_THEME_RULES = [
  { token: 'comment', foreground: '34d399', fontStyle: 'italic' }, // emerald-400
  { token: 'string.math', foreground: 'f87171', fontStyle: 'bold' }, // red-400
  { token: 'string.math.display', foreground: 'fb7185', fontStyle: 'bold' }, // rose-400
  { token: 'keyword.section', foreground: 'a5b4fc', fontStyle: 'bold' }, // indigo-300
  { token: 'type.format', foreground: 'fbbf24', fontStyle: 'bold' }, // amber-400
  { token: 'keyword.core', foreground: '2dd4bf', fontStyle: 'bold' }, // teal-400
  { token: 'constant.spacing', foreground: '71717a' }, // zinc-500
  { token: 'delimiter.curly', foreground: 'e4e4e7', fontStyle: 'bold' }, // zinc-200
  { token: 'delimiter.square', foreground: 'd4d4d8' },
  { token: 'keyword', foreground: '60a5fa' }, // blue-400
  { token: 'number', foreground: 'fbbf24' },
]

