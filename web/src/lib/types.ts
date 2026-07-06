export type Country = 'RUSSIA' | 'SERBIA' | 'EU'

export const COUNTRY_LABELS: Record<Country, string> = {
  RUSSIA: 'Russia',
  SERBIA: 'Serbia',
  EU: 'European Union'
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

export interface VaccinationRecord {
  id: string
  childId: string
  date: string  // YYYY-MM-DD
  brandId?: string
  customBrandName?: string
  diseaseIds: string[]
  serialNumber?: string
  notes?: string
}

export interface ScheduleEntry {
  id: string
  country: Country
  diseaseId: string
  ageWeeks: number
  doseNumber: number
  necessity: 'MANDATORY' | 'OPTIONAL'
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
}
