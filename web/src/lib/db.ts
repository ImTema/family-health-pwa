import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Brand, Child, VaccinationRecord } from './types'

interface VaxDB extends DBSchema {
  children:            { key: string; value: Child }
  vaccination_records: { key: string; value: VaccinationRecord; indexes: { childId: string } }
  custom_brands:       { key: string; value: Brand }
}

let _db: IDBPDatabase<VaxDB> | null = null

async function getDb(): Promise<IDBPDatabase<VaxDB>> {
  if (_db) return _db
  _db = await openDB<VaxDB>('vaxtrack', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('children', { keyPath: 'id' })
        const records = db.createObjectStore('vaccination_records', { keyPath: 'id' })
        records.createIndex('childId', 'childId')
        db.createObjectStore('custom_brands', { keyPath: 'id' })
      }
      // v2: sex + photo added as optional fields on Child — no structural changes needed
    }
  })
  return _db
}

export const db = {
  async getChildren(): Promise<Child[]> {
    return (await getDb()).getAll('children')
  },

  async getChild(id: string): Promise<Child | undefined> {
    return (await getDb()).get('children', id)
  },

  async saveChild(child: Child): Promise<void> {
    await (await getDb()).put('children', child)
  },

  async deleteChild(id: string): Promise<void> {
    const idb = await getDb()
    const records = await idb.getAllFromIndex('vaccination_records', 'childId', id)
    const tx = idb.transaction(['children', 'vaccination_records'], 'readwrite')
    tx.objectStore('children').delete(id)
    for (const r of records) tx.objectStore('vaccination_records').delete(r.id)
    await tx.done
  },

  async getRecords(childId: string): Promise<VaccinationRecord[]> {
    return (await getDb()).getAllFromIndex('vaccination_records', 'childId', childId)
  },

  async saveRecord(record: VaccinationRecord): Promise<void> {
    await (await getDb()).put('vaccination_records', record)
  },

  async deleteRecord(id: string): Promise<void> {
    await (await getDb()).delete('vaccination_records', id)
  },

  async deleteAll(): Promise<void> {
    const idb = await getDb()
    const tx = idb.transaction(['children', 'vaccination_records', 'custom_brands'], 'readwrite')
    tx.objectStore('children').clear()
    tx.objectStore('vaccination_records').clear()
    tx.objectStore('custom_brands').clear()
    await tx.done
  }
}
