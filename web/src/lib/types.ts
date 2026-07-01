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
}

export interface Brand {
  id: string
  name: string
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
