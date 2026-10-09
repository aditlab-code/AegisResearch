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
  { token: 'comment', foreground: 'a0a1a7', fontStyle: 'italic' }, // Atom Light Grey comment
  { token: 'string.math', foreground: '50a14f', fontStyle: 'bold' }, // Atom Light Green
  { token: 'string.math.display', foreground: '50a14f', fontStyle: 'bold' },
  { token: 'keyword.section', foreground: '4078f2', fontStyle: 'bold' }, // Atom Light Blue
  { token: 'type.format', foreground: 'c18401', fontStyle: 'bold' }, // Atom Light Amber
  { token: 'keyword.core', foreground: 'e45649', fontStyle: 'bold' }, // Atom Light Red
  { token: 'constant.spacing', foreground: 'a0a1a7' },
  { token: 'delimiter.curly', foreground: '383a42', fontStyle: 'bold' }, // Atom Light Foreground
  { token: 'delimiter.square', foreground: '0184bc' }, // Atom Light Cyan
  { token: 'keyword', foreground: 'a626a4' }, // Atom Light Purple
  { token: 'number', foreground: '986801' }, // Atom Light Orange
]

export const LATEX_DARK_THEME_RULES = [
  { token: 'comment', foreground: '5c6370', fontStyle: 'italic' }, // Atom Dark Grey comment
  { token: 'string.math', foreground: '98c379', fontStyle: 'bold' }, // Atom Dark Green
  { token: 'string.math.display', foreground: '98c379', fontStyle: 'bold' },
  { token: 'keyword.section', foreground: '61afef', fontStyle: 'bold' }, // Atom Dark Blue
  { token: 'type.format', foreground: 'e5c07b', fontStyle: 'bold' }, // Atom Dark Yellow
  { token: 'keyword.core', foreground: 'e06c75', fontStyle: 'bold' }, // Atom Dark Red/Coral
  { token: 'constant.spacing', foreground: '5c6370' },
  { token: 'delimiter.curly', foreground: 'abb2bf', fontStyle: 'bold' }, // Atom Dark Foreground
  { token: 'delimiter.square', foreground: '56b6c2' }, // Atom Dark Cyan
  { token: 'keyword', foreground: 'c678dd' }, // Atom Dark Purple
  { token: 'number', foreground: 'd19a66' }, // Atom Dark Orange
]

