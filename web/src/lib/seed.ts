/**
 * Schedule data sources (verify against current official publications before clinical use):
 *
 * Russia  — Приказ Минздрава № 1122н от 06.12.2021  https://minzdrav.gov.ru/documents/8559
 * Serbia  — Правилник о програму обавезних имунизација (2023)  https://www.batut.org.rs/index.php?content=1539
 * EU/ECDC — https://vaccine-schedule.ecdc.europa.eu/
 */

import type { Brand, Disease, ScheduleEntry } from './types'

export const diseases: Disease[] = [
  { id: 'bcg',        name: 'BCG (Tuberculosis)' },
  { id: 'hepb',       name: 'Hepatitis B' },
  { id: 'diphtheria', name: 'Diphtheria' },
  { id: 'tetanus',    name: 'Tetanus' },
  { id: 'pertussis',  name: 'Pertussis (Whooping Cough)' },
  { id: 'ipv',        name: 'Polio (IPV/OPV)' },
  { id: 'hib',        name: 'Haemophilus influenzae type b (Hib)' },
  { id: 'pcv',        name: 'Pneumococcal disease' },
  { id: 'rotavirus',  name: 'Rotavirus' },
  { id: 'measles',    name: 'Measles' },
  { id: 'mumps',      name: 'Mumps' },
  { id: 'rubella',    name: 'Rubella' },
  { id: 'varicella',  name: 'Varicella (Chickenpox)' },
  { id: 'menc',       name: 'Meningococcal C' },
  { id: 'hepa',       name: 'Hepatitis A' },
  { id: 'hpv',        name: 'Human Papillomavirus (HPV)' },
]

export const diseaseById: Record<string, Disease> = Object.fromEntries(diseases.map(d => [d.id, d]))

export const brands: Brand[] = [
  { id: 'pentaxim',      name: 'Pentaxim' },
  { id: 'infanrix_hexa', name: 'Infanrix Hexa' },
  { id: 'infanrix',      name: 'Infanrix' },
  { id: 'infanrix_ipv',  name: 'Infanrix IPV' },
  { id: 'hexaxim',       name: 'Hexaxim' },
  { id: 'bcg',           name: 'BCG' },
  { id: 'bcg_m',         name: 'BCG-M' },
  { id: 'engerix_b',     name: 'Engerix-B' },
  { id: 'euvax_b',       name: 'Euvax-B' },
  { id: 'regevar',       name: 'Regevak B' },
  { id: 'priorix',       name: 'Priorix' },
  { id: 'mmr_ii',        name: 'M-M-R II' },
  { id: 'varivax',       name: 'Varivax' },
  { id: 'varilrix',      name: 'Varilrix' },
  { id: 'prevenar_13',   name: 'Prevenar 13' },
  { id: 'synflorix',     name: 'Synflorix' },
  { id: 'rotateq',       name: 'RotaTeq' },
  { id: 'rotarix',       name: 'Rotarix' },
  { id: 'menjugate',     name: 'Menjugate' },
  { id: 'neisvac_c',     name: 'NeisVac-C' },
  { id: 'nimenrix',      name: 'Nimenrix' },
  { id: 'gardasil_9',    name: 'Gardasil 9' },
  { id: 'cervarix',      name: 'Cervarix' },
  { id: 'havrix',        name: 'Havrix' },
  { id: 'avaxim',        name: 'Avaxim' },
  { id: 'akds',          name: 'АКДС (DTP)' },
  { id: 'ads_m',         name: 'АДС-М (ADS-M)' },
  { id: 'opv',           name: 'ОПВ (OPV)' },
]

export const brandCoverage: Record<string, string[]> = {
  pentaxim:      ['diphtheria', 'tetanus', 'pertussis', 'ipv', 'hib'],
  infanrix_hexa: ['diphtheria', 'tetanus', 'pertussis', 'ipv', 'hib', 'hepb'],
  infanrix:      ['diphtheria', 'tetanus', 'pertussis'],
  infanrix_ipv:  ['diphtheria', 'tetanus', 'pertussis', 'ipv'],
  hexaxim:       ['diphtheria', 'tetanus', 'pertussis', 'ipv', 'hib', 'hepb'],
  bcg:           ['bcg'],
  bcg_m:         ['bcg'],
  engerix_b:     ['hepb'],
  euvax_b:       ['hepb'],
  regevar:       ['hepb'],
  priorix:       ['measles', 'mumps', 'rubella'],
  mmr_ii:        ['measles', 'mumps', 'rubella'],
  varivax:       ['varicella'],
  varilrix:      ['varicella'],
  prevenar_13:   ['pcv'],
  synflorix:     ['pcv'],
  rotateq:       ['rotavirus'],
  rotarix:       ['rotavirus'],
  menjugate:     ['menc'],
  neisvac_c:     ['menc'],
  nimenrix:      ['menc'],
  gardasil_9:    ['hpv'],
  cervarix:      ['hpv'],
  havrix:        ['hepa'],
  avaxim:        ['hepa'],
  akds:          ['diphtheria', 'tetanus', 'pertussis'],
  ads_m:         ['diphtheria', 'tetanus'],
  opv:           ['ipv'],
}

