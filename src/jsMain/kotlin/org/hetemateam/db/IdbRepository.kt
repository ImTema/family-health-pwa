package org.hetemateam.db

import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.hetemateam.*
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class IdbRepository : Repository {

    private var db: dynamic = null

    suspend fun init() {
        db = openDb()
    }

    // ── IndexedDB plumbing ────────────────────────────────────────────────

    private suspend fun openDb(): dynamic = suspendCancellableCoroutine { cont ->
        val request: dynamic = js("window.indexedDB.open('vaxtrack', 1)")
        request.onupgradeneeded = { event: dynamic ->
            val idb: dynamic = event.target.result
            if (!idb.objectStoreNames.contains("children")) {
                idb.createObjectStore("children", js("({ keyPath: 'id' })"))
            }
            if (!idb.objectStoreNames.contains("vaccination_records")) {
                val store: dynamic = idb.createObjectStore("vaccination_records", js("({ keyPath: 'id' })"))
                store.createIndex("childId", "childId", js("({ unique: false })"))
            }
            if (!idb.objectStoreNames.contains("custom_brands")) {
                idb.createObjectStore("custom_brands", js("({ keyPath: 'id' })"))
            }
        }
        request.onsuccess = { event: dynamic -> cont.resume(event.target.result) }
        request.onerror = { _: dynamic -> cont.resumeWithException(Exception("IndexedDB failed to open")) }
    }

    private suspend fun getAll(storeName: String): dynamic = suspendCancellableCoroutine { cont ->
        val request: dynamic = db.transaction(storeName, "readonly").objectStore(storeName).getAll()
        request.onsuccess = { event: dynamic -> cont.resume(event.target.result) }
        request.onerror = { _: dynamic -> cont.resumeWithException(Exception("IDB getAll failed: $storeName")) }
    }

    private suspend fun getAllByIndex(storeName: String, index: String, key: String): dynamic =
        suspendCancellableCoroutine { cont ->
            val request: dynamic = db.transaction(storeName, "readonly")
                .objectStore(storeName).index(index).getAll(key)
            request.onsuccess = { event: dynamic -> cont.resume(event.target.result) }
            request.onerror = { _: dynamic -> cont.resumeWithException(Exception("IDB index getAll failed")) }
        }

    private suspend fun put(storeName: String, value: dynamic): Unit = suspendCancellableCoroutine { cont ->
        val request: dynamic = db.transaction(storeName, "readwrite").objectStore(storeName).put(value)
        request.onsuccess = { _: dynamic -> cont.resume(Unit) }
        request.onerror = { _: dynamic -> cont.resumeWithException(Exception("IDB put failed: $storeName")) }
    }

    private suspend fun delete(storeName: String, key: String): Unit = suspendCancellableCoroutine { cont ->
        val request: dynamic = db.transaction(storeName, "readwrite").objectStore(storeName).delete(key)
        request.onsuccess = { _: dynamic -> cont.resume(Unit) }
        request.onerror = { _: dynamic -> cont.resumeWithException(Exception("IDB delete failed: $storeName")) }
    }

    // ── Serialisation helpers ─────────────────────────────────────────────

    private fun toJs(json: String): dynamic = js("JSON.parse(json)")
    private fun fromJs(obj: dynamic): String = js("JSON.stringify(obj)") as String

    // ── Repository implementation ─────────────────────────────────────────

    override suspend fun getChildren(): List<Child> {
        val rows = getAll("children") as Array<dynamic>
        return rows.map { Json.decodeFromString<Child>(fromJs(it)) }
    }

    override suspend fun saveChild(child: Child) {
        put("children", toJs(Json.encodeToString(child)))
    }

    override suspend fun deleteChild(childId: String) {
        getRecords(childId).forEach { deleteRecord(it.id) }
        delete("children", childId)
    }

    override suspend fun getRecords(childId: String): List<VaccinationRecord> {
        val rows = getAllByIndex("vaccination_records", "childId", childId) as Array<dynamic>
        return rows.map { Json.decodeFromString<VaccinationRecord>(fromJs(it)) }
    }

    override suspend fun saveRecord(record: VaccinationRecord) {
        put("vaccination_records", toJs(Json.encodeToString(record)))
    }

    override suspend fun deleteRecord(recordId: String) {
        delete("vaccination_records", recordId)
    }

    override suspend fun searchBrands(query: String): List<Brand> {
        val q = query.lowercase()
        val seeded = Seed.brands.filter { it.name.lowercase().contains(q) }
        val custom = (getAll("custom_brands") as Array<dynamic>)
            .map { Json.decodeFromString<Brand>(fromJs(it)) }
            .filter { it.name.lowercase().contains(q) }
        return seeded + custom
    }

    override suspend fun saveCustomBrand(brand: Brand) {
        put("custom_brands", toJs(Json.encodeToString(brand)))
    }
}
