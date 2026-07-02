import type { Child, VaccinationRecord } from './types'

export const BACKUP_VERSION = 2

export type BackupChild = Child & { records: VaccinationRecord[] }

export interface Backup {
  version: number
  exportedAt: string
  children: BackupChild[]
}

export function toBackup(children: BackupChild[], exportedAt: string): Backup {
  return { version: BACKUP_VERSION, exportedAt, children }
}

export function fromBackup(json: string): Backup {
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed?.children)) throw new Error('Invalid backup: missing children array')
  return {
    version: parsed.version ?? 1,
    exportedAt: parsed.exportedAt ?? '',
    children: parsed.children.map((bc: Partial<BackupChild>): BackupChild => ({
      id: bc.id!,
      name: bc.name!,
      birthDate: bc.birthDate!,
      country: bc.country!,
      sex: bc.sex,
      photo: bc.photo,
      records: Array.isArray(bc.records) ? bc.records : []
    }))
  }
}
