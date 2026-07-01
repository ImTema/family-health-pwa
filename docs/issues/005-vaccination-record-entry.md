# 005 — Vaccination record entry: "+" flow

**Type:** AFK  
**Blocked by:** 002, 004

## What to build

The primary data entry flow. Tap "+" to open a form. The form has:

1. **Brand** — combobox: search seeded brands first, allow free-text if not found
2. **Diseases** — combobox (multi-select): if brand is selected, pre-fills covered diseases; editable. If no brand, select diseases directly from seeded list; allow free-text additions.
3. **Date** — date picker, defaults to today
4. **Serial number** — optional free-text
5. **Notes** — optional free-text (doctor name, medical centre, etc.)

Saving writes a VaccinationRecord (and record_diseases rows if no brand or overridden). Parent can edit or delete any existing record from the record list view.

## Acceptance criteria

- [ ] "+" button is always accessible from the active child's view
- [ ] Brand combobox shows seeded brands; typing filters the list; unmatched input accepted as custom value
- [ ] Selecting a brand auto-populates the diseases field with that brand's coverage
- [ ] Diseases field is multi-select combobox; seeded diseases shown first; free-text allowed
- [ ] Date field defaults to today; past dates selectable
- [ ] Serial number and notes fields are optional free-text
- [ ] Saved record appears immediately in the record list without page reload
- [ ] Parent can edit any field of an existing record
- [ ] Parent can delete a record with a confirmation step
- [ ] Form is mobile-friendly (no horizontal scroll, large tap targets)
