import { Doc, ChatMessage, RibbonTab } from "../types";

export const INITIAL_DOCS: Doc[] = [
  {
    name: "main.tex",
    path: "main.tex",
    kind: "tex",
    content: `\\documentclass[12pt,a4paper]{article}

% Preamble
\\input{preamble/packages}
\\input{preamble/metadata}

\\title{\\docTitle}
\\author{\\docAuthor}
\\date{\\docDate}

\\begin{document}

\\maketitle

% Frontmatter
\\input{frontmatter/abstract_id}
\\input{frontmatter/abstract_en}
\\newpage
\\tableofcontents
\\newpage

% Chapters
\\input{chapters/bab1_pendahuluan}
\\input{chapters/bab2_sintaks_dan_fitur}
\\input{chapters/bab3_penutup}

% Bibliography
\\newpage
\\printbibliography[heading=bibintoc, title={Daftar Pustaka}]

% Backmatter
\\newpage
\\input{backmatter/lampiran}

\\end{document}`,
  },
  {
    name: "notes.md",
    path: "notes.md",
    kind: "md",
    content: `# Catatan Riset & Panduan Menulis Tesis

## Panduan Cepat Struktur Dokumen
1. **File Utama (\`main.tex\`)**: Root Document yang merangkai seluruh dokumen.
2. **Sub-direktori**:
   - \`chapters/\`: Naskah bab penelitian terpisah.
   - \`assets/\`: Gambar, bagan, dan plot figur (PNG, JPG, PDF).
   - \`preamble/\`: Konfigurasi paket dan metadata dokumen.
   - \`frontmatter/\`: Lembar pengesahan dan abstrak.
   - \`backmatter/\`: Lampiran dan dokumen pendukung.
3. **Kompilasi**: Tekan tombol **Compile** (\`Ctrl+B\`) untuk membuat \`main.pdf\`.`,
  },
  {
    name: "references.bib",
    path: "references.bib",
    kind: "tex",
    content: `@book{knuth1984texbook,
  title={The TeXbook},
  author={Knuth, Donald E.},
  year={1984},
  publisher={Addison-Wesley}
}

@book{lamport1994latex,
  title={LaTeX: A Document Preparation System},
  author={Lamport, Leslie},
  year={1994},
  publisher={Addison-Wesley}
}`,
  },
];

export const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  {
    role: "ai",
    text: "Hello! I am your academic research assistant. I can summarize documents, improve grammar, formulate equations, or suggest citations.",
  },
];

export const DEFAULT_RIBBON_TAB: RibbonTab = "Home";
