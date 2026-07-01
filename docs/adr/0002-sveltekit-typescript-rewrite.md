# ADR 0002: Rewrite in SvelteKit + TypeScript

**Status:** Accepted  
**Supersedes:** ADR 0001 (SQLite WASM — never implemented; actual impl used IndexedDB)

## Context

The Kotlin Multiplatform + Compose HTML stack was chosen at project start. In practice it produced slow build cycles, thin browser tooling, and a small ecosystem — all hurting development speed for a solo developer.

## Decision

Full big-bang rewrite to:
- **SvelteKit** with `@sveltejs/adapter-static` (static PWA, no server)
- **TypeScript**
- **Tailwind CSS + DaisyUI** (kept — no migration cost)
- **`idb`** (1.5kb) for IndexedDB access with promise API and versioned upgrade callbacks

No data compatibility with the Kotlin build. Clean slate.

## Reasons

- SvelteKit HMR vs Kotlin WASM build times: seconds vs minutes.
- TypeScript + Svelte ecosystem tooling far exceeds Compose HTML.
- Domain model (CONTEXT.md) is fully portable — no Kotlin-specific logic.
- `idb` matches the existing IndexedDB schema shape with minimal abstraction.

## Trade-offs

- Dexie.js (27kb) rejected in favor of `idb` (1.5kb) — query surface is small enough that Dexie's ORM layer adds weight without benefit. Migrations handled via `oldVersion` checks in the upgrade callback.
- Big bang chosen over incremental — personal app, single developer, no production users at risk.

## Alternatives rejected

- **Incremental migration**: doubles complexity during transition, no benefit for a personal app.
- **Dexie.js**: 27kb vs 1.5kb for the same 4 operations (getAll, getByIndex, put, delete).
- **React/Vue**: heavier runtime than Svelte; Svelte compiles to vanilla JS.
