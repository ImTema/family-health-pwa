# 006 — Schedule view: disease × age matrix with today cursor

**Type:** AFK  
**Blocked by:** 003, 004, 005

## What to build

A matrix view for the active child showing their vaccination status against the schedule of their selected country.

Layout:
- **Rows** — one per Disease in the active country's schedule
- **Columns** — age milestones (birth, 1mo, 2mo, 3mo, 4mo, 6mo, 9mo, 12mo, 18mo, 24mo, etc.) derived from schedule_entries
- **Cells** — ScheduleStatus: Done (✓), Highlighted (⚠, past age, no record), Upcoming (○, future)
- **Today cursor** — a vertical line at the column corresponding to the child's current age

Status engine logic (lives in `commonMain`, fully testable):
- `Done` — union of diseases across all the child's records covers this disease, and dose sequence is satisfied
- `Highlighted` — age milestone has passed (child's age > entry.age_weeks), not Done
- `Upcoming` — child's age < entry.age_weeks

No country picker in this view. Country is set on the child profile (issue 004).

## Acceptance criteria

- [ ] Matrix renders correctly for a child with no records (all Upcoming or Highlighted depending on age)
- [ ] Matrix renders correctly for a fully vaccinated child (all Done)
- [ ] Today cursor renders at the correct column for the child's current age
- [ ] Highlighted cells are visually distinct from Upcoming (colour or icon)
- [ ] Done cells show the date of the covering record on hover/tap
- [ ] Switching a child's country (in their profile) recomputes the matrix immediately
- [ ] Matrix is horizontally scrollable on mobile without breaking layout
- [ ] Unit tests in `commonMain`: fixed birth date + fixed records → assert correct ScheduleStatus per entry for each of the three countries
