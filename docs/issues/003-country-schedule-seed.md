# 003 — Country schedule seed: Russia, Serbia, EU

**Type:** AFK  
**Blocked by:** 002

## What to build

Seed `schedule_entries` for three countries: Russia (national immunisation calendar), Serbia (national immunisation calendar), EU (generalised EMA/ECDC schedule). Data sourced from official open health ministry publications. Each entry: country code, disease_id, age_weeks (nominal), dose_number.

All entries reference disease_ids already present from the 002 seed. No new schema changes.

## Acceptance criteria

- [ ] Russia schedule entries seeded and match the current national immunisation calendar
- [ ] Serbia schedule entries seeded and match the current national immunisation calendar
- [ ] EU schedule entries seeded and match the generalised ECDC recommended schedule
- [ ] Each entry references a valid disease_id from the diseases table
- [ ] No duplicate entries (country + disease_id + dose_number must be unique)
- [ ] A unit test verifies that for a child born on a fixed date with no records, the schedule engine returns the correct number of Upcoming entries per country
