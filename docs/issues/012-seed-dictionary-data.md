# 012 — Seed dictionary data

**Type:** Research / Data
**Blocked by:** 011

## What to do

The Dictionary detail pages (added in 011) show placeholder text for all diseases and brands. This issue tracks filling in the real content.

### Diseases (16 entries)

For each disease in `seed.ts`, add:
- `description`: 2–3 sentences explaining what the disease is (cause, how it spreads)
- `symptoms`: 1–2 sentences on key symptoms

Diseases to fill: BCG (Tuberculosis), Hepatitis B, Diphtheria, Tetanus, Pertussis, Polio (IPV/OPV), Haemophilus influenzae type b, Pneumococcal disease, Rotavirus, Measles, Mumps, Rubella, Varicella, Meningococcal C, Hepatitis A, HPV.

Sources: WHO fact sheets, CDC disease pages (public domain).

### Brands (28 entries)

For each brand in `seed.ts`, add:
- `approvedIn`: list of country codes where approved (e.g. `['RU', 'RS', 'EU', 'US']`)
- `description`: 1 sentence — manufacturer + key use case

Brands to fill: Pentaxim, Infanrix Hexa, Infanrix, Infanrix IPV, Hexaxim, BCG, BCG-M, Engerix-B, Euvax-B, Regevak B, Priorix, M-M-R II, Varivax, Varilrix, Prevenar 13, Synflorix, RotaTeq, Rotarix, Menjugate, NeisVac-C, Nimenrix, Gardasil 9, Cervarix, Havrix, Avaxim, АКДС (DTP), АДС-М, ОПВ (OPV).

Sources: EMA product pages, manufacturer SmPCs, WHO prequalification list.

## Acceptance criteria

- [ ] All 16 diseases have non-placeholder `description` and `symptoms`
- [ ] All 28 brands have non-placeholder `description` and `approvedIn`
- [ ] Sources cited in a comment above each entry in `seed.ts`
