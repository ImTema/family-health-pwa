# 011 — UX polish v3

**Type:** AFK  
**Blocked by:** 010

## Problem Statement

Several small but high-friction UX issues remain after the v2 pass. Dates are displayed with dashes which look clinical; age is not shown so parents have to calculate it mentally; delete/edit/settings actions use text labels that are too small to tap comfortably on iPhone; the sort/group controls only affect the PDF printout but not the on-screen records list; and the Dictionary has no detail pages, making it a shallow list with no real value.

## Solution

A polish pass: unify date display to dots, show child age inline, replace text action buttons with icons, make the add button thumb-friendly, apply sort/group to the screen view, fix the PDF filename, add dictionary detail pages with placeholder content, and file a seed data issue for the next session.

## User Stories

1. As a parent, I want all displayed dates to use dots (2026.07.01) instead of dashes, so that dates feel less clinical and more readable.
2. As a parent, I want to see my child's current age (e.g. 4y 4m) next to their birth date, so that I don't have to calculate it myself.
3. As a parent, I want the child header to read `birthdate · age · country` with no "Born" label, so that the information is compact and scannable.
4. As a parent, I want delete buttons to show a trash icon instead of the word "Del", so that I can tap the right action quickly on mobile.
5. As a parent, I want edit buttons to show a pencil icon instead of the word "Edit", so that actions are recognisable at a glance.
6. As a parent, I want the Settings link to show a gear icon instead of the word "Settings", so that it takes less header space.
7. As a parent, I want the "+ Record" add button to be large enough to tap comfortably with my thumb, so that I don't have to aim precisely.
8. As a parent, I want the sort and group controls to affect the on-screen records list, not just the PDF, so that what I see matches what gets printed.
9. As a parent, I want the grouping control to show an icon instead of the text "Group by disease", so that the toolbar stays compact.
10. As a parent, I want the exported PDF to have a human-readable filename (e.g. `Anna-vaccinations-2026.07.01`), so that I can find it in my downloads.
11. As a parent, I want to tap a disease in the Dictionary and see a detail page with a description and symptoms, so that I can understand what the disease is.
12. As a parent, I want to tap a vaccine brand in the Dictionary and see a detail page with its country of approval and coverage, so that I can explain it to a foreign doctor.

## Implementation Decisions

### Date display utility
- Add a `formatDate(iso: string): string` helper that converts `YYYY-MM-DD` → `YYYY.MM.DD`.
- Apply everywhere dates are rendered: record cards, child headers, schedule table cells that show dates, PDF print view, timeline table.
- Storage format stays `YYYY-MM-DD` unchanged — ISO strings are never shown raw.

### Age display
- Add a `childAge(birthDate: string): string` helper that returns a human-readable age string.
- Format: `Xy Ym` (e.g. `4y 4m`). Under 1 year: `Xm`. Under 1 month: `Xd`.
- Child header line: `{formatDate(birthDate)} · {childAge(birthDate)} · {country}` — no "Born" label.
- Also update the home page child cards to use the same format.

### Icon buttons
- Use emoji/unicode for icons — no icon library dependency.
  - Delete: 🗑 (or `×` if emoji renders poorly)
  - Edit: ✏️
  - Settings: ⚙️
- The `+ Record` button stays as text but increases to `btn-md` (or `btn-lg` on the child detail header) so it is thumb-tappable.

### Sort/group as display controls
- The `pdfSort` and `pdfGroup` state variables control both the on-screen list and the PDF printout.
- On-screen records list renders using `sortedRecords()` / `groupedRecords()` — same functions already used for the print view.
- The controls toolbar label changes: sort select stays, group-by text label replaced with a rows/grouping icon (e.g. `⊞` or a stacked-lines symbol).

### PDF filename
- Before `window.print()`: `const prev = document.title; document.title = \`${child.name}-vaccinations-${formatDate(today)}\``
- After print dialog closes: restore with `document.title = prev`.
- Use `window.onafterprint` to restore — fires after the print dialog is dismissed on all major browsers.

### Dictionary detail pages
- Add two new routes: `/dictionary/disease/[id]` and `/dictionary/brand/[id]`.
- Extend `Disease` type with optional `description?: string` and `symptoms?: string`.
- Extend `Brand` type with optional `description?: string` and `approvedIn?: string[]`.
- All values are `undefined` / placeholder ("Description coming soon.") until seeded next session.
- Dictionary list items become links to these routes.
- Detail page for Disease shows: name, description, symptoms.
- Detail page for Brand shows: name, covered diseases (chips), approved countries, description.

### Seed data issue (filed separately)
- See `docs/issues/012-seed-dictionary-data.md` — tracks what content needs to be written for all 16 diseases and 28 brands.

## Testing Decisions

- `formatDate` and `childAge` are pure functions — add inline assertions or a small `__main__` style self-check. No framework needed.
- No other new logic worth testing; all other changes are presentation-only.

## Out of Scope

- Live certification queries (dropped)
- 5-second deletion undo timer (dropped — existing modal is sufficient)
- Changing JSON backup filename (already readable: `vaccinations-YYYY-MM-DD.json`)

## Further Notes

- `window.onafterprint` is the correct hook for restoring `document.title` after printing. Assigning it temporarily is safe — there is no existing `onafterprint` handler in this codebase.
- The `childAge` helper should handle the edge case where `birthDate` is today (newborn): return `0d` or `newborn`.
- Dictionary detail routes can be added under `/dictionary/disease/[id]` and `/dictionary/brand/[id]`. If the main Dictionary tab is implemented as an in-page tab on `/`, the detail pages still need to be separate routes for deep-linking and back-navigation to work correctly on mobile.
