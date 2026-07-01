# 009 — PWA shell: service worker, offline cache, web manifest

**Type:** AFK  
**Blocked by:** 001

## What to build

Make the app installable and fully offline-capable after first load. Two JS files (not Kotlinizable): `service-worker.js` and the web app manifest.

Service worker strategy:
- Cache-first for the app shell (HTML, JS bundles, CSS)
- Cache-first for the SQLite WASM binary (~600KB, cached once, never re-fetched)
- No network calls for data (all data is local SQLite — nothing to cache)

Web manifest: app name, short name, icons (at minimum 192×192 and 512×512), `display: standalone`, `start_url`, theme colour.

## Acceptance criteria

- [ ] App is installable from Chrome (desktop and Android) via the browser install prompt
- [ ] App is installable on iOS via Safari "Add to Home Screen"
- [ ] After first load, the app works fully offline (no network requests required)
- [ ] SQLite WASM binary is cached by the service worker on first load
- [ ] App shell (HTML, JS, CSS) is served from cache on subsequent loads
- [ ] Web manifest includes correct icons, name, and standalone display mode
- [ ] Service worker update flow: new version detected on next online visit, user sees a reload prompt
