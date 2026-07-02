import { diseaseById, scheduleEntries } from './seed'
import type { Child, Disease, ScheduleResult, ScheduleStatus, VaccinationRecord } from './types'

export function diseasesFor(record: VaccinationRecord): Set<string> {
  return new Set(record.diseaseIds)
}

export function childAgeWeeks(birthDate: string): number {
  const ms = Date.now() - new Date(birthDate).getTime()
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000))
}

export function computeSchedule(child: Child, records: VaccinationRecord[]): ScheduleResult[] {
  const ageWeeks = childAgeWeeks(child.birthDate)
  const entries = scheduleEntries.filter(e => e.country === child.country)

  return entries.map(entry => {
    const covering = records
      .filter(r => diseasesFor(r).has(entry.diseaseId))
      .sort((a, b) => a.date.localeCompare(b.date))

    const status: ScheduleStatus =
      covering.length >= entry.doseNumber ? 'DONE'
      : ageWeeks > entry.ageWeeks         ? 'HIGHLIGHTED'
      :                                     'UPCOMING'

    return { entry, disease: diseaseById[entry.diseaseId]!, status, coveredByRecord: covering[entry.doseNumber - 1] }
  }).sort((a, b) => a.entry.ageWeeks - b.entry.ageWeeks || a.entry.doseNumber - b.entry.doseNumber)
}

export function scheduleMilestones(schedule: ScheduleResult[]): number[] {
  return [...new Set(schedule.map(r => r.entry.ageWeeks))].sort((a, b) => a - b)
}

export function scheduleDiseases(schedule: ScheduleResult[]): Disease[] {
  return [...new Map(schedule.map(r => [r.disease.id, r.disease])).values()]
}

export function weeksToLabel(w: number): string {
  const m: Record<number, string> = {
    0: 'Birth', 4: '1m', 8: '2m', 13: '3m', 16: '4m', 19: '4.5m',
    24: '6m', 26: '6m+', 30: '7m', 52: '12m', 65: '15m', 78: '18m',
    87: '20m', 260: '5yr', 312: '6yr'
  }
  return m[w] ?? `${w}w`
}
