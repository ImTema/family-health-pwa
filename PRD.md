# PRD: Family Vaccination Tracker PWA

## Problem Statement

Parents relocating between countries struggle to maintain an accurate, portable vaccination history for their children. Existing apps are overloaded with unrelated features (sleep, weight, growth), have poor UX, and provide no help understanding vaccine equivalence across countries. A parent moving from Russia to Serbia cannot easily determine whether "Пентаксим" satisfies the Serbian DTaP-IPV-Hib schedule requirement. There is no minimal, vaccination-first, cross-country tracker that works offline and travels with the family.

---

## Solution

A PWA (Progressive Web App) focused exclusively on vaccination tracking for children. Local-first, offline-capable, installable on any device. The app maintains a seeded vaccine knowledge graph mapping commercial brand names to the diseases they cover, enabling cross-country schedule comparison. Parents can track multiple children, log vaccination records in seconds, view upcoming and highlighted schedule entries per country, and export a clean PDF vaccination table for clinics or schools.

---

## User Stories

1. As a parent, I want to create a child profile with name and birth date, so that I can track vaccinations for each of my children separately.
2. As a parent, I want to switch between multiple children profiles, so that I can manage the vaccination history of all my children in one place.
3. As a parent, I want to edit or delete a child profile, so that I can correct mistakes or remove outdated entries.
4. As a parent, I want to tap "+" and add a vaccination record in seconds, so that logging a visit is not a chore.
5. As a parent, I want to search for and select a vaccine brand from a predefined list, so that I don't have to remember exact names.
6. As a parent, I want to type a brand name not in the list, so that I can record unusual or regional vaccines not yet in the catalog.
7. As a parent, I want to select individual diseases if the brand is unknown, so that I can record vaccines from a paper booklet even without a brand name.
8. As a parent, I want to type a disease name not in the predefined list, so that I can handle edge cases and unlisted antigens.
9. As a parent, I want the date field to default to today, so that I can log a fresh vaccination with one fewer tap.
10. As a parent, I want to enter a serial number for each vaccination record, so that I have a full medical record matching the physical booklet.
11. As a parent, I want to add notes (doctor name, medical centre) to a vaccination record, so that I can remember where each vaccination was administered.
12. As a parent, I want to edit or delete a vaccination record, so that I can correct data entry mistakes.
13. As a parent, I want to select a country vaccination schedule (Russia, Serbia, EU), so that I can see what is recommended in my current location.
14. As a parent, I want to switch the active country schedule at any time, so that I can compare requirements after relocating.
15. As a parent, I want to see the full vaccination schedule for the selected country sorted by age, so that I understand what is expected at each stage.
16. As a parent, I want each schedule entry to show its status — Done, Highlighted, or Upcoming — so that I know what has been covered and what needs attention.
17. As a parent, I want a "Done" status when a recorded vaccination covers the required disease and dose, so that I can see my child is protected.
18. As a parent, I want a "Highlighted" status when a scheduled age has passed but no matching record exists, so that I notice gaps without feeling pressured.
19. As a parent, I want an "Upcoming" status for future schedule entries, so that I can plan ahead.
20. As a parent, I want the schedule engine to match records against schedule entries using disease coverage (not just brand name), so that "Pentaxim" correctly satisfies the DTaP-IPV-Hib entry in any country schedule.
21. As a parent, I want to see what diseases a brand covers, so that I can explain to a doctor abroad what my child has received.
22. As a parent, I want to see the international name for a vaccine I recorded by local brand name, so that I can communicate across language barriers.
23. As a parent, I want to export my child's vaccination history as a PDF, so that I can hand it to a clinic or school.
24. As a parent, I want the exported PDF to be a clean, readable table sorted by date, so that medical staff can interpret it quickly.
25. As a parent, I want to export all data as a JSON file, so that I can back up and migrate between devices.
26. As a parent, I want to import a JSON backup file, so that I can restore my data on a new device.
27. As a parent, I want the app to work fully offline after the first load, so that I can use it during travel or without internet.
28. As a parent, I want to install the app on my home screen (iOS, Android, desktop), so that it feels like a native app.
29. As a parent, I want a minimal UI focused only on vaccines, so that I am not distracted by unrelated health features.
30. As a parent, I want a fast and responsive UI, so that the app does not feel sluggish on mobile.

---

## Implementation Decisions

### Architecture
- **Kotlin Multiplatform** with `js { browser() }` target. Business logic lives in `commonMain`; UI and storage bridge in `jsMain`.
- **Compose HTML** (DOM-based renderer, not Canvas) for the UI layer. Real HTML elements, PWA-friendly, accessible.
- **Tailwind CSS + DaisyUI** for styling. Tailwind JIT ships only used classes (~10–20KB). DaisyUI provides polished components as pure CSS — zero JS framework dependency.
- **SQLite WASM** (`@sqlite.org/sqlite-wasm`, OPFS backend) for local persistence, accessed via a JS worker bridge. The only two files that must remain as JS: `sqlite-worker.js` and `service-worker.js`.
- **Print CSS** for PDF export — browser-native, zero library dependency.

### Modules

