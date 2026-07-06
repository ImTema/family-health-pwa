# Family Health PWA — Domain Context

## Core purpose
Vaccination-only tracker for parents relocating between countries. No sleep, weight, growth — vaccines only.

## Stack
- SvelteKit + `@sveltejs/adapter-static` (fully static PWA, no server)
- TypeScript
- Tailwind CSS + DaisyUI (CSS-only components, zero JS framework)
- `idb` (1.5kb IDB wrapper) for local persistence — versioned migrations via `openDB` upgrade callback
- Export via print CSS → browser-native PDF

## Ubiquitous Language

**Child** — a tracked person (always a child in practice). Has a birth date. Has one or more VaccinationRecords.

**VaccinationRecord** — a single administered dose: date given, vaccine brand name as written on the document, optional lot number and clinic.

**Disease** — a single antigen/pathogen a vaccine can protect against (e.g. `Diphtheria`, `Tetanus`, `HepB`, `IPV`). The atomic unit of coverage. Not country-specific.

**Brand** — a commercial vaccine product (e.g. `Pentaxim`, `Infanrix Hexa`, `BCG`). Covers one or more Diseases. Optionally has a manufacturer country. Seeded for popular brands; user can record an unknown brand by selecting Diseases directly.

**BrandDiseaseCoverage** — many-to-many: which Diseases a Brand covers. This is the knowledge graph edge.

**VaccinationRecord** — a single administered dose. References either a Brand (if known) or a set of Diseases (if brand unknown). Always has a date given.

**CountrySchedule** — the recommended vaccination timetable for a specific country. Contains ScheduleEntries. Selected per Child, not per view.

**ScheduleView** — a matrix: rows = Diseases, columns = age milestones. Cells show ScheduleStatus. A "today" cursor marks the child's current age. Country is not selectable in the view — it derives from the Child's active CountrySchedule.

**ScheduleEntry** — one row in a CountrySchedule: which Disease, at what age (in weeks), dose number within that disease series.

**ScheduleStatus** — computed per child per ScheduleEntry:
- `Done` — a VaccinationRecord covers this disease at this dose
- `Highlighted` — scheduled age has passed, no record yet (visual indicator only, no enforcement)
- `Upcoming` — scheduled age not yet reached

## Countries (MVP)
Russia, Serbia, EU (generalized European schedule). Data seeded from open national health ministry sources.

## Record entry flow
Tap "+" → search/select Brand from seeded list (or select Diseases from seeded list if brand unknown) → date picker (default: today) → serial number (optional free text) → notes: doctor name, medical centre (optional free text). Brand and Disease inputs are comboboxes: seeded catalog shown first, free-text entry allowed if not found. Custom values stored as-is alongside seeded ones.

## Sync strategy
MVP: file-based export/import (JSON). No server, no P2P in v1.

## Export
Print CSS → browser-native PDF. Renders as a clean table: child name, date of birth, vaccination history sorted by date.

## Where things live

Vocabulary term → code location, so edits don't require re-discovering these each time.

**`VaccinationRecord` type (discriminated union by `kind`)** — `web/src/lib/types.ts:43-44`
- `{ kind: 'vaccine', brandId?, customBrandName?, serialNumber? }`
- `{ kind: 'illness' }` (+ `diseaseIds`, `notes` set at save time, see below)

**New-record form** — `web/src/lib/components/RecordForm.svelte`
- Kind toggle (Vaccine/Illness buttons): `:102-103`
- `selectedDiseases` — a `Set<string>`, used for both kinds: declared `:35`, added to via `addDisease()` `:52-53` (no kind check — always additive, this is the multi-select), removed via `:59-61`, rendered as badges `:130-139`, search/add UI `:141-161`
- Brand/vaccine-name field: `:106-128`; forced to literal `'Illness'` and disabled (not hidden) when `kind === 'illness'` — `:114-115`
- Serial/lot-number field: `:168-179`; forced to `''` and disabled when `kind === 'illness'` — `:175-176`
- Save payload branch by kind: `:82-89`

**Record cards + grouping** — `web/src/lib/components/RecordsTab.svelte`
- `groupByDisease` toggle state `:11`, button `:34-38`
- Grouped view (by disease, replaces whole list): `:48-71`, group header `:50`
- Ungrouped card list, one card per record: `:74`
- `recordCard` snippet (the actual card markup): `:79-104`; container always `bg-base-200` `:80` (no per-kind styling yet); title comes from `brandNameFor(record)` `:86`

**Shared record helpers** — `web/src/lib/schedule.ts`
- `brandNameFor(record)` `:8-11` — returns brand name for vaccine records, literal `'Illness'` for illness records (not the disease name)
- `diseasesFor(record)` `:4` / `diseaseNamesFor(record)` `:13` — disease-set/name helpers, already kind-aware
- `groupRecordsByDisease(records)` `:64-90` — powers the `groupByDisease` view; groups every record (vaccine or illness) into per-disease buckets, not vaccine-then-illness interleaving
- `computeSchedule` `:22`, `scheduleMilestones` `:40`, `scheduleDiseases` `:44`, `recurringFor` `:55` — schedule-matrix logic, not record-card related

**Naming note:** the illness-vs-vaccine split is called `kind` in code, not `type`. "Disease" is the code/UI term (never "condition" or "illness" for the entity itself — "illness" is only the record `kind`).
