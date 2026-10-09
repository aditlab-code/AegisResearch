# Release Notes: Aegis Research v0.1.0 (Beta)

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
- **Local Native Execution**: Direct asynchronous subprocess execution of local `pdflatex` and `bibtex` engines.
- **Automatic Reference & Citation Resolution**: Multi-pass compiler orchestrates:
  1. *Pass 1*: Initial `pdflatex` compilation to write `.aux` cross-reference keys.
  2. *Pass 2*: Automated detection of citations triggering `bibtex` compilation.
  3. *Pass 3*: Final `pdflatex` run resolving cross-references, tables of contents, and bibliography citations.
- **Intelligent Error Log Parser**: Filters verbose TeX log files to extract exact compiler errors (line numbers and syntax errors) directly into the UI.

### 4. Inline High-Performance PDF Preview
- **Integrated PDF.js Viewer**: Instant inline rendering of generated PDFs without requiring external viewer windows.
- **Reactive Cache-Busting**: Automatically refreshes the PDF canvas upon successful compilation using timestamp tokens.

### 5. Git Track Changes & Visual Commit Graph
- **Visual Commit & Branch Graph**: VS Code-style SVG graph rendering commit nodes, branch lanes, merge topologies, commit messages, short hashes, authors, and timestamps.
- **Branch Management**: Switch branches seamlessly or create new branches directly from the IDE.
- **File Staging & Diff Inspection**: Inspect modified, added, and untracked files; stage individual files or all changes; discard modifications safely.
- **Commit Authoring**: Create atomic Git commits directly from the sidebar without opening a terminal.

### 6. Global Search & Replace
- **Project-Wide Search**: Scan all workspace files for keywords and expressions.
- **Advanced Filters**: Toggle Case Sensitivity (`Aa`), Match Whole Word (`\b`), and Regular Expressions (`.*`).
- **Search & Replace Capabilities**:
  - Global "Replace All" across all matching files.
  - Per-match hover replacement for fine-grained control.
  - Atomic backend replacement endpoint (`POST /api/projects/{name}/search/replace`).

### 7. Review Notes Panel
- **Annotation Scanner**: Scans open documents for `TODO`, `FIXME`, and custom review tags.
- **Jump to Line**: Click any scanned annotation to jump directly to the target line in the Monaco editor.

### 8. Theming & Accessibility
- **Theme Switcher**: Instant switching between Light and Dark mode with automatic persistence in `localStorage`.
- **Zinc Palette**: Professional, distraction-free neutral color palette optimized for long research sessions.

### 9. Automation Shell Runners
- **`setup.sh`**: One-line cross-platform setup script detecting macOS (Homebrew), Debian/Ubuntu (APT), Fedora (DNF), and Windows WSL. Automatically provisions Python venv, LaTeX binaries, storage workspaces, and frontend dependencies.
- **`run.sh`**: Concurrent process manager launching FastAPI and Vite together with port collision checks and clean `SIGINT`/`SIGTERM` signal trapping.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**:
  - React 18.3 & TypeScript 5.7
  - Vite 6.1 (Build Tool & Dev Server)
  - Tailwind CSS 3.4
  - `@monaco-editor/react` 4.7
  - `pdfjs-dist` & `react-pdf` 9.2
  - `lucide-react` icons
  - `zustand` 5.0 for state management
- **Backend**:
  - FastAPI 0.115+ (Asynchronous REST & WebSocket API)
  - Uvicorn 0.32+
  - Pydantic v2.10+
  - WatchFiles for filesystem event notification
- **Compiler & Tools**:
  - TeX Live / MacTeX / BasicTeX (`pdflatex`, `bibtex`)
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
- [ ] **SyncTeX Inverse Search**: Click in the PDF preview to jump to the corresponding LaTeX source line.
- [ ] **BibTeX Citation Auto-Complete**: IntelliSense in Monaco suggesting citations directly from `references.bib`.
- [ ] **Project Export & ZIP Bundle**: One-click download of the complete compiled manuscript package for journal submission (arXiv, IEEE, ACM).
