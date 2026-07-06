/**
 * Schedule data sources (verify against current official publications before clinical use):
 *
 * Russia  — Приказ Минздрава № 1122н от 06.12.2021  https://minzdrav.gov.ru/documents/8559
 * Serbia  — Правилник о програму обавезних имунизација (2023)  https://www.batut.org.rs/index.php?content=1539
 * EU/ECDC — https://vaccine-schedule.ecdc.europa.eu/
 */

import type { Brand, Disease, RecurringEntry, ScheduleEntry } from './types'

// Sources: WHO fact sheets (who.int/news-room/fact-sheets) and CDC disease pages (cdc.gov/vaccines/pubs/pinkbook), public domain.
export const diseases: Disease[] = [
  { id: 'bcg',        name: 'BCG (Tuberculosis)',                    description: 'Tuberculosis is a bacterial infection caused by Mycobacterium tuberculosis that mainly affects the lungs. It spreads through the air when infected people cough, sneeze, or speak.', symptoms: 'Persistent cough, chest pain, fatigue, fever, night sweats, and weight loss; in children it can also cause severe disseminated or meningeal disease.' },
  { id: 'hepb',       name: 'Hepatitis B',                           description: 'Hepatitis B is a liver infection caused by the hepatitis B virus (HBV), spread through contact with infected blood or body fluids, including from mother to child at birth.', symptoms: 'Often no symptoms, especially in young children; when present, includes jaundice, dark urine, fatigue, and abdominal pain. Chronic infection can lead to cirrhosis or liver cancer.' },
  { id: 'diphtheria', name: 'Diphtheria',                            description: 'Diphtheria is a bacterial infection caused by toxin-producing Corynebacterium diphtheriae, spread through respiratory droplets or close contact.', symptoms: 'Sore throat, fever, and a thick gray coating in the throat that can block breathing; the toxin can also damage the heart and nerves.' },
  { id: 'tetanus',    name: 'Tetanus',                               description: 'Tetanus is caused by toxin from Clostridium tetani bacteria, which enter the body through cuts or wounds contaminated with soil or dust; it does not spread person to person.', symptoms: 'Painful muscle stiffness and spasms, typically starting in the jaw ("lockjaw"), which can progress to affect breathing.' },
  { id: 'pertussis',  name: 'Pertussis (Whooping Cough)',            description: 'Pertussis is a highly contagious respiratory infection caused by Bordetella pertussis bacteria, spread through coughing and sneezing.', symptoms: 'Severe coughing fits often followed by a high-pitched "whoop," which can be life-threatening in young infants.' },
  { id: 'ipv',        name: 'Polio (IPV/OPV)',                       description: 'Poliomyelitis is caused by poliovirus, which spreads mainly through the fecal-oral route and can invade the nervous system.', symptoms: 'Most infections are asymptomatic; a small proportion cause fever, fatigue, and irreversible paralysis, usually of the legs.' },
  { id: 'hib',        name: 'Haemophilus influenzae type b (Hib)',   description: 'Hib is a bacterial infection caused by Haemophilus influenzae type b, spread through respiratory droplets, that mainly affects young children.', symptoms: 'Can cause meningitis, pneumonia, and epiglottitis, with symptoms including fever, stiff neck, and difficulty breathing.' },
  { id: 'pcv',        name: 'Pneumococcal disease',                  description: 'Pneumococcal disease is caused by Streptococcus pneumoniae bacteria, spread through respiratory droplets, and is a leading cause of severe illness in young children.', symptoms: 'Ranges from ear infections and sinusitis to pneumonia, bloodstream infection, and meningitis, with fever and cough among common signs.' },
  { id: 'rotavirus',  name: 'Rotavirus',                             description: 'Rotavirus is a highly contagious virus spread through the fecal-oral route and is the leading cause of severe diarrheal disease in infants and young children worldwide.', symptoms: 'Severe watery diarrhea, vomiting, and fever, which can quickly lead to dehydration.' },
  { id: 'measles',    name: 'Measles',                               description: 'Measles is caused by a highly contagious morbillivirus that spreads through the air via coughing and sneezing.', symptoms: 'High fever, cough, runny nose, red watery eyes, and a characteristic full-body rash; can lead to pneumonia or encephalitis.' },
  { id: 'mumps',      name: 'Mumps',                                 description: 'Mumps is a contagious viral infection spread through saliva and respiratory droplets, mainly affecting the salivary glands.', symptoms: 'Fever, headache, and painful swelling of the salivary glands under the ears; can rarely cause meningitis or orchitis.' },
  { id: 'rubella',    name: 'Rubella',                               description: 'Rubella (German measles) is caused by the rubella virus, spread through respiratory droplets; infection during early pregnancy can cause severe birth defects.', symptoms: 'Usually mild — low fever, rash, and swollen lymph nodes — but can cause congenital rubella syndrome in a developing fetus.' },
  { id: 'varicella',  name: 'Varicella (Chickenpox)',                description: 'Varicella is caused by the varicella-zoster virus and spreads easily through respiratory droplets or contact with fluid from the rash.', symptoms: 'Itchy, blister-like rash along with fever and fatigue; can lead to skin infection or, rarely, pneumonia and encephalitis.' },
  { id: 'menc',       name: 'Meningococcal C',                       description: 'Meningococcal disease is caused by Neisseria meningitidis serogroup C bacteria, spread through respiratory or throat secretions during close contact.', symptoms: 'Sudden fever, headache, stiff neck, and rash; can progress rapidly to life-threatening meningitis or bloodstream infection.' },
  { id: 'hepa',       name: 'Hepatitis A',                           description: 'Hepatitis A is a liver infection caused by the hepatitis A virus, spread mainly through contaminated food or water and close contact.', symptoms: 'Fever, fatigue, nausea, abdominal pain, and jaundice; usually self-limiting without chronic infection.' },
  { id: 'hpv',        name: 'Human Papillomavirus (HPV)',            description: 'HPV is a very common sexually transmitted virus; certain high-risk types cause most cervical cancers and other genital and throat cancers.', symptoms: 'Most infections cause no symptoms and clear on their own; persistent high-risk infection can lead to precancerous changes and cancer years later.' },
  { id: 'menb',       name: 'Meningococcal B',                       description: 'Meningococcal disease is caused by Neisseria meningitidis serogroup B bacteria, spread through respiratory or throat secretions during close contact; the leading meningococcal serogroup in infants across much of Europe.', symptoms: 'Sudden fever, headache, stiff neck, and rash; can progress rapidly to life-threatening meningitis or bloodstream infection.' },
  { id: 'influenza',  name: 'Influenza (Flu)',                       description: 'Influenza is a contagious respiratory virus spread through droplets, with new circulating strains each year requiring annual re-vaccination.', symptoms: 'Fever, cough, sore throat, muscle aches, and fatigue; can lead to pneumonia or worsen chronic conditions, especially in young children.' },
  { id: 'tbe',        name: 'Tick-borne Encephalitis (TBE)',         description: 'TBE is caused by a flavivirus transmitted through the bite of infected ticks, endemic to forested regions of Central/Eastern Europe and parts of Russia.', symptoms: 'Fever and flu-like symptoms initially; a minority progress to encephalitis or meningitis with headache, stiff neck, and neurological symptoms.' },
  { id: 'rsv',        name: 'Respiratory Syncytial Virus (RSV)',     description: 'RSV is a common respiratory virus and the leading cause of severe lower respiratory tract infection in infants; prevention is via a long-acting monoclonal antibody given at birth or before RSV season rather than a traditional vaccine.', symptoms: 'Cough, congestion, and fever; in infants can progress to bronchiolitis or pneumonia with wheezing and difficulty breathing.' },
]

