# 002 — SQLite WASM layer: worker bridge, schema, Disease + Brand catalog seeded

**Type:** AFK  
**Blocked by:** 001

## What to build

Wire up `@sqlite.org/sqlite-wasm` with an OPFS backend running in a JS worker. Expose a thin Kotlin-callable bridge from `jsMain` that executes SQL and returns results. Create the full schema and run it on first launch. Seed the Disease catalog and Brand catalog (with BrandDiseaseCoverage) from a bundled JSON file.

Schema:

```sql
diseases         (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT)
brands           (id TEXT PRIMARY KEY, name TEXT NOT NULL, is_seeded INTEGER DEFAULT 1)
brand_diseases   (brand_id TEXT, disease_id TEXT, PRIMARY KEY (brand_id, disease_id))
schedule_entries (id TEXT PRIMARY KEY, country TEXT NOT NULL, disease_id TEXT NOT NULL, age_weeks INTEGER NOT NULL, dose_number INTEGER NOT NULL)
children         (id TEXT PRIMARY KEY, name TEXT NOT NULL, birth_date TEXT NOT NULL, country TEXT NOT NULL)
vaccination_records (id TEXT PRIMARY KEY, child_id TEXT NOT NULL, date TEXT NOT NULL, brand_id TEXT, serial_number TEXT, notes TEXT)
record_diseases  (record_id TEXT, disease_id TEXT, PRIMARY KEY (record_id, disease_id))
```

Seed data covers: all diseases needed for Russia, Serbia, and EU schedules; all popular brands for those regions with their coverage mappings.

## Acceptance criteria

- [ ] SQLite WASM loads in a JS worker without blocking the main thread
- [ ] Schema is created on first run; subsequent runs detect existing schema and skip creation
- [ ] A Kotlin `Database` interface in `jsMain` exposes `execute(sql, params)` and `query(sql, params)`
- [ ] All seed diseases are present after first launch
- [ ] All seed brands are present with correct BrandDiseaseCoverage entries
- [ ] A unit test in `commonMain` verifies the brand-to-disease resolution logic (given a brand id, returns correct disease set)
