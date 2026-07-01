# 010 — UX improvements v2

**Type:** AFK  
**Blocked by:** 004, 005, 006, 008

## Problem Statement

The app has a working vaccination tracker but several UX gaps make daily use frustrating. Record cards waste horizontal space. The schedule view shows status symbols but hides the actual injection dates, making it impossible to see how late a vaccine was given. The record entry form buries disease selection in a long checkbox scroll. There is no way to toggle a dark theme, no reference page for the vaccine catalog, no child photo, no sex field, and no way to distinguish optional from mandatory vaccines in the schedule. Export and import are designed but not yet built.

## Solution

A focused UX pass across the app: restructure record cards to use horizontal space, add a Timeline tab that plots real injections against the advisory schedule, upgrade the record entry form with chips and a searchable disease combobox, add a Settings page for backup and theme, add a Dictionary tab for the vaccine catalog, extend Child profiles with sex and photo, and mark schedule entries as mandatory or optional.

## User Stories

1. As a parent, I want record cards to show date, vaccine, and serial number on one line and disease chips on the next, so that I can scan my history at a glance without wasting screen space.
2. As a parent, I want to see disease chips auto-populated below the brand field when I select a vaccine brand, so that I immediately know what diseases it covers.
3. As a parent, I want to add or remove disease chips after a brand is selected, so that I can correct coverage when the brand's default is wrong.
4. As a parent, I want to search for diseases by name in a combobox instead of scrolling a checkbox list, so that I can find the right disease quickly.
5. As a parent, I want to see a Timeline tab on my child's page, so that I can compare when vaccines were actually given against when they were recommended.
6. As a parent, I want the timeline to show both a recommended-age marker and the actual injection date for each disease, so that I can see how late or early each vaccine was given.
7. As a parent, I want both a timeline view and an augmented table view available in the Timeline tab, so that I can compare the two formats and decide which is clearer.
8. As a parent, I want to export my child's vaccination history as a PDF sorted by date or by brand name, so that I can choose the order that makes most sense for a clinic.
9. As a parent, I want to optionally group the PDF export by disease, so that a doctor can see all doses for a given disease together.
10. As a parent, I want a Settings page accessible from the main navigation, so that I can manage my data and app preferences in one place.
11. As a parent, I want to export all my data as a JSON file from Settings, so that I can back up and migrate between devices.
12. As a parent, I want child photos to be included in the JSON backup, so that a full restore also restores the photos.
13. As a parent, I want to import a JSON backup file from Settings, so that I can restore all my data on a new device.
14. As a parent, I want a confirmation warning before import clears my existing data, so that I cannot accidentally overwrite records.
15. As a parent, I want to toggle between dark and light theme from Settings, so that I can use the app comfortably at night.
16. As a parent, I want my theme preference to be remembered across sessions, so that I do not have to set it every time I open the app.
17. As a parent, I want to add a photo to my child's profile, so that I can identify children at a glance on the home screen.
18. As a parent, I want to add a sex field (Male/Female) to my child's profile, so that I have a complete medical record.
19. As a parent, I want the app to reject a birth date in the future, so that I cannot create an invalid child profile.
20. As a parent, I want the app to reject a vaccination date before the child's birth date, so that I cannot create a medically impossible record.
21. As a parent, I want a Dictionary tab in the main navigation, so that I can browse the vaccine and disease catalog without being in a record entry flow.
22. As a parent, I want to tap a brand in the Dictionary and see all diseases it covers, so that I can explain to a foreign doctor what my child has received.
23. As a parent, I want to tap a disease in the Dictionary and see all brands that cover it, so that I can find equivalent vaccines abroad.
24. As a parent, I want each schedule entry to be marked as Mandatory or Optional, so that I can prioritise which gaps to address first.
25. As a parent, I want Mandatory and Optional schedule entries to be visually distinct in the schedule matrix, so that I can tell them apart at a glance.

## Implementation Decisions

### Child Profile
- Add `sex: 'MALE' | 'FEMALE'` field to the `Child` type. Required on create/edit.
- Add `photo?: string` field to `Child` — base64-encoded image string. Optional.
- IDB schema version bump required to store the new fields.
- Photo is stored as base64 in the `children` object store alongside other child fields.

### Validation
- Birth date: must not be in the future (> today). Validated on child create and edit.
- Vaccination record date: must be ≥ child's birth date. Validated on record create and edit. Child's birth date is available in the record form context.

### Record Entry Form
- Replace the scrollable disease checkbox list with a searchable combobox (same pattern as the brand field — native `<datalist>` or a simple filtered list).
- When a brand is selected, render its covered diseases as editable chips immediately below the brand input.
- Chips are removable. Additional diseases can be added via the disease combobox.
- When no brand is selected, chips reflect only manually added diseases.

### Record Card Layout
- Card body restructured into two rows:
  - Row 1: date · vaccine/brand · serial number (inline, space-separated or grid columns)
  - Row 2: disease chips (read-only, same chip style as entry form)

