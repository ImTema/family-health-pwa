# Improve Codebase Architecture — Progress Log

Tracks deepening opportunities identified for family-health-pwa and what's been done about each. See `CONTEXT.md` for domain terms and `docs/adr/` for architectural decisions.

## Candidates identified

1. **Disease-coverage resolution scattered across 3 places** — done, see below.
2. **Record-entry forms (`new`/`[rid]`) near-total duplication** — done, see below.
3. **`children/[id]/+page.svelte` God route** (407 lines, 3 view-modes + inline gesture handler + duplicated print markup) — done, see below.
4. **`db.getChildren().find(id)` pattern instead of `db.getChild(id)`** — done, see below.
5. **Child-entry forms (`new`/`edit`) near-total duplication** — done, see below.
6. **Record display-name resolution scattered across 2 places** — done, see below.
7. **Backup import/export with no schema module, zero test coverage** — done, see below.
8. **`today()` reimplemented as an inline one-liner at 6 call sites** — done, see below.

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

---

## 4. `db.getChild(id)`

**Problem:** `db.ts` had no single-child lookup, so 4 call sites fetched the entire `children` store and did `.find(c => c.id === id)` just to get one row.

**Decision:** add `db.getChild(id)`, backed by a direct `idb.get()` (the store is keyed by `id`, so no index scan needed).

**Result:**
- Added `db.getChild(id)` to `db.ts`, with 2 new tests in `db.test.ts`.
- Replaced the `getChildren().find(...)` pattern at all 4 call sites (`children/[id]/+page.svelte`, `children/[id]/edit/+page.svelte`, `children/[id]/record/new/+page.svelte`, `children/[id]/record/[rid]/+page.svelte`).
- Side effect: while fixing this, `db.getChild(id: string)`'s stricter typing surfaced a pre-existing gap — `page.params.id` is typed `string | undefined` by SvelteKit and was never narrowed, which had been silently tolerated (11 pre-existing `svelte-check` errors before this session, growing to 18 as each refactor threaded `id` through more strictly-typed functions). Fixed at the source with `page.params.id as string` in the 6 affected route files (dynamic segments are always present for a matched route). `svelte-check` error count: 11 (baseline) → 0.
- `svelte-check` and `vitest` (42/42) clean.

---

## 5. `ChildForm` (recurrence of candidate #2, for `Child` instead of `VaccinationRecord`)

**Problem:** `children/new/+page.svelte` (89 lines) and `children/[id]/edit/+page.svelte` (122 lines) were near-total copies — identical fields (name/birthDate/sex/country/photo), identical validation, identical markup. The lesson from candidate #2 (`RecordForm.svelte`) hadn't been generalized to the other entity that gets created/edited.

**Decision:** extract `ChildForm.svelte`, mirroring `RecordForm.svelte`'s shape (`title`/`initial`/`onSave`/`extraActions` props).

**Result:**
- New shared module `web/src/lib/ChildForm.svelte` owns fields, validation, and save wiring.
- `children/new/+page.svelte`: 89 → 15 lines. `children/[id]/edit/+page.svelte`: 122 → 41 lines.
- `svelte-check` and `vitest` clean, no regressions.

---

## 6. Record display-name resolution (`brandNameFor`/`diseaseNamesFor`)

**Problem:** `brandName()` and `diseaseNames()` (resolving a VaccinationRecord's brand/disease display strings) were reimplemented in `RecordsTab.svelte` and `settings/+page.svelte`. The disease-name variant had a latent precedence-drift risk — one call site went through `diseasesFor()`, the other mapped `r.diseaseIds` directly — the same class of bug as candidate #1, just for display strings.

**Decision:** move `brandNameFor()`/`diseaseNamesFor()` into `schedule.ts` next to `diseasesFor()`, as the single source of truth for record display strings.

**Result:**
- Two duplicate local functions removed from `RecordsTab.svelte` and `settings/+page.svelte`.
- `svelte-check` and `vitest` clean, no regressions.

---

## 7. Backup import/export schema (`backup.ts`)

**Problem:** `settings/+page.svelte`'s `doImport` hand-listed the `Child` shape inline, shadowing `types.ts` with no compile-time link between them. Zero test coverage on the only code path that serializes/deserializes the full data model — a silent risk for the one operation that can destroy user data (import replaces everything via `db.deleteAll()`).

**Decision:** extract `backup.ts` with `toBackup()`/`fromBackup()`, an explicit `Backup`/`BackupChild` schema, and version defaulting for pre-versioning backups.

**Result:**
- New module `web/src/lib/backup.ts` + `backup.test.ts` (6 tests: round-trip, missing-field defaults, version defaulting, invalid-shape and malformed-JSON errors).
- `settings/+page.svelte`'s `doExport`/`doImport` now call the module instead of inlining the shape.
- `svelte-check` and `vitest` (48/48) clean.

---

## 8. `today()` helper (`todayISO`)

**Problem:** `new Date().toISOString().split('T')[0]` was reimplemented inline at 6 call sites (`RecordForm.svelte`, `RecordsTab.svelte`, `settings/+page.svelte` ×2, `children/new`, `children/[id]/edit`) for date-input defaults and filename stamps.

**Decision:** add `todayISO()` to `utils.ts`.

**Result:**
- All 6 call sites now call `todayISO()`.
- `svelte-check` and `vitest` clean, no regressions.
