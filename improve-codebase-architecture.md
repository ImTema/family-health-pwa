# Improve Codebase Architecture — Progress Log

Tracks deepening opportunities identified for family-health-pwa and what's been done about each. See `CONTEXT.md` for domain terms and `docs/adr/` for architectural decisions.

## Candidates identified

1. **Disease-coverage resolution scattered across 3 places** — done, see below.
2. **Record-entry forms (`new`/`[rid]`) near-total duplication** — done, see below.
3. **`children/[id]/+page.svelte` God route** (407 lines, 3 view-modes + inline gesture handler + duplicated print markup) — done, see below.
4. **`db.getChildren().find(id)` pattern instead of `db.getChild(id)`** — not started.

---

## 1. Disease-coverage resolution

**Problem:** "Which Diseases does this VaccinationRecord cover" was computed in 3 places with 2 different, disagreeing precedence rules — `schedule.ts` preferred `brandId` over `diseaseIds`; two route files inlined the same lookup with the opposite precedence. A record with both fields set could show different disease badges in the UI than what actually satisfied the schedule status computation — a real correctness bug, not just duplication.

**Decision:** `diseaseIds` is the sole source of truth for a record's covered diseases (brand selection auto-populates it, user can edit after); `brandId` is display-only metadata. No brand-fallback case needed — no legacy data exists in the old shape.

**Result:**
- Unified disease-coverage resolution into a single place (`diseasesFor()` in `schedule.ts`); the two inline reimplementations removed.
- Eliminated the precedence disagreement between schedule-status computation and UI display.
- `schedule.test.ts` updated: 3 tests now assert the single-source-of-truth contract.
- `svelte-check` and `vitest` (40/40) clean, no regressions.

---

## 2. Record-entry form duplication

**Problem:** `record/new/+page.svelte` and `record/[rid]/+page.svelte` were near-total copies — identical brand/disease selection, suggestion filtering, and validation, with minor UX drift between them (dropdown-dismiss method, suggestion cap). Understanding "how does record entry validate a brand" required reading and diffing both files.

**Decision:** extract the shared behavior into one `RecordForm` component; standardize both forms on the edit form's UX (blur+pointerdown dismissal, suggestions capped at 8).

**Result:**
- New shared module `web/src/lib/RecordForm.svelte` now owns brand/disease selection, suggestions, validation, and save wiring.
- `record/new/+page.svelte`: 164 → 27 lines.
- `record/[rid]/+page.svelte`: 197 → 55 lines.
- UX inconsistency (dismiss behavior, suggestion cap) resolved to one behavior across both forms.
- `svelte-check` and `vitest` (40/40) clean, no regressions. Not visually verified in a browser (no browser-automation tooling available in this environment) — parity confirmed by line-by-line comparison against the originals instead.

---

## 3. `children/[id]/+page.svelte` God route

**Problem:** one 407-line file bundled three independent concerns — Records (list/grouping/sorting + a print-only markup variant), ScheduleView (the DONE/HIGHLIGHTED/UPCOMING matrix), and Timeline (table + zoomable chart with an inline pinch-zoom gesture handler). Understanding any one view meant reading the whole file; none of it was unit-testable except by full component render.

**Decision:** split into three components (`RecordsTab`, `ScheduleTab`, `TimelineTab` under `$lib/`), parent route keeps only data-fetching and tab switching. The print-only markup stays with `RecordsTab` (legitimate print-vs-screen layout difference, not logic duplication — print is only ever triggered from the Records tab).

**Result:**
- `children/[id]/+page.svelte`: 407 → 85 lines, now just data-fetching + tab chrome.
- Extracted `RecordsTab.svelte` (177 lines), `ScheduleTab.svelte` (49 lines), `TimelineTab.svelte` (133 lines).
- Added two small shared helpers to `schedule.ts` (`scheduleMilestones`, `scheduleDiseases`) to avoid re-duplicating the milestone/disease derivations across the two new tabs that both need them.
- `svelte-check` and `vitest` (40/40) clean, no new error categories. Not visually verified in a browser (no browser-automation tooling available in this environment).
