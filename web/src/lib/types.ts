export type Country = 'RUSSIA' | 'SERBIA' | 'EU' | 'WHO' | 'US_AAP' | 'US_CDC_2026'

export const COUNTRY_LABELS: Record<Country, string> = {
  RUSSIA: 'Russia',
  SERBIA: 'Serbia',
  EU: 'European Union',
  WHO: 'WHO (Global Reference)',
  US_AAP: 'United States (AAP)',
  US_CDC_2026: 'United States (CDC 2026)'
}

export type ScheduleStatus = 'DONE' | 'HIGHLIGHTED' | 'UPCOMING'

export interface Disease {
  id: string
  name: string
  description?: string
  symptoms?: string
}

export interface Brand {
  id: string
  name: string
  description?: string
  country?: string  // manufacturer country
}

export interface Child {
  id: string
  name: string
  birthDate: string  // YYYY-MM-DD
  country: Country
  sex?: 'MALE' | 'FEMALE'
  photo?: string  // base64 data URL
}

interface VaccinationRecordCommon {
  id: string
  childId: string
  date: string  // YYYY-MM-DD
  diseaseIds: string[]
  notes?: string
}

export type VaccinationRecord = VaccinationRecordCommon & (
  | { kind: 'vaccine', brandId?: string, customBrandName?: string, serialNumber?: string }
  | { kind: 'illness' }
)

export interface ScheduleEntry {
  id: string
  country: Country
  diseaseId: string
  ageWeeks: number
  doseNumber: number
  necessity: 'MANDATORY' | 'OPTIONAL'
  note?: string
}

export interface ScheduleResult {
  entry: ScheduleEntry
  disease: Disease
  status: ScheduleStatus
  coveredByRecord?: VaccinationRecord
}

// A vaccine with no fixed age milestone (e.g. annual flu shot) — tracked by count/last-date, not the age matrix.
export interface RecurringEntry {
  id: string
  country: Country
  diseaseId: string
  necessity: 'MANDATORY' | 'OPTIONAL'
  note?: string
}
