# Plan: Standardized Review Ribbon Suite with Sidepanel Git Track Changes & Review Notes

## 1. Overview & Architecture
Menata alur review dokumen akademik agar sangat alami dan efisien:
1. **Pemisahan Peran Ribbon vs Sidebar**:
   - **Ribbon Tab Review (`ReviewRibbonGroup.tsx`)**:
     - Sub-panel **Proofing / Spelling** (`SpellingPopover.tsx`): Pilihan bahasa (English US/UK, Custom).
     - Sub-panel **Comments & Notes** (`CommentPopover.tsx`): Menyisipkan catatan reviewer (`% [Reviewer]: ...` atau `\todo{...}`).
     - Tombol cepat pembuka sidebar: Tombol "Open Review Notes" dan tombol "Open Track Changes (Git)".
   - **Sidebar Panels**:
     - **Review Notes Panel (`ReviewNotesPanel.tsx`)**: Memindai seluruh `% TODO:`, `% [NOTE]`, `\todo{}` dari dokumen aktif dan mendukung klik *jump-to-line*.
     - **Track Changes / Git Source Control Panel (`GitTrackPanel.tsx`)**: Menampilkan panel Source Control bergaya VS Code di sidebar kiri (Branch aktif, daftar file Staged/Unstaged/Modified, dan melihat diff perubahan baris).
2. **Backend Git Endpoint (`backend/main.py`)**:
   - `GET /api/projects/{name}/git/status`: Mengembalikan nama branch aktif dan daftar file yang termodifikasi / untracked.
   - `GET /api/projects/{name}/git/diff?file=...`: Mengembalikan output `git diff` untuk file tersebut.
3. **Penyelarasan Desain Popover**:
   - Seluruh popover di Ribbon Review menggunakan arsitektur `PopoverShell` (Modern Minimalist Word style).

---

## 2. Dependency Graph & Blast Radius
```
[backend/main.py] (GET /git/status & GET /git/diff)
        │
        ▼
[backend/test_git.py] (Pytest verification)
        │
        ▼
[src/components/header/SpellingPopover.tsx & CommentPopover.tsx]
        │
        ▼
[src/components/header/ReviewRibbonGroup.tsx] (Integrated into RibbonBar.tsx)
        │
        ▼
[src/components/sidebar/ReviewNotesPanel.tsx] (TODO scanner with jump-to-line)
[src/components/sidebar/GitTrackPanel.tsx]    (VS Code-style Git panel)
        │
        ▼
[src/components/sidebar/ActivityBar.tsx & Sidebar.tsx] (New panels: 'review' & 'git')
        │
        ▼
[App.tsx] (Integrated navigation & editor actions)
```

---

## 3. Verification Gates
- **Backend Tests:** `rtk backend/.venv/bin/pytest backend/test_git.py` (lulus 100%).
- **Frontend Build:** `rtk npm run build` (lulus tanpa TypeScript error).
- **Interactive Verification:**
  - Tab Review di ribbon memuat Proofing dan Comments dengan layout `PopoverShell`.
  - Sidebar memiliki tab Review (TODO scanner) dan tab Git Track Changes (status file bergaya VS Code).
