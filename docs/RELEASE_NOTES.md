# Release Notes: Aegis Research

## 🚀 Version 0.1.1 (Modular Architecture Overhaul)

**Release Date:** October 2026  
**Version:** `0.1.1`  
**Repository:** [aditlab-code/AegisResearch](https://github.com/aditlab-code/AegisResearch)

---

### 🌟 Overview & Architecture Slicing
Version 0.1.1 represents a massive architectural modularization and code quality overhaul of Aegis Research. Ten monolithic source files (>1,000 lines) across the backend and frontend have been systematically decomposed into cohesive, single-responsibility sub-packages and sub-components adhering to strict line budgets (<350 target lines, <500 hard ceiling) with zero API contract mutations, 100% backward compatibility, and 101 unit tests passing.

---

### 📦 Key Architectural Enhancements in v0.1.1

#### 1. Backend Router & Schema Decomposition
- **`backend/main.py` Slimming**: Transformed from a monolithic 3,255-line server file into a clean, 85-line application factory and APIRouter aggregator.
- **Dedicated APIRouters (`backend/routers/`)**: Extracted 73 endpoints and WebSocket handlers into modular domain routers:
  - `projects_router.py`: Workspace discovery, folder browsing, native directory dialogs, file tree inspection, and CRUD.
  - `compiler_router.py`: Multi-pass `pdflatex` + `bibtex` compilation and compiler log parsing.
  - `git_ops_router.py`, `git_branch_router.py`, `git_router.py`: Visual commit graph, staging, diff inspection, commit authoring, and branch management.
  - `dataset_router.py`: CSV dataset ingestion, summary statistics, and column type inference.
  - `stats_basic_router.py`: Descriptive statistics, normality testing (Shapiro-Wilk, K-S), and reliability (Cronbach's alpha).
  - `stats_inferential_router.py`: Parametric tests (t-tests, ANOVA, correlation) and non-parametric counterparts (Mann-Whitney, Wilcoxon, Kruskal-Wallis, Chi-square).
  - `stats_advanced_router.py`: Multivariate linear regression (with VIF multicollinearity), logistic regression, MANOVA, and PCA.
  - `stats_plots_router.py`: Diagnostic plot generation (residuals, Q-Q, boxplots, ROC curves) and standalone Figure LaTeX exporter.
  - `bib_router.py`: Bibliometric network analysis, Callon thematic maps, Bradford/Lotka laws, and TikZ export.
  - `ws_router.py`: Real-time filesystem watcher WebSocket connection.
- **Centralized Pydantic Schemas (`backend/schemas/`)**: Decoupled data contracts into `project_schemas.py`, `git_schemas.py`, `stats_schemas.py`, and `bib_schemas.py`.

#### 2. Specialized Scientific Sub-Packages (`backend/services/`)
- **Table Exporters (`backend/services/exporters/`)**: Decomposed `latex_table_gen.py` (986 lines) into `table_core.py`, `stats_tables.py`, `parametric_tables.py`, and `nonparametric_tables.py` with complete APA, IEEE, and Classic styling preserved via backward-compatible facades.
- **Bibliometrics Engine (`backend/services/bibliometrics/`)**: Replaced monolithic 850-line file with a clean sub-package (`bibtex_parser.py`, `network_engine.py`, `thematic_engine.py`, `scientometric_laws.py`, `tikz_export.py`).
- **Publication Diagnostic Plots (`backend/services/plots/`)**: Modularized 1,375-line plotting engine into `plot_core.py`, `diagnostic_plots.py`, `interaction_plots.py`, and `multivariate_plots.py`.
- **Unified Statistical Services (`backend/services/stats/`)**: Consolidated over 2,100 lines of disparate statistics code into `descriptive.py`, `parametric_basic.py`, `parametric_anova.py`, `multivariate.py`, `nonparametric.py`, and `logistic.py`.

#### 3. Frontend Component Slicing & Registry Architecture
- **Statistical Guide Modal (`src/components/stats/guide/`)**: Sliced 1,205-line modal into an ergonomic 118-line shell supported by `WizardTab.tsx`, `MatrixTab.tsx`, `WorkflowTab.tsx`, and declarative recommendation rules.
- **Git Track Changes Studio (`src/components/sidebar/git/`)**: Decomposed 1,096-line Git sidebar into a 107-line shell with dedicated `GitCommitGraphCanvas.tsx`, `GitStagingList.tsx`, `GitDiffViewer.tsx`, `GitBranchModal.tsx`, and `useGitManager.ts` hook.
- **Analysis Dialog Suite (`src/components/stats/dialog/`)**: Decomposed 2,458-line dialog into a 240-line controller with declarative `testRegistry.ts`, `VariableSlots.tsx`, `VariableList.tsx`, and specialized analytical sub-forms.
- **Results Viewer Modal (`src/components/stats/results/`)**: Decomposed 3,076-line results modal into a 162-line modal shell with `plotRegistry.ts`, `LatexTableSection.tsx`, `DiagnosticPlotSection.tsx`, and dedicated sub-views for Group Comparisons, Regression, Multivariate, and Non-Parametric tests.

#### 4. Quality & Verification Gates
- **101/101 Backend Tests**: 100% pass rate across all Pytest suites (`test_workspaces.py`, `test_compiler.py`, `test_git.py`, `test_stats.py`, `test_bibliometrics.py`).
- **Zero Lint & Formatting Errors**: Ruff format check passes cleanly without regressions.
- **Production Build Integrity**: Vite compiles 1,766 modules cleanly in under 5.5 seconds with zero TypeScript or packaging errors.
- **Prettier Code Standard**: 100% compliant across all React & TypeScript sources.

---

## 🔬 Version 0.1.0 (Initial Beta Release)

**Release Date:** October 2026  
**Version:** `0.1.0` (Initial Beta Release)  
**Repository:** [aditlab-code/AegisResearch](https://github.com/aditlab-code/AegisResearch)

---

## 🔬 Welcome to Aegis Research

**Aegis Research** is an open-source, local-first Scholarly LaTeX IDE and Research Workbench. Designed for researchers, academics, and engineers, it combines the accessibility of a modern academic Ribbon interface with the power of VS Code-grade code editing, full Git version control, local multi-pass LaTeX compilation, and instant PDF rendering.

---

## 🚀 Key Highlights & New Features

### 1. Academic Ribbon Suite
- **Ribbon Tabs**: Familiar `Home`, `Insert`, and `Review` tabs providing quick access to editing, insertion, and review actions.
- **Two-Tier Layout**: Cleanly grouped controls (controls above, uppercase section labels below) designed to scale gracefully across laptop and desktop displays.
- **Title Bar**: Streamlined header displaying current project badge, compilation status, theme toggle, and repository link.

### 2. Editor & Workspace Management
- **Monaco Code Editor**: High-performance editor supporting syntax highlighting for LaTeX (`.tex`), BibTeX (`.bib`), and Markdown (`.md`).
- **Multi-Tab Document System**: Manage multiple open files with dirty state indicators, active tab switching, and clean close triggers.
- **Hierarchical File Tree**: Visual directory explorer with file type icons, new file/folder creation, and real-time synchronization.
- **Safe File Deletion Flow**: Hover trash action in file tree with an interactive confirmation modal, backend deletion API, and automatic tab closure for open deleted files.
- **Real-Time Workspace Watcher**: FastAPI WebSocket connection (`/api/ws/workspace/{name}`) notifying the frontend of filesystem modifications instantly.

### 3. Multi-Pass Local LaTeX Compilation Engine
- **Local Native Execution**: Direct asynchronous subprocess execution of local `pdflatex` and `bibtex` engines with `-synctex=1` flag enabled to produce synchronized position maps (`.synctex.gz`).
- **Automatic Reference & Citation Resolution**: Multi-pass compiler orchestrates:
  1. *Pass 1*: Initial `pdflatex` compilation to write `.aux` cross-reference keys and `.synctex.gz`.
  2. *Pass 2*: Automated detection of citations triggering `bibtex` compilation.
  3. *Pass 3*: Final `pdflatex` run resolving cross-references, tables of contents, and bibliography citations.
- **Intelligent Error Log Parser**: Filters verbose TeX log files to extract exact compiler errors (line numbers and syntax errors) directly into the UI.

### 4. Bibliography & Citation Style Engine (APA, IEEE, & Custom)
- **Automated Preamble Guarding**: Dynamically injects or cleans up required LaTeX packages (`\usepackage{apalike}`) based on chosen citation style to eliminate unresolved citation errors (`?` marks).
- **Preset & Custom Citation Formats**:
  - **APA Style (Author, Year)**: Sets `\usepackage{apalike}` in preamble and `\bibliographystyle{apalike}` with `\bibliography{references}`.
  - **IEEE Style (Numeric [1])**: Automatically cleans conflicting packages and sets `\bibliographystyle{ieeetr}`.
  - **Custom Style**: Supports arbitrary `.bst` styles (e.g., `plain`, `acm`, `nature`) with non-destructive code injection.
- **Multi-Pass Resolution**: Tight integration with the compiler's multi-pass loop (`pdflatex` &rarr; `bibtex` &rarr; `pdflatex`), ensuring `.aux` and `.bbl` files resolve citations into clean formatted text.

### 5. Native High-Performance PDF.js Preview
- **Native Multi-Page Canvas Rendering**: Direct continuous-scroll multi-page renderer powered by `pdfjs-dist` 4.10, completely eliminating third-party DOM wrapper bloat and preserving 1:1 paper geometry (A4, Letter, Beamer slides).
- **Retina & High-DPI Support**: Device pixel ratio (DPR) viewport scaling with explicit canvas matrix transformations, rendering crisp vector typography without clipping on Mac and 4K displays.
- **Smart Viewport Controls**: Zoom controls (25%–300%), Fit Width, and Fit Page with responsive recalculation on pane resizing.
- **Reactive Cache-Busting**: Automatically refreshes the PDF canvas upon successful compilation using timestamp tokens.

### 6. Bidirectional SyncTeX Navigation (Inverse & Forward Search)
- **Inverse Search (PDF &rarr; TeX Source)**: Double-click anywhere on the rendered PDF preview to navigate directly to the matching LaTeX source line in Monaco Editor. If the target line is located in an included subfile (e.g., `sections/abstract.tex`), the IDE automatically switches tabs, scrolls to the line, and triggers a 1.5-second pulse highlight.
- **Forward Search (TeX Source &rarr; PDF)**: Press `Cmd/Ctrl + Alt + J` or click the "Sync to PDF" ribbon button from any line in your `.tex` document to locate and scroll to the exact page and paragraph in the PDF preview, highlighting the target sentence with a pulsing focus indicator.
- **High-Performance Async CLI Service**: Backed by `backend/services/synctex.py`, executing non-blocking `synctex edit` and `synctex view` commands with accurate 72-DPI coordinate conversions.

### 7. Git Track Changes & Visual Commit Graph
- **Visual Commit & Branch Graph**: VS Code-style SVG graph rendering commit nodes, branch lanes, merge topologies, commit messages, short hashes, authors, and timestamps.
- **Branch Management**: Switch branches seamlessly or create new branches directly from the IDE.
- **File Staging & Diff Inspection**: Inspect modified, added, and untracked files; stage individual files or all changes; discard modifications safely.
- **Commit Authoring**: Create atomic Git commits directly from the sidebar without opening a terminal.

### 8. Statistical Research Workbench & Data Ribbon
- **Ergonomic Data Ribbon**: Structured action cards for Data Management, Assumption Tests, Parametric, Non-Parametric, Multivariate, and LaTeX Output Actions.
- **Measurement Scale Guardrails**: Enforces scientific measurement rules across Nominal, Ordinal, Interval, and Ratio scales to prevent methodological errors before computation starts.
- **Interactive Statistical Method Advisor**: Built-in modal guide walking researchers through the 4-stage empirical quantitative testing workflow (Instrument Reliability &rarr; Normality &rarr; Homoscedasticity &rarr; Hypothesis Testing).
- **Comprehensive Statistical Test Suite**:
  - *Prerequisite & Assumption Tests*: Shapiro-Wilk, Kolmogorov-Smirnov, Levene's Test, Cronbach's Alpha instrument reliability.
  - *Parametric Tests*: One-Sample t-Test, Independent Samples t-Test (Student & Welch's correction), Paired t-Test, One-Way ANOVA (Tukey HSD post-hoc), Two-Way Factorial ANOVA, Bivariate Pearson Correlation, Multiple Linear Regression (VIF collinearity), MANOVA (Wilks' Lambda), and PCA.
  - *Non-Parametric Tests*: Mann-Whitney U, Wilcoxon Signed-Rank, Kruskal-Wallis H, Spearman Rank Correlation, and Chi-Square Test of Independence.
- **Dynamic Multi-Style LaTeX Table Generator**: Generates publication-ready LaTeX tables across APA (`booktabs`), IEEE, and Classic LaTeX styles, rendered inside a dedicated full centered modal dialog with instant copy-to-clipboard and insert-to-editor triggers.

### 9. Bibliometrics & Scientometrics Studio Workbench
- **Ergonomic 3-Column Studio Layout**:
  - *Left Column (Nav & Corpus Stats)*: Tab navigation between analytical modules, corpus metadata counters (articles, keywords, authors, journals), and quick action controls.
  - *Center Column (Visual Viewport)*: Interactive SVG canvases with smooth tooltips, zero-jitter transform geometry, and responsive sizing.
  - *Right Column (Context-Aware Configuration Panel)*: Dynamic parameter sliders tailored to the active tab (e.g., Min Frequency 2–50, Top Nodes 30–100, dynamic slice selection 2–4, or Bradford zone breakdown cards), eliminating false affordances.
- **Architectural SSOT & Decoupled State**: Separation of query parameters (triggering backend analytical re-calculations) and visual layout parameters (instant 60 FPS slider adjustments without network roundtrips).
- **Comprehensive Scientometric Analytical Modules**:
  - *Co-Occurrence & Collaboration Networks*: Evaluates keyword co-occurrence and co-authorship networks with normalization (Jaccard Similarity, Cosine, Association Strength) and force-directed node repulsion to prevent visual crowding.
  - *Thematic Map (Callon's Strategic Diagram)*: 2x2 quadrant matrix mapping themes across Centrality (relevance degree) and Density (development degree) into Motor Themes, Highly Developed/Niche Themes, Emerging/Declining Themes, and Basic/Transversal Themes.
  - *Longitudinal Thematic Evolution*: Sankey diagram tracking thematic shifts across contiguous time slices (2, 3, or 4 periods) using thematic Inclusion Index with matched period keys.
  - *Scientometric Laws of Distribution*:
    - *Bradford's Law of Scattering*: Partitions journal sources into 3 concentric core zones with continuous rank boundary $\ln(n_1 + 0.5)$ avoiding collapsed zones when $n_1=1$.
    - *Lotka's Law of Author Productivity*: Analyzes author frequency distributions against the theoretical power-law exponent ($\alpha=2$) with automated two-sided Kolmogorov-Smirnov (K-S) goodness-of-fit validation and critical threshold reporting.
  - *SLR Stopword Cleaning & Top Keywords Exclude*: Interactive Systematic Literature Review (SLR) stopword management with one-click exclusion of dominant corpus terms.
  - *Native LaTeX TikZ Vector Export*: Directly generates standalone PGFPlots and TikZ vector code (`thematic_map` and `bradford`) for lossless publication embedding.

### 10. Global Search & Replace
- **Project-Wide Search**: Scan all workspace files for keywords and expressions.
- **Advanced Filters**: Toggle Case Sensitivity (`Aa`), Match Whole Word (`\b`), and Regular Expressions (`.*`).
- **Search & Replace Capabilities**:
  - Global "Replace All" across all matching files.
  - Per-match hover replacement for fine-grained control.
  - Atomic backend replacement endpoint (`POST /api/projects/{name}/search/replace`).

### 11. Review Notes Panel
- **Annotation Scanner**: Scans open documents for `TODO`, `FIXME`, and custom review tags.
- **Jump to Line**: Click any scanned annotation to jump directly to the target line in the Monaco editor.

### 12. Theming & Accessibility
- **Theme Switcher**: Instant switching between Light and Dark mode with automatic persistence in `localStorage`.
- **Zinc Palette**: Professional, distraction-free neutral color palette optimized for long research sessions.

### 13. Automation Shell Runners
- **`setup.sh`**: One-line cross-platform setup script detecting macOS (Homebrew), Debian/Ubuntu (APT), Fedora (DNF), and Windows WSL. Automatically provisions Python venv, LaTeX binaries, storage workspaces, and frontend dependencies.
- **`run.sh`**: Concurrent process manager launching FastAPI and Vite together with port collision checks and clean `SIGINT`/`SIGTERM` signal trapping.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**:
  - React 18.3 & TypeScript 5.7
  - Vite 6.1 (Build Tool & Dev Server)
  - Tailwind CSS 3.4
  - `@monaco-editor/react` 4.7
  - `pdfjs-dist` 4.10 (Native continuous multi-page canvas engine with DPR scaling)
  - `lucide-react` icons
  - `zustand` 5.0 for state management
- **Backend & Scientific Analysis Engine**:
  - FastAPI 0.115+ (Asynchronous REST & WebSocket API)
  - Uvicorn 0.32+
  - Pydantic v2.10+
  - Polars, NumPy, SciPy & Statsmodels for high-performance statistical computations
  - Bibliometrics & Scientometrics Service (Co-occurrence networks, Callon strategic diagrams, Bradford & Lotka distribution laws, LaTeX TikZ exporter)
  - WatchFiles for filesystem event notification
- **Compiler & Tools**:
  - TeX Live / MacTeX / BasicTeX (`pdflatex`, `bibtex`, `synctex`)
  - Git CLI
  - Optional: Ollama 0.4+ for local offline AI assistance

---

## 📦 Getting Started with v0.1.0

```bash
# 1. Clone repository
git clone https://github.com/aditlab-code/AegisResearch.git
cd AegisResearch

# 2. Run automated setup
./setup.sh

# 3. Start fullstack IDE
./run.sh
```

For detailed platform-specific guides, see [docs/HOW_TO_INSTALL.md](HOW_TO_INSTALL.md).

---

## 🔮 Upcoming Roadmap (v0.2.0 Preview)
- [ ] **One-Click AI Error Remedy**: Direct UI button triggering Ollama to fix LaTeX syntax errors.
- [ ] **BibTeX Citation Auto-Complete**: IntelliSense in Monaco suggesting citations directly from `references.bib`.
- [ ] **Project Export & ZIP Bundle**: One-click download of the complete compiled manuscript package for journal submission (arXiv, IEEE, ACM).
