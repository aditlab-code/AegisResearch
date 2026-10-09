# Tasks: Review Ribbon Suite with Sidepanel Git Track Changes & Review Notes

- [ ] Task 1: Backend Git Endpoints in `backend/main.py` & Tests in `backend/test_git.py`
  - Acceptance: Endpoint `GET /api/projects/{name}/git/status` dan `GET /api/projects/{name}/git/diff` mengembalikan branch aktif, daftar file yang dimodifikasi, dan diff baris tanpa crash jika repo belum ada.
  - Verify: `rtk backend/.venv/bin/pytest backend/test_git.py`
  - Files: `backend/main.py`, `backend/test_git.py`

- [ ] Task 2: Build `ReviewNotesPanel.tsx` & `GitTrackPanel.tsx` for Sidebar
  - Acceptance:
    - `ReviewNotesPanel`: Memindai seluruh `% TODO`, `% [NOTE]`, `\todo{}` dari dokumen aktif dan mengarahkan kursor saat diklik (*jump-to-line*).
    - `GitTrackPanel`: Menampilkan status branch, daftar file termodifikasi bergaya VS Code Source Control, dan preview diff.
  - Verify: `rtk npm run build`
  - Files: `src/components/sidebar/ReviewNotesPanel.tsx`, `src/components/sidebar/GitTrackPanel.tsx`, `src/types/document.ts`, `src/components/sidebar/ActivityBar.tsx`, `src/components/sidebar/Sidebar.tsx`

- [ ] Task 3: Build `SpellingPopover.tsx`, `CommentPopover.tsx`, and `ReviewRibbonGroup.tsx`
  - Acceptance: Tab Review di ribbon memuat sub-panel Proofing (pilihan bahasa), Comments (sisipkan catatan reviewer/TODO), dan tombol pintas pembuka panel sidebar Review & Track Changes. Seluruh popover dibungkus `PopoverShell`.
  - Verify: `rtk npm run build`
  - Files: `src/components/header/SpellingPopover.tsx`, `src/components/header/CommentPopover.tsx`, `src/components/header/ReviewRibbonGroup.tsx`, `src/components/header/RibbonBar.tsx`

- [ ] Task 4: End-to-End Verification & Verification Gates
  - Acceptance: Seluruh fungsionalitas peninjauan naskah, pemindaian TODO di sidebar, status Git, dan build frontend terverifikasi 100%.
  - Verify: `rtk npm run build && rtk backend/.venv/bin/pytest backend/`
  - Files: `docs/roadmap.md`
