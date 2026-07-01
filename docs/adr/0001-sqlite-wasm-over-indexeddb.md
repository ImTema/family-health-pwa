# ADR 0001: SQLite WASM over IndexedDB

**Status:** Accepted

## Context
Local persistence for a vaccination tracker with a relational knowledge graph (diseases, brands, coverage mappings, schedule entries, records). Data is never sent to a server.

## Decision
Use `@sqlite.org/sqlite-wasm` with OPFS backend, accessed via a JS worker bridge.

## Reasons
- Vaccine knowledge graph is inherently relational: brand ↔ disease coverage, schedule entries per country, record-to-disease mapping. SQL is the natural query language.
- Schema migrations are trivial with versioned SQL scripts.
- SQLite binary can be exported as a blob for future device sync (event log or full DB transfer).
- IndexedDB API is key-value + cursor — relational queries become verbose object traversal with no migration story.

## Trade-offs
- WASM binary ~600KB (gzipped). Cached by service worker after first load, never re-downloaded offline.
- Requires a small JS worker bridge (not Kotlinizable). Acceptable — service worker and SQLite worker are the two JS files that must stay as JS.

## Alternatives rejected
- **IndexedDB**: no SQL, no migrations, wrong data shape for this domain.
- **localStorage**: 5MB limit, synchronous, no structured queries.
