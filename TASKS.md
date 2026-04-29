# TASKS — pdf-studio

> Live state. Read at session start. Update as work progresses.

## Active Goal
Fix remaining 3 items from Batuhan's list: UI fixes (dynamic contrast, selection hatching, ghosting), Editor auto-resize + Ctrl+V paste + toolbar shortcuts, Workflow (undo/redo, save vs export, drag-drop reorder).

## In Progress
- [ ] Item 4: Workflow — undo/redo after save, Save vs Export separation, Drag&Drop page reordering

## Next
- (none)

## Done
- [x] 2026-04-28 Item 1: Kriptografi — RC4-128 → AES-256 migration. Build: ✓
- [x] Item 2: UI — dynamic contrast (inverse/halo), selection hatching overlay (white overlay+pulse border dark / blue hatching light), ghosting during resize (startMove guard + separated move/resize handlePointerMove), will-change:transform on overlays. Build: ✓
- [x] Item 3: Editor — auto-resize textarea, Ctrl+V PNG paste, 1-9 keyboard shortcuts (V/M/E/T/R/C/L/A/H + 1-9), ✗✓ symbol insert buttons with cursor-position insert. Build: ✓
- [x] TR: allToolsSubtitle 'Beş'→'Yedi', ES: 'Cinco'→'Siete'

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
