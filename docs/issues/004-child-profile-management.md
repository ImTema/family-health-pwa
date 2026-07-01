# 004 — Child profile management: create, edit, delete, switch

**Type:** AFK  
**Blocked by:** 002

## What to build

Full CRUD for Child profiles. Each child has a name, birth date, and a selected country (drives schedule calculation). The UI shows a child switcher — tap a child to make them active. From the active child's profile you can edit details or delete the child (with confirmation; deletion cascades to all their VaccinationRecords).

The country field is a picker from the three seeded countries (Russia, Serbia, EU). This is the only place country is selected — the schedule view derives from it.

## Acceptance criteria

- [ ] Parent can create a child with name, birth date, and country
- [ ] Parent can edit name, birth date, and country of an existing child
- [ ] Parent can delete a child; all linked VaccinationRecords are deleted
- [ ] Deletion requires a confirmation step (cannot be done by accident)
- [ ] Multiple children are listed; tapping one makes it the active child
- [ ] Active child persists across page reloads (stored in SQLite or localStorage)
- [ ] Empty state is shown when no children exist, with a prompt to add the first child
- [ ] UI uses DaisyUI components, is mobile-responsive
