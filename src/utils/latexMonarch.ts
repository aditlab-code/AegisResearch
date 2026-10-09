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
