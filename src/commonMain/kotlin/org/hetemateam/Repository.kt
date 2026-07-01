package org.hetemateam

interface Repository {
    suspend fun getChildren(): List<Child>
    suspend fun saveChild(child: Child)
    suspend fun deleteChild(childId: String)

    suspend fun getRecords(childId: String): List<VaccinationRecord>
    suspend fun saveRecord(record: VaccinationRecord)
    suspend fun deleteRecord(recordId: String)

    // Returns seeded brands first, then user-added custom brands
    suspend fun searchBrands(query: String): List<Brand>
    suspend fun saveCustomBrand(brand: Brand)
}
