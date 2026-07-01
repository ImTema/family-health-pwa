package org.hetemateam

import kotlinx.datetime.LocalDate
import kotlinx.datetime.daysUntil

object ScheduleEngine {

    fun compute(
        child: Child,
        records: List<VaccinationRecord>,
        today: LocalDate,
    ): List<ScheduleResult> {
        val childAgeWeeks = child.birthDate.daysUntil(today) / 7
        val entries = Seed.scheduleEntries.filter { it.country == child.country }

        return entries.map { entry ->
            val covering = records
                .filter { entry.diseaseId in diseasesFor(it) }
                .sortedBy { it.date }

            val status = when {
                covering.size >= entry.doseNumber -> ScheduleStatus.DONE
                childAgeWeeks > entry.ageWeeks    -> ScheduleStatus.HIGHLIGHTED
                else                              -> ScheduleStatus.UPCOMING
            }

            ScheduleResult(
                entry = entry,
                disease = Seed.diseaseById.getValue(entry.diseaseId),
                status = status,
                coveredByRecord = covering.getOrNull(entry.doseNumber - 1)
            )
        }.sortedWith(compareBy({ it.entry.ageWeeks }, { it.entry.doseNumber }))
    }

    fun diseasesFor(record: VaccinationRecord): Set<String> =
        Seed.brandCoverage[record.brandId] ?: record.diseaseIds.toSet()
}
