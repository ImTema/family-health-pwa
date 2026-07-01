# 001 — KMP project setup: Compose HTML + Tailwind + DaisyUI

**Type:** HITL  
**Blocked by:** None — can start immediately

## What to build

Convert the existing `kotlin("jvm")` Gradle project to Kotlin Multiplatform with a `js { browser() }` target. Wire up Compose HTML for the UI layer, Tailwind CSS (JIT) + DaisyUI for styling. The end state: `./gradlew jsBrowserDevelopmentRun` opens a browser tab rendering a minimal shell (a single heading or button) styled with a DaisyUI class. Proves the full build pipeline works before any feature code is written.

Two JS files must exist that are not Kotlinizable: `sqlite-worker.js` (placeholder) and `service-worker.js` (placeholder). Scaffold them empty so the project structure is established.

## Acceptance criteria

- [ ] `build.gradle.kts` uses `kotlin("multiplatform")` with `js { browser() }` target
- [ ] `commonMain` source set exists (for future shared domain logic)
- [ ] `jsMain` source set contains a minimal Compose HTML `main()` entry point
- [ ] Tailwind CSS JIT is configured and purges unused classes at build time
- [ ] DaisyUI is installed as a Tailwind plugin
- [ ] A DaisyUI-styled element renders correctly in the browser
- [ ] `src/jsMain/resources/sqlite-worker.js` exists (placeholder)
- [ ] `src/jsMain/resources/service-worker.js` exists (placeholder)
- [ ] `./gradlew jsBrowserDevelopmentRun` succeeds without errors
- [ ] Human verifies the browser output looks correct before marking done
