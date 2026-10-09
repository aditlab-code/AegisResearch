import { Doc, ChatMessage, RibbonTab } from '../types'

export const INITIAL_DOCS: Doc[] = [
  {
    name: 'thesis.tex',
    kind: 'tex',
    content: `\\documentclass{article}
\\title{Quantum Coherence in Biological Systems}
\\author{A. Rahman}
\\begin{document}
\\maketitle
\\section{Introduction}
Recent studies suggest that coherence persists in photosynthetic complexes.
The energy is given by $E = mc^2$ and transfer efficiency $\\eta = 0.95$.
\\section{Methods}
We model the system using a Lindblad master equation.
\\subsection{Simulation}
Numerical integration was performed over 10^4 timesteps.
\\end{document}`,
  },
  {
    name: 'notes.md',
    kind: 'md',
    content: `# Research Notes
## Week 12
Meeting with **Prof. Sari** about the *methods* chapter.
- Revise literature review
- Add decoherence plots
- Submit draft to journal
## Ideas
> Coherence may be protected by vibronic coupling.`,
  },
  {
    name: 'references.bib',
    kind: 'tex',
    content: `@article{engel2007,\n  title={Evidence for wavelike energy transfer},\n  author={Engel, G. S.},\n  year={2007}\n}`,
  },
]

export const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  {
    role: 'ai',
    text: 'Halo! Saya asisten akademik Anda. Saya bisa merangkum, memperbaiki tata bahasa, membuat rumus, atau menyarankan sitasi.',
  },
]

export const DEFAULT_RIBBON_TAB: RibbonTab = 'Home'
