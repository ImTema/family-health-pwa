# 008 — JSON export/import: backup and restore

**Type:** AFK  
**Blocked by:** 004, 005

## What to build

Device migration via file-based backup. Export serialises all children and all vaccination records to a JSON file downloaded to the device. Import reads a previously exported file and restores the data (MVP: full replace — existing data is cleared before import).

Export format (shape, not a binding contract):
```
{
  "version": 1,
  "exported_at": "2026-07-01",
  "children": [
    {
      "name": "...", "birth_date": "...", "country": "...",
      "records": [
        { "date": "...", "brand": "...", "diseases": [...], "serial_number": "...", "notes": "..." }
      ]
    }
  ]
}
```

Custom brand/disease names entered by the user are included verbatim. Seeded catalog data is not exported (it is re-seeded on import target).

## Acceptance criteria

- [ ] "Export" downloads a `.json` file named `vaccinations-YYYY-MM-DD.json`
- [ ] Exported file contains all children and all their records
- [ ] Custom (non-seeded) brand and disease names are preserved in the export
- [ ] "Import" accepts a `.json` file via file picker
- [ ] Import clears existing data and restores from the file
- [ ] Import shows a confirmation warning before clearing existing data
- [ ] A round-trip test: export → import → data is identical to pre-export state
- [ ] Invalid or corrupted file shows a clear error message, does not corrupt existing data