### Schedule Entry — Necessity
- Add `necessity: 'MANDATORY' | 'OPTIONAL'` to the `ScheduleEntry` type.
- Seeded per country schedule entry. Default assumption: all existing entries are MANDATORY until explicitly marked otherwise in seed data.
- Schedule matrix: Mandatory entries use the existing visual style. Optional entries use a muted color or a distinct icon (e.g., dashed border on the cell, or a secondary icon alongside ✓/!/·).

### Timeline Tab
- New third tab on the child detail page, alongside Records and Schedule.
- Prototype two views (toggle between them within the tab):
  - **Augmented table**: existing schedule matrix extended with an "Actual date" column or cell annotation showing the real injection date alongside the recommended age.
  - **Timeline view**: horizontal axis = child's age in weeks (or calendar date); recommended age markers and actual injection dots plotted per disease.
- Both views are prototypes — the decision of which to keep is deferred.
- Data shape: for each ScheduleEntry, resolve the recommended age (`ageWeeks`) and the actual age at injection (`(record.date - child.birthDate) in weeks`) if a covering record exists.

### PDF Export
- Before triggering `window.print()`, present sort and group options:
  - Sort: by date (default) or by brand name
  - Group: none (default) or group by disease
- Options rendered as a small form shown only on screen (hidden in print CSS).
- The print table is re-sorted/re-grouped in-memory before printing.

### Settings Page
- New route `/settings`, linked from main navigation.
- Sections: Backup (export + import) and Appearance (theme toggle).
- **Export**: serialise all children (including photo), all vaccination records, and all custom brands to JSON. Trigger browser file download named `vaccinations-YYYY-MM-DD.json`.
- Export format extends the existing v1 shape with `photo` on each child and bumps `version` to 2.
- **Import**: file picker accepting `.json`. On selection, parse and validate. Show confirmation modal ("This will replace all existing data"). On confirm, call `db.deleteAll()` then restore.
- Import must not corrupt existing data if the file is invalid — validate before clearing.
- **Theme**: DaisyUI `data-theme` attribute toggled on `<html>`. Preference saved to `localStorage` under key `theme`. Applied on app load in root layout before first render to avoid flash.

### Dictionary Tab
- New main navigation tab (alongside or near the children list, at app root level).
- Two sub-views toggled within the tab: Brands list and Diseases list.
- Brands view: searchable list of all seeded brands. Tap a brand → expand or navigate to show covered diseases.
- Diseases view: searchable list of all seeded diseases. Tap a disease → show all brands that cover it.
- Read-only. Driven entirely by seeded `brands`, `brandCoverage`, and `diseases` from `seed.ts` — no DB reads needed.

## Testing Decisions

Good tests assert observable behavior given deterministic inputs. Do not test implementation details (IDB calls, internal state).

**What makes a good test here:**
- Fixed child birth date + fixed record date → validation pass or fail
- Fixed brand → fixed chip set
- Fixed ScheduleEntry with necessity → correct visual class/icon in rendered output
- Fixed export payload → round-trip import produces identical data including photo

**Modules to test:**

1. **Validation rules** — birth date in future → rejected; record date before birth → rejected; valid inputs → accepted. Pure functions, no DOM needed.

2. **Schedule Engine — necessity** — given entries with mixed necessity, assert the correct necessity value is surfaced in ScheduleResult. Extend existing schedule engine tests.

3. **Timeline data shape** — given a child with known birth date and a record at a known date, assert `actualAgeWeeks` is computed correctly relative to `entry.ageWeeks`.

4. **JSON export round-trip with photo** — export a child with a base64 photo and records → import → assert children, records, and photo string are identical to pre-export state.

## Out of Scope

- PDF filename control (requires a JS PDF library — dropped)
- Date picker font override (OS-controlled on mobile — dropped)
- Multi-language UI
- Cloud sync
- Push notifications or reminders
- Any non-vaccination child health tracking

## Further Notes

- The Dictionary tab is read-only and entirely seeded-data-driven — it requires zero schema changes and is safe to build independently of all other items.
- Child photos as base64 can be large (1–5 MB per photo). If JSON backup size becomes a concern post-MVP, consider storing photos separately or compressing before encoding. For now, include as-is.
- The Timeline tab is explicitly a prototype. Both views should be built but neither should be polished — the goal is to make a decision, not ship a feature.
- The necessity seed data for Russia, Serbia, and EU schedules will need research (national health ministry sources) before this can be fully seeded. Mark all existing entries as MANDATORY as a safe default until reviewed.
- IDB schema version must be bumped when adding `sex`, `photo`, and any other new fields to stored objects. The upgrade callback in `db.ts` must handle the migration for existing records (default `sex` to a sentinel or require re-entry — recommendation: make `sex` optional in the type but required in the form UI, so existing records are not broken).
