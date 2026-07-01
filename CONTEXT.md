# Family Health PWA — Domain Context

## Core purpose
Vaccination-only tracker for parents relocating between countries. No sleep, weight, growth — vaccines only.

## Stack
- Kotlin Multiplatform, `js { browser() }` target
- Compose HTML (DOM-based, not Canvas)
- Tailwind CSS + DaisyUI (CSS-only components, zero JS framework)
- SQLite WASM (OPFS backend) for local persistence
- Export via print CSS → browser-native PDF

## Ubiquitous Language

**Child** — a tracked person (always a child in practice). Has a birth date. Has one or more VaccinationRecords.

**VaccinationRecord** — a single administered dose: date given, vaccine brand name as written on the document, optional lot number and clinic.

**Disease** — a single antigen/pathogen a vaccine can protect against (e.g. `Diphtheria`, `Tetanus`, `HepB`, `IPV`). The atomic unit of coverage. Not country-specific.

**Brand** — a commercial vaccine product (e.g. `Pentaxim`, `Infanrix Hexa`, `BCG`). Covers one or more Diseases. Seeded for popular brands; user can record an unknown brand by selecting Diseases directly.

**BrandDiseaseCoverage** — many-to-many: which Diseases a Brand covers. This is the knowledge graph edge.

**VaccinationRecord** — a single administered dose. References either a Brand (if known) or a set of Diseases (if brand unknown). Always has a date given.

**CountrySchedule** — the recommended vaccination timetable for a specific country. Contains ScheduleEntries.

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
