# 007 — PDF export: print CSS vaccination table

**Type:** AFK  
**Blocked by:** 005

## What to build

Export the active child's vaccination history as a PDF. Implemented via a print-only CSS stylesheet — no JS PDF library. Tapping "Export PDF" triggers `window.print()`. The browser handles PDF generation natively.

Print layout:
- Child name and date of birth in the header
- Table: Date | Brand | Diseases covered | Serial number | Notes
- Rows sorted by date ascending
- Clean typography, no UI chrome (no buttons, no nav)
- Fits on A4 paper

## Acceptance criteria

- [ ] "Export PDF" button available on the active child's record list view
- [ ] Triggering export opens the browser print dialog
- [ ] Print preview shows child name and birth date in the header
- [ ] Table rows are sorted by date ascending
- [ ] All fields (brand, diseases, serial, notes) render correctly; empty optional fields shown as blank
- [ ] No UI navigation elements appear in the print output
- [ ] Output is readable on A4 paper (tested via print preview)
- [ ] Works offline (no external font or asset CDN calls in the print stylesheet)
