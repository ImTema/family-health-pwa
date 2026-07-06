import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assignFootnotes, brandNameFor, childAgeWeeks, computeSchedule, diseasesFor, groupRecordsByDisease, weeksToLabel } from './schedule'
import type { Child, VaccinationRecord } from './types'

const record = (over: Partial<VaccinationRecord>): VaccinationRecord => ({
  id: 'r1', childId: 'c1', date: '2024-01-01', diseaseIds: [], kind: 'vaccine', ...over
} as VaccinationRecord)

const child = (over: Partial<Child>): Child => ({
  id: 'c1', name: 'Kid', birthDate: '2024-01-01', country: 'RUSSIA', ...over
})

describe('brandNameFor', () => {
  it('returns "Illness" for an illness record', () => {
    expect(brandNameFor(record({ kind: 'illness' }))).toBe('Illness')
  })
})

describe('diseasesFor', () => {
  it('returns diseaseIds regardless of brandId', () => {
    expect(diseasesFor(record({ diseaseIds: ['measles', 'mumps'] }))).toEqual(
      new Set(['measles', 'mumps'])
    )
  })

  it('returns diseaseIds even when brandId is also set', () => {
    expect(diseasesFor(record({ brandId: 'pentaxim', diseaseIds: ['measles'] }))).toEqual(
      new Set(['measles'])
    )
  })

  it('returns empty set when diseaseIds is empty', () => {
    expect(diseasesFor(record({ brandId: 'pentaxim' }))).toEqual(new Set())
  })
})

describe('childAgeWeeks', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('computes whole weeks elapsed since birth', () => {
    vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))
    expect(childAgeWeeks('2024-01-01')).toBe(2)
  })

  it('returns 0 for a newborn', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    expect(childAgeWeeks('2024-01-01')).toBe(0)
  })

  it('floors partial weeks', () => {
    vi.setSystemTime(new Date('2024-01-13T00:00:00Z'))
    expect(childAgeWeeks('2024-01-01')).toBe(1)
  })
})

describe('weeksToLabel', () => {
  it('maps known milestone weeks to their label', () => {
    expect(weeksToLabel(0)).toBe('Birth')
    expect(weeksToLabel(52)).toBe('12m')
    expect(weeksToLabel(312)).toBe('6yr')
  })

  it('falls back to "<n>w" for unmapped weeks', () => {
    expect(weeksToLabel(3)).toBe('3w')
    expect(weeksToLabel(100)).toBe('100w')
  })
})

describe('groupRecordsByDisease', () => {
  it('keeps a disjoint multi-disease vaccine in one group covering its full disease set', () => {
    const a = record({ id: 'a', diseaseIds: ['hepb', 'diphtheria'] })
    const b = record({ id: 'b', diseaseIds: ['measles', 'mumps'] })
    const groups = groupRecordsByDisease([a, b])
    expect(groups.size).toBe(2)
    expect(groups.get('Diphtheria, Hepatitis B')).toEqual([a])
    expect(groups.get('Measles, Mumps')).toEqual([b])
  })

  it('splits into shared and unique groups when disease sets partially overlap', () => {
    const a = record({ id: 'a', diseaseIds: ['hepb', 'diphtheria'] })
    const b = record({ id: 'b', diseaseIds: ['diphtheria', 'measles'] })
    const groups = groupRecordsByDisease([a, b])
    expect(groups.size).toBe(3)
    expect(groups.get('Hepatitis B')).toEqual([a])
    expect(groups.get('Diphtheria')).toEqual([a, b])
    expect(groups.get('Measles')).toEqual([b])
  })

  it('buckets records with no diseases under "Other"', () => {
    const a = record({ id: 'a', diseaseIds: [] })
    const groups = groupRecordsByDisease([a])
    expect(groups.get('Other')).toEqual([a])
  })
})

