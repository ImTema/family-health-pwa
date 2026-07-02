import { describe, expect, it } from 'vitest'
import { BACKUP_VERSION, fromBackup, toBackup, type BackupChild } from './backup'

const backupChild = (over: Partial<BackupChild> = {}): BackupChild => ({
  id: 'c1', name: 'Kid', birthDate: '2024-01-01', country: 'RUSSIA', records: [], ...over
})

describe('toBackup', () => {
  it('stamps the current backup version and exportedAt', () => {
    const backup = toBackup([backupChild()], '2024-06-01')
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(backup.exportedAt).toBe('2024-06-01')
    expect(backup.children).toEqual([backupChild()])
  })
})

describe('fromBackup', () => {
  it('round-trips a backup produced by toBackup', () => {
    const original = toBackup([backupChild({ sex: 'MALE', photo: 'data:image/jpeg;base64,x' })], '2024-06-01')
    const parsed = fromBackup(JSON.stringify(original))
    expect(parsed).toEqual(original)
  })

  it('defaults missing optional fields to undefined and empty records', () => {
    const parsed = fromBackup(JSON.stringify({ children: [{ id: 'c1', name: 'Kid', birthDate: '2024-01-01', country: 'RUSSIA' }] }))
    expect(parsed.children[0].sex).toBeUndefined()
    expect(parsed.children[0].photo).toBeUndefined()
    expect(parsed.children[0].records).toEqual([])
  })

  it('defaults version to 1 when absent (pre-versioning backups)', () => {
    const parsed = fromBackup(JSON.stringify({ children: [] }))
    expect(parsed.version).toBe(1)
  })

  it('throws on a backup missing the children array', () => {
    expect(() => fromBackup(JSON.stringify({ version: 2 }))).toThrow('Invalid backup')
  })

  it('throws on malformed JSON', () => {
    expect(() => fromBackup('not json')).toThrow()
  })
})
