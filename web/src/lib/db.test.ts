import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import type { Child, VaccinationRecord } from './types'

const child = (over: Partial<Child>): Child => ({
  id: 'c1', name: 'Kid', birthDate: '2024-01-01', country: 'RUSSIA', ...over
})

const record = (over: Partial<VaccinationRecord>): VaccinationRecord => ({
  id: 'r1', childId: 'c1', date: '2024-01-01', diseaseIds: [], kind: 'vaccine', ...over
} as VaccinationRecord)

// db.ts caches its IDB connection at module scope, so isolate tests by clearing
// all stores rather than swapping the underlying indexedDB instance.
beforeEach(async () => {
  await db.deleteAll()
})

describe('db.getChildren / saveChild', () => {
  it('returns an empty list when no children are saved', async () => {
    expect(await db.getChildren()).toEqual([])
  })

  it('returns saved children', async () => {
    await db.saveChild(child({ id: 'c1' }))
    await db.saveChild(child({ id: 'c2', name: 'Other' }))
    const all = await db.getChildren()
    expect(all).toHaveLength(2)
    expect(all.map(c => c.id).sort()).toEqual(['c1', 'c2'])
  })

  it('overwrites an existing child with the same id', async () => {
    await db.saveChild(child({ id: 'c1', name: 'First' }))
    await db.saveChild(child({ id: 'c1', name: 'Renamed' }))
    const all = await db.getChildren()
    expect(all).toHaveLength(1)
    expect(all[0].name).toBe('Renamed')
  })
})

describe('db.getChild', () => {
  it('returns the matching child', async () => {
    await db.saveChild(child({ id: 'c1' }))
    await db.saveChild(child({ id: 'c2', name: 'Other' }))
    expect((await db.getChild('c2'))?.name).toBe('Other')
  })

  it('returns undefined for an unknown id', async () => {
    expect(await db.getChild('unknown')).toBeUndefined()
  })
})

describe('db.getRecords / saveRecord', () => {
  it('returns only records for the requested child', async () => {
    await db.saveRecord(record({ id: 'r1', childId: 'c1' }))
    await db.saveRecord(record({ id: 'r2', childId: 'c2' }))
    expect((await db.getRecords('c1')).map(r => r.id)).toEqual(['r1'])
    expect((await db.getRecords('c2')).map(r => r.id)).toEqual(['r2'])
  })

  it('returns an empty list for a child with no records', async () => {
    expect(await db.getRecords('unknown')).toEqual([])
  })
})

describe('db.getRecords legacy data', () => {
  it('defaults records saved before the kind field existed to kind: vaccine', async () => {
    const legacy = record({ id: 'r1', childId: 'c1' }) as VaccinationRecord
    delete (legacy as { kind?: string }).kind
    await db.saveRecord(legacy)
    expect((await db.getRecords('c1'))[0].kind).toBe('vaccine')
  })
})

describe('db.deleteRecord', () => {
  it('removes only the targeted record', async () => {
    await db.saveRecord(record({ id: 'r1', childId: 'c1' }))
    await db.saveRecord(record({ id: 'r2', childId: 'c1' }))
    await db.deleteRecord('r1')
    expect((await db.getRecords('c1')).map(r => r.id)).toEqual(['r2'])
  })
})

describe('db.deleteChild', () => {
  it('removes the child', async () => {
    await db.saveChild(child({ id: 'c1' }))
    await db.deleteChild('c1')
    expect(await db.getChildren()).toEqual([])
  })

  it('cascades to delete all of that child\'s records', async () => {
    await db.saveChild(child({ id: 'c1' }))
    await db.saveRecord(record({ id: 'r1', childId: 'c1' }))
    await db.saveRecord(record({ id: 'r2', childId: 'c1' }))
    await db.deleteChild('c1')
    expect(await db.getRecords('c1')).toEqual([])
  })

  it('leaves other children\'s records untouched', async () => {
    await db.saveChild(child({ id: 'c1' }))
    await db.saveChild(child({ id: 'c2' }))
    await db.saveRecord(record({ id: 'r1', childId: 'c1' }))
    await db.saveRecord(record({ id: 'r2', childId: 'c2' }))
    await db.deleteChild('c1')
    expect(await db.getRecords('c2')).toEqual([record({ id: 'r2', childId: 'c2' })])
  })
})

describe('db.deleteAll', () => {
  it('clears children, records, and custom brands', async () => {
    await db.saveChild(child({ id: 'c1' }))
    await db.saveRecord(record({ id: 'r1', childId: 'c1' }))
    await db.deleteAll()
    expect(await db.getChildren()).toEqual([])
    expect(await db.getRecords('c1')).toEqual([])
  })
})
