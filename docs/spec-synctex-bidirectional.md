# Spec: Bidirectional SyncTeX Navigation (Inverse & Forward Search)

## Objective
Enable seamless bidirectional navigation between the LaTeX source code in the Monaco Editor and the compiled PDF preview in the Aegis Research IDE:
1. **Inverse Search:** Double-clicking any sentence or formula in the PDF preview jumps directly to the corresponding LaTeX source file and line in Monaco, pulsing a temporary line highlight.
2. **Forward Search:** Pressing `Cmd/Ctrl + Alt + J` or clicking the "Sync to PDF" Ribbon button jumps to and visually highlights the corresponding position in the PDF preview.

### User Stories & Acceptance Criteria
- **US-1 (Inverse Navigation):** As an author reading the compiled PDF, when I double-click on a paragraph on Page 2, the IDE automatically centers and highlights the source line in Monaco editor. If that paragraph is in an included subfile (e.g., `chapters/intro.tex`), the IDE automatically switches to or opens that tab.
- **US-2 (Forward Navigation):** As an author editing LaTeX source code, when I press `Cmd/Ctrl + Alt + J` (or click "Sync to PDF"), the PDF viewer smoothly scrolls to the corresponding page and displays an animated indicator box around the typeset text for 1.5s.
- **US-3 (Compilation Integration):** When compiling via `compile_latex()`, `pdflatex` runs with `-synctex=1` to generate an up-to-date `.synctex.gz` file.
- **US-4 (Multi-Page PDF Viewer):** The PDF preview is upgraded from a static `iframe` to an interactive multi-page continuous scroll viewer using direct `pdfjs-dist` canvas rendering, guaranteeing 100% aspect ratio preservation (using `viewport.convertToPdfPoint` and `viewport.convertToViewportPoint`) without any CSS canvas distortion, supporting zoom, fit-width, fit-page, and precise coordinate tracking.

---

## Tech Stack
- **Frontend:** React 18, TypeScript 5.7, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), `pdfjs-dist` 4.10, Lucide React.
- **Backend:** Python 3.12, FastAPI, Pydantic v2, Pytest, TeX Live (`synctex` 1.5 CLI utility & `pdflatex`).

---

## Commands
- **Backend Dev:** `rtk backend/.venv/bin/python -m backend.main`
- **Backend Tests:** `rtk backend/.venv/bin/pytest backend/test_synctex.py`
- **Frontend Dev:** `rtk npm run dev:frontend`
- **Frontend Build & Typecheck:** `rtk npm run build`
- **Full Test Suite:** `rtk backend/.venv/bin/pytest`

---

## Project Structure
```
AegisResearch/
├── backend/
│   ├── services/
│   │   ├── compiler.py        # Add -synctex=1 flag to pdflatex invocation
│   │   └── synctex.py         # SyncTeX service: inverse (edit) & forward (view) resolution
│   ├── main.py                # SyncTeX API endpoints (/api/projects/{name}/synctex/...)
│   └── test_synctex.py        # Unit tests for SyncTeX service and endpoints
├── src/
│   ├── services/
│   │   └── synctex.ts         # Client API service for inverse & forward search
│   ├── components/
│   │   ├── preview/
│   │   │   ├── PDFViewer.tsx  # Interactive direct pdfjs-dist canvas viewer with native viewport coordinate mapping
│   │   │   ├── PreviewPanel.tsx # Wire forward/inverse search callbacks and toolbar
│   │   │   └── PreviewToolbar.tsx # Add "Sync to Source" / "Sync to PDF" indicators
│   │   ├── editor/
│   │   │   └── CodeEditor.tsx # Line pulse animation & jumpToLineAndHighlight handle
│   │   └── header/
│   │       └── RibbonBar.tsx  # "Sync to PDF" button & keyboard shortcut integration
│   └── App.tsx                # State coordination between Editor, Compiler, and PDFViewer
```

---

## Code Style & Pattern Conventions

### Backend: SyncTeX CLI Wrapper
```python
# backend/services/synctex.py
async def synctex_inverse_search(project_dir: Path, pdf_name: str, page: int, x: float, y: float) -> Dict[str, Any]:
    synctex_bin = find_tex_bin("synctex")
    cmd = [
        synctex_bin, "edit",
        "-o", f"{page}:{x}:{y}:{pdf_name}",
        "-d", str(project_dir)
    ]
    # Runs async subprocess and parses Input:, Line:, Column:
```

### Frontend: Double-Click Coordinate Mapping
```typescript
// PDF coordinate system uses big points (1/72 inch).
// Convert mouse event coordinates on rendered canvas to PDF points:
const rect = pageElement.getBoundingClientRect()
const clickX = e.clientX - rect.left
const clickY = e.clientY - rect.top
const pointX = (clickX / rect.width) * originalWidthPoints
const pointY = (clickY / rect.height) * originalHeightPoints
```

### Editor: Pulse Highlight Animation
```typescript
// Monaco delta decorations with a temporary pulse CSS class:
const decorations = editor.createDecorationsCollection([
  {
    range: new monaco.Range(line, 1, line, 1),
    options: {
      isWholeLine: true,
      className: 'synctex-line-pulse',
    },
  },
])
setTimeout(() => decorations.clear(), 1500)
```

---

## Testing Strategy
- **Backend Unit Tests (`backend/test_synctex.py`):**
  - Test parser for `synctex edit` output format (`Input`, `Line`, `Column`).
  - Test parser for `synctex view` output format (`Page`, `x`, `y`, `W`, `H`).
  - Test graceful fallback when `.synctex.gz` does not exist or coordinates are out of bounds.
  - Test FastAPI endpoint status codes and JSON response structure.
- **Frontend Integration & Build Verification:**
  - TypeScript type checking: `rtk npm run build` (0 type errors).
  - Test coordinate translation calculations under different zoom factors.
  - Verify tab auto-switching when matched file is different from current active document.

---

## Boundaries
- **Always:**
  - Prefix all terminal commands with `rtk`.
  - Ensure zero TypeScript compiler errors (`npm run build`).
  - Preserve existing dark/light theme support in Monaco and PDF viewer controls.
  - Provide clear status messages in the status bar on jump or failure.
- **Ask first:**
  - Adding external npm packages (note: `react-pdf` and `pdfjs-dist` are already in `package.json`).
  - Altering project workspace directory storage structure.
- **Never:**
  - Block UI threads with synchronous subprocess calls.
  - Crash or throw unhandled exceptions when PDF is missing `.synctex.gz`.

---

## Success Criteria
1. `pdflatex` compiles with `-synctex=1` producing `.synctex.gz`.
2. Double-clicking on any page in the PDF preview jumps to the exact source file and line in Monaco editor.
3. Target source line in Monaco editor centers and displays a visible 1.5s pulse highlight.
4. If target line is in a subfile (`\input` / `\include`), the editor opens that file and highlights the line.
5. Forward search (`Cmd/Ctrl + Alt + J` or "Sync to PDF" button) scrolls the PDF viewer to the exact page and renders a temporary highlight rectangle.
6. Continuous vertical scrolling with zoom (In, Out, Fit Width, Fit Page) works reliably in the PDF preview.
7. Backend tests in `backend/test_synctex.py` pass 100%.

---

## Open Questions
- None. (All key architectural decisions, interaction gestures, and visual behaviors were confirmed during the grill-me phase).
