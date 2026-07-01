# PRD

## Problem Statement

Parents (especially during early childhood years and relocation between countries) struggle to:
- Track child vaccination history in a structured way
- Understand equivalence between vaccines across different countries (e.g. Russia, Belarus, Serbia, EU, US)
- Translate vaccine names and components across systems (e.g. Pentaxim, MMR, BCG)
- Know what is missing or due in a given country schedule
- Maintain a simple, non-bloated system focused only on vaccinations (existing apps are too complex and overloaded with features like sleep, weight, growth tracking)

There is a strong need for a **minimal, vaccination-first, cross-country vaccine tracker**.

---

## Solution

A **PWA (Progressive Web App)** focused exclusively on vaccination tracking for children.

Core idea:
- Local-first app (no mandatory account, no external services)
- SQLite-based local storage (or equivalent embedded DB in browser via WASM/IndexedDB abstraction)
- Offline-first usage
- Ability to maintain multiple children profiles
- Country-based vaccination calendars
- Vaccine mapping across countries and naming systems

Key differentiator:
- Built-in **global vaccine translation layer** (e.g. “Pentaxim ↔ DTaP-IPV-Hib”)
- Structured vaccine equivalence database

---

## User Stories

1. As a parent, I want to add a child profile, so that I can track vaccinations separately per child.
2. As a parent, I want to store vaccination records locally, so that I don’t depend on any cloud service.
3. As a parent, I want to select a country vaccination schedule, so that I know what vaccines are recommended in my location.
4. As a parent, I want to switch between country schedules (e.g. Russia, Serbia, EU, US), so that I can understand differences after relocation.
5. As a parent, I want to see upcoming vaccines based on age, so that I can plan visits to the doctor.
6. As a parent, I want to mark vaccines as completed, so that the schedule updates automatically.
7. As a parent, I want to see equivalence between vaccines (e.g. Pentaxim vs DTaP-IPV-Hib), so that I understand medical records from different countries.
8. As a parent, I want to see vaccine components and translations (local name ↔ international name), so that I can communicate with doctors abroad.
9. As a parent, I want to export vaccination history as a document (PDF), so that I can provide it to clinics or schools.
10. As a parent, I want to import vaccination history from a file, so that I can migrate between devices.
11. As a parent, I want the app to work offline, so that I can use it during travel or without internet.
12. As a parent, I want a clean minimal UI focused only on vaccines, so that I am not distracted by unrelated features.
13. As a parent, I want optional “parent profile metadata” (name, country), so that the system can personalize schedules.
14. As a parent, I want reminders for upcoming vaccines (optional), so that I don’t miss critical dates.

---

## Implementation Decisions

### Architecture
- PWA (installable web app)
- Offline-first design
- Local persistence layer:
    - SQLite WASM OR
    - IndexedDB abstraction with SQLite-like schema model

### Core Modules (Deep Modules)

#### 1. ChildProfile Module
- Create / edit / delete child profiles
- Store birth date
- Link vaccination records

#### 2. VaccinationRecord Module
- Store administered vaccines
- Date, dose, vaccine type
- Link to vaccine identity system

#### 3. Vaccine Knowledge Graph Module (KEY MODULE)
- Canonical vaccine entities
- Cross-country mappings:
    - Local name
    - International name (WHO-style)
    - Composition mapping
- Example:
    - Pentaxim → DTaP-IPV-Hib
    - BCG → Bacillus Calmette–Guérin (country variants)

#### 4. Country Schedule Engine
- Predefined schedules per country:
    - Russia
    - Belarus
    - Serbia
    - EU (generalized)
    - US (CDC-based model abstraction)
- Computes:
    - due vaccines
    - upcoming vaccines by age
    - missed vaccines

#### 5. Calendar & Timeline Module
- Timeline view of vaccinations
- Age-based grouping
- Forecast of upcoming vaccines

#### 6. Export/Import Module
- Export:
    - PDF vaccination certificate
    - JSON backup file
- Import:
    - restore local DB state

#### 7. Local Storage Layer
- SQLite schema:
    - children
    - vaccinations
    - vaccine_catalog
    - schedule_rules
- Migration system:
    - versioned schema migrations
    - backward compatibility

---

## Testing Decisions

- Unit tests should focus on:
    - Vaccine mapping correctness (critical module)
    - Schedule engine logic (age-based computation)
    - Migration system reliability

Good test principles:
- Test behavior, not implementation details
- Deterministic inputs (fixed birthdates, fixed schedules)
- Cross-country mapping regression tests

Modules that MUST be tested:
1. Vaccine Knowledge Graph Module
2. Country Schedule Engine
3. VaccinationRecord consistency rules

---

## Out of Scope

- No full medical diagnostic features
- No social or community features
- No multi-user cloud synchronization system
- No hospital integrations (FHIR, EMR systems)
- No general child tracking (sleep, weight, nutrition, etc.)
- No advertising or monetization layer in MVP

---

## Further Notes

- The product is intentionally narrow: “vaccines only”
- Strong emphasis on real-world migration pain (country-to-country inconsistencies)
- Long-term value lies in:
    - vaccine normalization layer
    - offline-first reliability
    - simplicity over feature expansion

Potential future extensions (not MVP):
- Growth charts (only if explicitly requested later)
- Doctor notes section
- Multi-language UI for expats