export const diseaseById: Record<string, Disease> = Object.fromEntries(diseases.map(d => [d.id, d]))

// Sources: EMA product pages, FDA package inserts, manufacturer sites, and Russian State Register
// of Medicines (grls.rosminzdrav.ru) for RU-only entries. See per-entry comment for the specific page.
export const brands: Brand[] = [
  // Sanofi Pasteur SmPC — campus.sanofi/dam/jcr:acf325db-1836-4520-8eac-4e26f280cda8/Pentaxim-API.pdf
  { id: 'pentaxim',      name: 'Pentaxim',      description: 'Sanofi combination vaccine protecting against diphtheria, tetanus, pertussis, polio, and Hib disease.', country: 'France' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/infanrix-hexa
  { id: 'infanrix_hexa', name: 'Infanrix Hexa', description: 'GSK combination vaccine protecting against diphtheria, tetanus, pertussis, hepatitis B, polio, and Hib disease.', country: 'Belgium' },
  // FDA — fda.gov/vaccines-blood-biologics/vaccines/infanrix
  { id: 'infanrix',      name: 'Infanrix',       description: 'GSK combination vaccine protecting against diphtheria, tetanus, and pertussis.', country: 'Belgium' },
  // EMA national-procedure listing — ema.europa.eu
  { id: 'infanrix_ipv',  name: 'Infanrix IPV',  description: 'GSK combination vaccine protecting against diphtheria, tetanus, pertussis, and polio.', country: 'Belgium' },
  // EMA EPAR (as Hexacima) — ema.europa.eu/en/medicines/human/EPAR/hexacima
  { id: 'hexaxim',       name: 'Hexaxim',        description: 'Sanofi fully-liquid combination vaccine protecting against diphtheria, tetanus, pertussis, hepatitis B, polio, and Hib disease.', country: 'France' },
  // Microgen — microgen.ru/en/products/vaktsiny/
  { id: 'bcg',           name: 'BCG',            description: 'Microgen live attenuated vaccine protecting against tuberculosis.', country: 'Russia' },
  // Microgen — microgen.ru/en/products/vaktsiny/vaktsina-tuberkuleznaya-dlya-shchadyashchey-pervichnoy-immunizatsii-btszh-m/
  { id: 'bcg_m',         name: 'BCG-M',          description: 'Microgen reduced-antigen tuberculosis vaccine for gentle primary immunization of premature or weaker infants.', country: 'Russia' },
  // EMA EPAR / FDA package insert
  { id: 'engerix_b',     name: 'Engerix-B',      description: 'GSK recombinant vaccine protecting against hepatitis B.', country: 'Belgium' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'euvax_b',       name: 'Euvax-B',        description: 'LG Chem/Sanofi recombinant vaccine protecting against hepatitis B.', country: 'South Korea' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'regevar',       name: 'Regevak B',      description: 'Russian (Binnofarm Group/Nacimbio) recombinant vaccine protecting against hepatitis B.', country: 'Russia' },
  // GSK press release — gsk.com/en-gb/media/press-releases/gsk-announces-us-fda-approval-of-priorix
  { id: 'priorix',       name: 'Priorix',        description: 'GSK live attenuated vaccine protecting against measles, mumps, and rubella.', country: 'Belgium' },
  // FDA — fda.gov/vaccines-blood-biologics/vaccines/measles-mumps-and-rubella-virus-vaccine-live
  { id: 'mmr_ii',        name: 'M-M-R II',       description: 'Merck live attenuated vaccine protecting against measles, mumps, and rubella.', country: 'United States' },
  // FDA — fda.gov/vaccines-blood-biologics/vaccines/varivax-refrigerated-and-frozen-formulations
  { id: 'varivax',       name: 'Varivax',        description: 'Merck live attenuated vaccine protecting against varicella (chickenpox).', country: 'United States' },
  // EMA referral — ema.europa.eu/en/medicines/human/referrals/varilrix
  { id: 'varilrix',      name: 'Varilrix',       description: 'GSK live attenuated vaccine protecting against varicella (chickenpox).', country: 'Belgium' },
  // Pfizer press release — pfizer.com (Prevnar 13 FDA approval)
  { id: 'prevenar_13',   name: 'Prevenar 13',    description: 'Pfizer conjugate vaccine protecting against 13 serotypes of pneumococcal disease.', country: 'United States' },
  // GSK press release — gsk.com/en-gb/media/press-releases/synflorix-glaxosmithkline-s-pneumococcal-vaccine-receives-european-authorisation/
  { id: 'synflorix',     name: 'Synflorix',      description: 'GSK conjugate vaccine protecting against 10 serotypes of pneumococcal disease.', country: 'Belgium' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/rotateq
  { id: 'rotateq',       name: 'RotaTeq',        description: 'Merck oral pentavalent vaccine protecting against rotavirus gastroenteritis.', country: 'United States' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/rotarix
  { id: 'rotarix',       name: 'Rotarix',        description: 'GSK oral vaccine protecting against rotavirus gastroenteritis.', country: 'Belgium' },
  // EMA national-procedure listing — ema.europa.eu
  { id: 'menjugate',     name: 'Menjugate',      description: 'GSK conjugate vaccine protecting against meningococcal group C disease.', country: 'Italy' },
  // EMA national-procedure listing — ema.europa.eu
  { id: 'neisvac_c',     name: 'NeisVac-C',      description: 'Pfizer conjugate vaccine protecting against meningococcal group C disease.', country: 'United States' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/nimenrix
  { id: 'nimenrix',      name: 'Nimenrix',       description: 'Pfizer conjugate vaccine protecting against meningococcal groups A, C, W-135, and Y.', country: 'United States' },
  // FDA — fda.gov/vaccines-blood-biologics/vaccines/gardasil-9
  { id: 'gardasil_9',    name: 'Gardasil 9',     description: 'Merck recombinant vaccine protecting against 9 HPV types linked to cervical and other cancers.', country: 'United States' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/cervarix
  { id: 'cervarix',      name: 'Cervarix',       description: 'GSK bivalent vaccine protecting against HPV types 16 and 18 linked to cervical cancer.', country: 'Belgium' },
  // EMA referral — ema.europa.eu/en/medicines/human/referrals/havrix
  { id: 'havrix',        name: 'Havrix',         description: 'GSK inactivated vaccine protecting against hepatitis A.', country: 'Belgium' },
  // Manufacturer SmPC — medicines.org.uk/emc/product/1394/smpc
  { id: 'avaxim',        name: 'Avaxim',         description: 'Sanofi inactivated vaccine protecting against hepatitis A.', country: 'France' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'akds',          name: 'АКДС (DTP)',     description: 'Microgen whole-cell vaccine protecting against diphtheria, tetanus, and pertussis.', country: 'Russia' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'ads_m',         name: 'АДС-М (ADS-M)', description: 'Microgen reduced-dose diphtheria-tetanus toxoid booster vaccine for older children and adults.', country: 'Russia' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'opv',           name: 'ОПВ (OPV)',      description: 'Russian-manufactured oral live-attenuated vaccine protecting against poliomyelitis types 1–3.', country: 'Russia' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/bexsero
  { id: 'bexsero',       name: 'Bexsero',        description: 'GSK (formerly Novartis) multicomponent vaccine protecting against meningococcal group B disease.', country: 'Italy' },
  // FDA — fda.gov/vaccines-blood-biologics/vaccines/menactra
  { id: 'menactra',      name: 'Menactra',       description: 'Sanofi conjugate vaccine protecting against meningococcal groups A, C, W-135, and Y.', country: 'United States' },
  // EMA national-procedure listing — ema.europa.eu
  { id: 'fsme_junior',   name: 'FSME-Immun Junior', description: 'Pfizer inactivated vaccine protecting against tick-borne encephalitis, for children.', country: 'Austria' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'ultrix',        name: 'Ультрикс (Ultrix)', description: 'Russian (FORT) inactivated split-virion vaccine protecting against seasonal influenza.', country: 'Russia' },
  // EMA national-procedure listing — ema.europa.eu
  { id: 'vaxigrip_tetra', name: 'Vaxigrip Tetra', description: 'Sanofi inactivated quadrivalent vaccine protecting against seasonal influenza.', country: 'France' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/beyfortus
  { id: 'beyfortus',     name: 'Beyfortus',      description: 'Sanofi/AstraZeneca long-acting monoclonal antibody protecting infants against RSV disease for a full season.', country: 'France' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/menveo
  { id: 'menveo',        name: 'Menveo',         description: 'GSK conjugate vaccine protecting against meningococcal groups A, C, W-135, and Y.', country: 'Italy' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/menquadfi
  { id: 'menquadfi',     name: 'MenQuadfi',      description: 'Sanofi conjugate vaccine protecting against meningococcal groups A, C, W-135, and Y.', country: 'France' },
  // FDA — fda.gov/vaccines-blood-biologics/vaccines/trumenba
  { id: 'trumenba',      name: 'Trumenba',       description: 'Pfizer recombinant vaccine protecting against meningococcal group B disease.', country: 'United States' },
  // FDA — fda.gov/vaccines-blood-biologics/vaccines/prevnar-20
  { id: 'prevenar_20',   name: 'Prevenar 20',    description: 'Pfizer conjugate vaccine protecting against 20 serotypes of pneumococcal disease.', country: 'United States' },
  // EMA EPAR — ema.europa.eu/en/medicines/human/EPAR/boostrix
  { id: 'boostrix',      name: 'Boostrix',       description: 'GSK reduced-antigen booster vaccine protecting against diphtheria, tetanus, and pertussis for older children and adults.', country: 'Belgium' },
  // FDA — fda.gov/vaccines-blood-biologics/vaccines/adacel
  { id: 'adacel',        name: 'Adacel',         description: 'Sanofi reduced-antigen booster vaccine protecting against diphtheria, tetanus, and pertussis for older children and adults.', country: 'United States' },
  // EMA national-procedure listing — ema.europa.eu
  { id: 'tetraxim',      name: 'Tetraxim',       description: 'Sanofi combination vaccine protecting against diphtheria, tetanus, pertussis, and polio.', country: 'France' },
  // EMA national-procedure listing — ema.europa.eu
  { id: 'influvac_tetra', name: 'Influvac Tetra', description: 'Abbott inactivated quadrivalent subunit vaccine protecting against seasonal influenza.', country: 'Netherlands' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'grippol_plus',  name: 'Гриппол Плюс (Grippol Plus)', description: 'Petrovax adjuvanted trivalent vaccine protecting against seasonal influenza, for children.', country: 'Russia' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'grippol_quadrivalent', name: 'Гриппол Квадривалент (Grippol Quadrivalent)', description: 'Petrovax adjuvanted quadrivalent vaccine protecting against seasonal influenza.', country: 'Russia' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'sovigripp',     name: 'Совигрипп (Sovigripp)', description: 'Microgen adjuvanted trivalent vaccine protecting against seasonal influenza.', country: 'Russia' },
  // Russian State Register of Medicines — grls.rosminzdrav.ru
  { id: 'ultrix_quadri', name: 'Ультрикс Квадри (Ultrix Quadri)', description: 'Russian (FORT) inactivated split-virion quadrivalent vaccine protecting against seasonal influenza.', country: 'Russia' },
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
  bexsero:       ['menb'],
  menactra:      ['menc'],
  fsme_junior:   ['tbe'],
  ultrix:        ['influenza'],
  vaxigrip_tetra: ['influenza'],
  beyfortus:     ['rsv'],
  menveo:        ['menc'],
  menquadfi:     ['menc'],
  trumenba:      ['menb'],
  prevenar_20:   ['pcv'],
  boostrix:      ['diphtheria', 'tetanus', 'pertussis'],
  adacel:        ['diphtheria', 'tetanus', 'pertussis'],
  tetraxim:      ['diphtheria', 'tetanus', 'pertussis', 'ipv'],
  influvac_tetra: ['influenza'],
  grippol_plus:  ['influenza'],
  grippol_quadrivalent: ['influenza'],
  sovigripp:     ['influenza'],
  ultrix_quadri: ['influenza'],
}

function entries(list: [string, string, number, number, ('MANDATORY' | 'OPTIONAL')?][], country: 'RUSSIA' | 'SERBIA' | 'EU', prefix: string): ScheduleEntry[] {
  return list.map(([, disease, ageWeeks, doseNumber, necessity]) => ({
    id: `${prefix}_${disease}_${doseNumber}`,
    country,
    diseaseId: disease,
    ageWeeks,
    doseNumber,
    necessity: necessity ?? 'MANDATORY'
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
    ['', 'varicella',  52,  1, 'OPTIONAL'],
    ['', 'rotavirus',   8,  1, 'OPTIONAL'], ['', 'rotavirus',  16,  2, 'OPTIONAL'],
    ['', 'hpv',       572,  1, 'OPTIONAL'],
    ['', 'hepa',       52,  1, 'OPTIONAL'], ['', 'hepa',       82,  2, 'OPTIONAL'],
    ['', 'menb',        8,  1, 'OPTIONAL'], ['', 'menb',       16,  2, 'OPTIONAL'], ['', 'menb',       52,  3, 'OPTIONAL'],
    ['', 'tbe',        83,  1, 'OPTIONAL'], ['', 'tbe',       100,  2, 'OPTIONAL'],
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
    ['', 'rotavirus',   8,  1, 'OPTIONAL'], ['', 'rotavirus',  16,  2, 'OPTIONAL'],
    ['', 'hpv',       572,  1, 'OPTIONAL'],
    ['', 'hepa',       52,  1, 'OPTIONAL'], ['', 'hepa',       82,  2, 'OPTIONAL'],
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
    ['', 'rotavirus',   8,  1, 'OPTIONAL'], ['', 'rotavirus',  16,  2, 'OPTIONAL'],
    ['', 'hpv',       572,  1, 'OPTIONAL'],
    ['', 'hepa',       52,  1, 'OPTIONAL'], ['', 'hepa',       82,  2, 'OPTIONAL'],
    ['', 'menb',        8,  1, 'OPTIONAL'], ['', 'menb',       16,  2, 'OPTIONAL'], ['', 'menb',       52,  3, 'OPTIONAL'],
    ['', 'tbe',        83,  1, 'OPTIONAL'], ['', 'tbe',       100,  2, 'OPTIONAL'],
    ['', 'rsv',         0,  1, 'OPTIONAL'],
  ], 'EU', 'eu'),
]

// Annual/seasonal vaccines with no fixed age milestone — tracked by count/last-date instead of the age matrix.
export const recurringEntries: RecurringEntry[] = [
  { id: 'ru_influenza', country: 'RUSSIA', diseaseId: 'influenza', necessity: 'MANDATORY' },
  { id: 'rs_influenza', country: 'SERBIA', diseaseId: 'influenza', necessity: 'OPTIONAL' },
  { id: 'eu_influenza', country: 'EU',     diseaseId: 'influenza', necessity: 'OPTIONAL' },
]