#### 1. Disease Catalog (Deep Module)
Seeded list of canonical antigens/pathogens (BCG, HepB, Diphtheria, Tetanus, Pertussis, IPV, Hib, MMR, Varicella, etc.). Country-neutral. Rarely changes. Interface: lookup by id, search by name.

#### 2. Brand Catalog (Deep Module)
Seeded list of commercial vaccine products with their disease coverage. Many-to-many relationship with Disease Catalog via `BrandDiseaseCoverage`. Interface: lookup by id, search by name, get covered diseases for a brand.

Combobox UX: predefined brands shown first; free-text entry allowed if brand not found. Custom brand values stored alongside seeded ones.

#### 3. Vaccine Knowledge Graph
The join of Disease Catalog + Brand Catalog + BrandDiseaseCoverage. Central reference used by both the Schedule Engine and the record entry flow. Seeded from open sources before first release; rarely updated.

#### 4. Country Schedule Engine (Deep Module)
Predefined ScheduleEntries per country (Russia, Serbia, EU for MVP). Each entry: `country, disease_id, age_weeks, dose_number`. Given a Child's birth date and their VaccinationRecords, computes ScheduleStatus per entry:
- `Done` — a record's disease coverage ⊇ required disease, at or before age_weeks + dose is satisfied in sequence
- `Highlighted` — age_weeks passed, no covering record for this dose
- `Upcoming` — age_weeks not yet reached

No enforcement, no alerts. Highlighted is a visual indicator only.

#### 5. Child Profile Module
CRUD for Child entities (name, birth date). Supports multiple children. Deletion cascades to all VaccinationRecords for that child.

#### 6. VaccinationRecord Module
CRUD for VaccinationRecord entities. Each record: `child_id, date, brand_id (nullable), serial_number (nullable), notes (nullable)` + a set of disease_ids (for unknown-brand records or to override brand coverage). Date defaults to today on creation.

#### 7. Local Storage Layer
SQLite schema:
```sql
diseases         (id, name, description)
brands           (id, name, is_seeded)
brand_diseases   (brand_id, disease_id)
schedule_entries (id, country, disease_id, age_weeks, dose_number)
children         (id, name, birth_date)
vaccination_records (id, child_id, date, brand_id, serial_number, notes)
record_diseases  (record_id, disease_id)
```
Versioned migration system. Seed data loaded on first run from bundled JSON.

#### 8. Export/Import Module
- **JSON export**: full DB state serialised to JSON (all children, all records, brand/disease references). Used for device migration.
- **JSON import**: restores from a JSON backup. Merges or replaces (MVP: replace).
- **PDF export**: triggers browser print dialog with a print-only CSS stylesheet rendering a clean vaccination table. No JS PDF library.

#### 9. PWA Shell
Service worker (JS, not Kotlinizable): caches app shell and SQLite WASM binary on first load. All subsequent use is fully offline. Web app manifest for home screen installation on iOS, Android, and desktop.

### Data seeding
Vaccine catalog (diseases + brands + coverage) and schedule entries (Russia, Serbia, EU) authored as JSON and bundled with the app. Loaded into SQLite on first run. Updates require an app release — acceptable given how rarely national schedules change.

---

## Testing Decisions

Good tests assert observable behavior with deterministic inputs. They do not test implementation details (SQL queries, internal state).

**What makes a good test here:**
- Fixed child birth date + fixed "today" date → deterministic ScheduleStatus output
- Fixed brand → fixed disease set
- Fixed record set → fixed coverage result

**Modules that must be tested:**

1. **Country Schedule Engine** — most critical. Given a birth date, a set of records, and a country, assert the correct ScheduleStatus for each entry. Cover: all-done child, child with gaps, child younger than any entry, cross-country schedule switch.

2. **Vaccine Knowledge Graph** — brand-to-disease resolution, disease coverage matching (record covers entry iff diseases(record) ⊇ {entry.disease}), custom (non-seeded) brand handling.

3. **VaccinationRecord consistency** — a record with a brand correctly inherits disease coverage; a record with explicit diseases uses those instead; dose sequencing is respected.

4. **Export/Import round-trip** — export → import produces identical data. Validated with a fixed seed dataset.

**Not tested:** UI components, PDF output, service worker behaviour.

---

## Out of Scope

- Cloud sync or multi-user synchronization
- Server-side infrastructure of any kind
- Real-time P2P sync (deferred post-MVP)
- Push notifications / reminders
- Growth charts, sleep tracking, weight, nutrition
- Doctor notes beyond the free-text notes field on a record
- Multi-language UI (English only for MVP)
- Hospital integrations (FHIR, EMR)
- Social or community features
- Monetization

---

## Further Notes

- The product is intentionally narrow: vaccines only. Every feature request that adds unrelated child health tracking should be rejected at the PRD level.
- The vaccine knowledge graph is the long-term moat — accurate cross-country brand-to-disease mapping that improves over time.
- Belarus and US (CDC) schedules are natural next additions post-MVP. The schema already supports them — it's purely a data seeding task.
- Device sync via WebRTC P2P (no server data storage, only a free STUN relay for handshake) is the natural post-MVP sync path. Designing VaccinationRecords as append-only from day one would make this easier — worth considering at schema level even if not implemented in MVP.
- iOS PWA limitations: no push notifications, no background sync. Reminder feature is therefore post-MVP and possibly requires a companion native app.