function entries(list: [string, string, number, number][], country: 'RUSSIA' | 'SERBIA' | 'EU', prefix: string): ScheduleEntry[] {
  return list.map(([, disease, ageWeeks, doseNumber]) => ({
    id: `${prefix}_${disease}_${doseNumber}`,
    country,
    diseaseId: disease,
    ageWeeks,
    doseNumber,
    necessity: 'MANDATORY' as const
  }))
}

export const scheduleEntries: ScheduleEntry[] = [
  ...entries([
    ['', 'hepb',        0,  1], ['', 'hepb',        4,  2], ['', 'hepb',       26,  3],
    ['', 'bcg',         0,  1],
    ['', 'diphtheria', 13,  1], ['', 'diphtheria', 19,  2], ['', 'diphtheria', 26,  3], ['', 'diphtheria', 78, 4],
    ['', 'tetanus',    13,  1], ['', 'tetanus',    19,  2], ['', 'tetanus',    26,  3], ['', 'tetanus',    78, 4],
    ['', 'pertussis',  13,  1], ['', 'pertussis',  19,  2], ['', 'pertussis',  26,  3], ['', 'pertussis',  78, 4],
    ['', 'ipv',        13,  1], ['', 'ipv',        19,  2], ['', 'ipv',        26,  3], ['', 'ipv',        78, 4], ['', 'ipv', 87, 5],
    ['', 'hib',        13,  1], ['', 'hib',        19,  2], ['', 'hib',        26,  3], ['', 'hib',        78, 4],
    ['', 'pcv',         8,  1], ['', 'pcv',        19,  2], ['', 'pcv',        65,  3],
    ['', 'measles',    52,  1], ['', 'measles',   312,  2],
    ['', 'mumps',      52,  1], ['', 'mumps',     312,  2],
    ['', 'rubella',    52,  1], ['', 'rubella',   312,  2],
    ['', 'varicella',  52,  1],
  ], 'RUSSIA', 'ru'),

  ...entries([
    ['', 'bcg',         0,  1],
    ['', 'hepb',        0,  1], ['', 'hepb',        8,  2], ['', 'hepb',       30,  3],
    ['', 'diphtheria',  8,  1], ['', 'diphtheria', 16,  2], ['', 'diphtheria', 24,  3], ['', 'diphtheria', 78, 4],
    ['', 'tetanus',     8,  1], ['', 'tetanus',    16,  2], ['', 'tetanus',    24,  3], ['', 'tetanus',    78, 4],
    ['', 'pertussis',   8,  1], ['', 'pertussis',  16,  2], ['', 'pertussis',  24,  3], ['', 'pertussis',  78, 4],
    ['', 'ipv',         8,  1], ['', 'ipv',        16,  2], ['', 'ipv',        24,  3], ['', 'ipv',        78, 4],
    ['', 'hib',         8,  1], ['', 'hib',        16,  2], ['', 'hib',        24,  3], ['', 'hib',        78, 4],
    ['', 'pcv',         8,  1], ['', 'pcv',        16,  2], ['', 'pcv',        52,  3],
    ['', 'measles',    52,  1], ['', 'measles',   260,  2],
    ['', 'mumps',      52,  1], ['', 'mumps',     260,  2],
    ['', 'rubella',    52,  1], ['', 'rubella',   260,  2],
  ], 'SERBIA', 'rs'),

  ...entries([
    ['', 'hepb',        0,  1], ['', 'hepb',        8,  2], ['', 'hepb',       24,  3],
    ['', 'diphtheria',  8,  1], ['', 'diphtheria', 16,  2], ['', 'diphtheria', 26,  3], ['', 'diphtheria', 52, 4],
    ['', 'tetanus',     8,  1], ['', 'tetanus',    16,  2], ['', 'tetanus',    26,  3], ['', 'tetanus',    52, 4],
    ['', 'pertussis',   8,  1], ['', 'pertussis',  16,  2], ['', 'pertussis',  26,  3], ['', 'pertussis',  52, 4],
    ['', 'ipv',         8,  1], ['', 'ipv',        16,  2], ['', 'ipv',        26,  3], ['', 'ipv',        52, 4],
    ['', 'hib',         8,  1], ['', 'hib',        16,  2], ['', 'hib',        26,  3], ['', 'hib',        52, 4],
    ['', 'pcv',         8,  1], ['', 'pcv',        16,  2], ['', 'pcv',        52,  3],
    ['', 'measles',    52,  1], ['', 'measles',   260,  2],
    ['', 'mumps',      52,  1], ['', 'mumps',     260,  2],
    ['', 'rubella',    52,  1], ['', 'rubella',   260,  2],
    ['', 'varicella',  52,  1], ['', 'varicella',  78,  2],
    ['', 'menc',       52,  1],
  ], 'EU', 'eu'),
]
