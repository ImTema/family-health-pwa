package org.hetemateam

import kotlinx.datetime.LocalDate
import kotlinx.serialization.Serializable

@Serializable
enum class Country(val displayName: String) {
    RUSSIA("Russia"), SERBIA("Serbia"), EU("European Union")
}

enum class ScheduleStatus { DONE, HIGHLIGHTED, UPCOMING }

@Serializable
data class Disease(val id: String, val name: String)

@Serializable
data class Brand(val id: String, val name: String, val isSeeded: Boolean = true)

@Serializable
data class Child(
    val id: String,
    val name: String,
    val birthDate: LocalDate,
    val country: Country
)

@Serializable
data class VaccinationRecord(
    val id: String,
    val childId: String,
    val date: LocalDate,
    val brandId: String? = null,
    val customBrandName: String? = null,
    // explicit diseases: used when no seeded brand, or user overrides
    val diseaseIds: List<String> = emptyList(),
    val serialNumber: String? = null,
    val notes: String? = null
)

data class ScheduleEntry(
    val id: String,
    val country: Country,
    val diseaseId: String,
    val ageWeeks: Int,
    val doseNumber: Int
)

data class ScheduleResult(
    val entry: ScheduleEntry,
    val disease: Disease,
    val status: ScheduleStatus,
    val coveredByRecord: VaccinationRecord? = null
)