describe('computeSchedule', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('marks a dose DONE when a matching record exists', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const c = child({ birthDate: '2024-01-01', country: 'RUSSIA' })
    const records = [record({ diseaseIds: ['bcg'], date: '2024-01-01' })]
    const result = computeSchedule(c, records)
    const bcg = result.find(r => r.entry.diseaseId === 'bcg' && r.entry.doseNumber === 1)!
    expect(bcg.status).toBe('DONE')
    expect(bcg.coveredByRecord).toBe(records[0])
  })

  it('marks a dose HIGHLIGHTED when overdue and uncovered', () => {
    const c = child({ birthDate: '2024-01-01', country: 'RUSSIA' })
    // bcg is due at 0 weeks; 10 weeks later with no record it's overdue
    vi.setSystemTime(new Date('2024-03-11T00:00:00Z'))
    const result = computeSchedule(c, [])
    const bcg = result.find(r => r.entry.diseaseId === 'bcg' && r.entry.doseNumber === 1)!
    expect(bcg.status).toBe('HIGHLIGHTED')
    expect(bcg.coveredByRecord).toBeUndefined()
  })

  it('marks a dose UPCOMING when not yet due', () => {
    const c = child({ birthDate: '2024-01-01', country: 'RUSSIA' })
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    // measles is due at 52 weeks, so at week 0 it's not due yet
    const result = computeSchedule(c, [])
    const measles = result.find(r => r.entry.diseaseId === 'measles' && r.entry.doseNumber === 1)!
    expect(measles.status).toBe('UPCOMING')
  })

  it('only includes schedule entries for the child country', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const c = child({ birthDate: '2024-01-01', country: 'SERBIA' })
    const result = computeSchedule(c, [])
    expect(result.every(r => r.entry.country === 'SERBIA')).toBe(true)
  })

  it('picks the nth matching record (sorted by date) for the nth dose', () => {
    vi.setSystemTime(new Date('2024-06-01T00:00:00Z'))
    const c = child({ birthDate: '2024-01-01', country: 'RUSSIA' })
    const records = [
      record({ id: 'r2', diseaseIds: ['hepb'], date: '2024-03-01' }),
      record({ id: 'r1', diseaseIds: ['hepb'], date: '2024-01-01' }),
    ]
    const result = computeSchedule(c, records)
    const dose2 = result.find(r => r.entry.diseaseId === 'hepb' && r.entry.doseNumber === 2)!
    expect(dose2.status).toBe('DONE')
    expect(dose2.coveredByRecord?.id).toBe('r2')
  })

  it('sorts results by ageWeeks then doseNumber', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const c = child({ birthDate: '2024-01-01', country: 'RUSSIA' })
    const result = computeSchedule(c, [])
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1].entry, cur = result[i].entry
      expect(
        prev.ageWeeks < cur.ageWeeks ||
        (prev.ageWeeks === cur.ageWeeks && prev.doseNumber <= cur.doseNumber)
      ).toBe(true)
    }
  })
})

describe('assignFootnotes', () => {
  it('returns an empty map when nothing has a note', () => {
    expect(assignFootnotes([{}, {}])).toEqual(new Map())
  })

  it('assigns number 1 to a single noted item', () => {
    expect(assignFootnotes([{ note: 'endemic regions only' }])).toEqual(
      new Map([['endemic regions only', 1]])
    )
  })

  it('shares one number across items with identical note text', () => {
    const items = [{ note: 'risk-group only' }, {}, { note: 'risk-group only' }]
    expect(assignFootnotes(items)).toEqual(new Map([['risk-group only', 1]]))
  })

  it('numbers distinct notes sequentially by first appearance', () => {
    const items = [{ note: 'B' }, { note: 'A' }, { note: 'B' }]
    expect(assignFootnotes(items)).toEqual(new Map([['B', 1], ['A', 2]]))
  })
})

describe('WHO reference schedule', () => {
  it('marks universal antigens MANDATORY and region-specific ones OPTIONAL with a note', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const c = child({ birthDate: '2024-01-01', country: 'WHO' as Child['country'] })
    const result = computeSchedule(c, [])
    expect(result.every(r => r.entry.country === 'WHO')).toBe(true)

    const measles1 = result.find(r => r.entry.diseaseId === 'measles' && r.entry.doseNumber === 1)!
    expect(measles1.entry.necessity).toBe('MANDATORY')
    expect(measles1.entry.ageWeeks).toBe(39)

    const yellowFever = result.find(r => r.entry.diseaseId === 'yellow_fever')!
    expect(yellowFever.entry.necessity).toBe('OPTIONAL')
    expect(yellowFever.entry.note).toBeTruthy()
  })
})
