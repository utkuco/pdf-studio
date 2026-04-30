# TASKS — pdf-studio

> Live state. Read at session start. Update as work progresses.

## Active Goal
Fix remaining 3 items from Batuhan's list: UI fixes (dynamic contrast, selection hatching, ghosting), Editor auto-resize + Ctrl+V paste + toolbar shortcuts, Workflow (undo/redo, save vs export, drag-drop reorder).

## In Progress
- [ ] Item 4: Workflow — undo/redo after save, Save vs Export separation, Drag&Drop page reordering
- [ ] Verify move/resize fix in browser (resizeLockRef + setSelectedId in startResize)
- [ ] Verify save fix in browser (hexToRgb 3-char fix + handleSave nested try/catch)

## Next
- (none)

## Done
- [x] 2026-04-28 Item 1: Kriptografi — RC4-128 → AES-256 migration. Build: ✓
- [x] Item 2: UI — dynamic contrast (inverse/halo), selection hatching overlay (white overlay+pulse border dark / blue hatching light), ghosting during resize (startMove guard + separated move/resize handlePointerMove), will-change:transform on overlays. Build: ✓
- [x] Item 3: Editor — auto-resize textarea, Ctrl+V PNG paste, 1-9 keyboard shortcuts (V/M/E/T/R/C/L/A/H + 1-9), ✗✓ symbol insert buttons with cursor-position insert. Build: ✓
- [x] TR: allToolsSubtitle 'Beş'→'Yedi', ES: 'Cinco'→'Siete'
- [x] Floating annotation toolbar — appears above selected annotation with inline color swatches, stroke width, opacity %, B/I/U style, fill toggle (rect/circle), delete. Deploy: pdftoolstudio.com. Commit: 00cb7e1. Build: ✓
- [x] Select tool move vs resize — resize only from corners (15% threshold), non-corner drags → move annotation. Fixed capture-phase conflict (startResize was always winning via onPointerDownCapture). Commit: 3cdf309. Build: ✓
- [x] Annotation interaction bugs (3 fixes):
  - Bug 1: `startResize` OR→AND corner detection — `!leftSide && !topSide` → `(leftSide||rightSide) && (topSide||bottomSide)`. Commit: [patched]. Build: ✓
  - Bug 2: `onClick` removed from text annotation div → no more accidental edit on click. Edit now requires floating toolbar ✏️ button. Commit: [patched]. Build: ✓
  - Bug 3: `select` tool button now calls `setEditingTextId(null)` — switching to select closes any open textarea. Commit: [patched]. Build: ✓
  - Floating toolbar: ✏️ (blue/pencil) + 🗑️ (red/trash) buttons appear above selected text/stamp annotations in select mode. Pencil icon added to imports. Commit: [patched]. Build: ✓

## Blocked
- None

## Decisions
- 2026-04-28 AES-128 vs AES-256: chose `pdfVersion: '1.7ext3'` (V=5, AES-256) over `'1.7'` (V=4, AES-128) — security best practice, broadly compatible with modern PDF readers.
- 2026-04-28 Keep `decryptPdf` and `removePdfPassword` as-is with browser-limitation error message — `pdf-lib-plus-encrypt` does not support decryption.
- 2026-04-28 Build confirmed clean with `skipLibCheck: true` (existing tsconfig setting handles pdf-lib-plus-encrypt type issues).

## Notes for next session
- `WordToPdf.tsx` still imports from `pdf-lib` (not `pdf-lib-plus-encrypt`) — should check if this needs updating or is fine as-is.
- JA translation has "olutely!" typo (line 1907) — already in file, not changed yet.
- Decrypt/remove password UX: current error is functional but user-facing message could be friendlier ("Browser limitations" explanation vs just "not supported").
