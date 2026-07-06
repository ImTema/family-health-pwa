import { brands, diseaseById, recurringEntries, scheduleEntries } from './seed'
import type { Child, Country, Disease, RecurringEntry, ScheduleResult, ScheduleStatus, VaccinationRecord } from './types'

export function diseasesFor(record: VaccinationRecord): Set<string> {
  return new Set(record.diseaseIds)
}

export function brandNameFor(record: VaccinationRecord): string {
  if (record.kind === 'illness') return 'Illness'
  return brands.find(b => b.id === record.brandId)?.name ?? record.customBrandName ?? ''
}

export function diseaseNamesFor(record: VaccinationRecord): string[] {
  return [...diseasesFor(record)].map(id => diseaseById[id]?.name).filter(Boolean) as string[]
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

export interface RecurringResult {
  entry: RecurringEntry
  disease: Disease
  count: number
  lastDate?: string
}

export function recurringFor(country: Country, records: VaccinationRecord[]): RecurringResult[] {
  return recurringEntries.filter(e => e.country === country).map(entry => {
    const covering = records.filter(r => diseasesFor(r).has(entry.diseaseId)).sort((a, b) => b.date.localeCompare(a.date))
    return { entry, disease: diseaseById[entry.diseaseId]!, count: covering.length, lastDate: covering[0]?.date }
  })
}

// Groups records by Venn-diagram atomic region: diseases covered by the exact same
// set of records land in one group, so a record can appear in more than one group.
export function groupRecordsByDisease(records: VaccinationRecord[]): Map<string, VaccinationRecord[]> {
  const recordsByDisease = new Map<string, Set<VaccinationRecord>>()
  const otherRecords: VaccinationRecord[] = []

  for (const r of records) {
    const names = diseaseNamesFor(r)
    if (names.length === 0) { otherRecords.push(r); continue }
    for (const name of names) {
      if (!recordsByDisease.has(name)) recordsByDisease.set(name, new Set())
      recordsByDisease.get(name)!.add(r)
    }
  }

  const regions = new Map<string, { records: Set<VaccinationRecord>; diseases: string[] }>()
  for (const [disease, sig] of recordsByDisease) {
    const signatureKey = [...sig].map(r => r.id).sort().join('|')
    if (!regions.has(signatureKey)) regions.set(signatureKey, { records: sig, diseases: [] })
    regions.get(signatureKey)!.diseases.push(disease)
  }

  const groups = new Map<string, VaccinationRecord[]>()
  for (const { records: regionRecords, diseases } of regions.values()) {
    groups.set(diseases.sort().join(', '), records.filter(r => regionRecords.has(r)))
  }
  if (otherRecords.length) groups.set('Other', otherRecords)
  return groups
}

export function weeksToLabel(w: number): string {
  const m: Record<number, string> = {
    0: 'Birth', 4: '1m', 8: '2m', 13: '3m', 16: '4m', 19: '4.5m',
    24: '6m', 26: '6m+', 30: '7m', 52: '12m', 65: '15m', 78: '18m',
    87: '20m', 260: '5yr', 312: '6yr'
  }
  return m[w] ?? `${w}w`
}
