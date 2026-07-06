# VaxTrack

## Description
Vaccination-only tracker PWA for parents relocating between countries. Log doses, compare against a country's vaccination schedule (Russia, Serbia, EU), and export a clean PDF for clinics or schools.

## Stack
SvelteKit + TypeScript, Tailwind + DaisyUI, `idb` (IndexedDB) for local storage. Fully static, offline-capable, no server.

## How to run
```
cd web
npm install
npm run dev
```

## How to test
```
cd web
npm test
```

## How to build and run for Node.js hosting (e.g. Hostinger)
```
cd web
npm run build
npm start       # static file server over web/build with SPA fallback
```
