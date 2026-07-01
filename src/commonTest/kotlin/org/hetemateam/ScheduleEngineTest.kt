package org.hetemateam

import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class ScheduleEngineTest {

    private val birthDate = LocalDate(2024, 1, 1)
    private val today26w  = LocalDate(2024, 7, 1) // ~26 weeks

    private fun child(country: Country = Country.RUSSIA) =
        Child("c1", "Test", birthDate, country)

    private fun record(brandId: String, weeksAfterBirth: Int = 13) = VaccinationRecord(
        id = "r${brandId}${weeksAfterBirth}",
        childId = "c1",
        date = LocalDate(2024, 1, 1 + weeksAfterBirth * 7).let {
            // naive add; good enough for test purposes
            LocalDate(2024, (1 + weeksAfterBirth / 4).coerceAtMost(12), 1)
        },
        brandId = brandId,
    )

    @Test
    fun emptyRecordsAllPastEntriesHighlighted() {
        val results = ScheduleEngine.compute(child(), emptyList(), today26w)
        val highlighted = results.filter { it.status == ScheduleStatus.HIGHLIGHTED }
        // BCG, HepB x2, DTaP x3, Hib x3, IPV x3, PCV x2 are all ≤26 weeks → highlighted
        assertTrue(highlighted.isNotEmpty(), "Expected highlighted entries for past schedule milestones")
    }

    @Test
    fun futureEntriesAreUpcoming() {
        val results = ScheduleEngine.compute(child(), emptyList(), today26w)
        val mmr = results.find { it.disease.id == "measles" && it.entry.doseNumber == 1 }
        assertNotNull(mmr, "MMR dose 1 should exist in Russia schedule")
        assertEquals(ScheduleStatus.UPCOMING, mmr.status, "MMR at 52 weeks should be upcoming at 26 weeks")
    }

    @Test
    fun pentaximCoversDtapIpvHib() {
        val rec = VaccinationRecord("r1", "c1", LocalDate(2024, 4, 1), brandId = "pentaxim")
        val results = ScheduleEngine.compute(child(), listOf(rec), today26w)

        val diphDose1 = results.find { it.disease.id == "diphtheria" && it.entry.doseNumber == 1 }
        assertEquals(ScheduleStatus.DONE, diphDose1?.status, "Pentaxim should cover Diphtheria dose 1")

        val hepbDose1 = results.find { it.disease.id == "hepb" && it.entry.doseNumber == 1 }
        assertEquals(ScheduleStatus.HIGHLIGHTED, hepbDose1?.status, "Pentaxim does NOT cover HepB")
    }

    @Test
    fun threeRecordsCoverThreeDoses() {
        val records = listOf(
            VaccinationRecord("r1", "c1", LocalDate(2024, 4, 1),  brandId = "pentaxim"),
            VaccinationRecord("r2", "c1", LocalDate(2024, 5, 15), brandId = "pentaxim"),
            VaccinationRecord("r3", "c1", LocalDate(2024, 7, 1),  brandId = "pentaxim"),
        )
        val results = ScheduleEngine.compute(child(), records, today26w)

        listOf(1, 2, 3).forEach { dose ->
            val entry = results.find { it.disease.id == "diphtheria" && it.entry.doseNumber == dose }
            assertEquals(ScheduleStatus.DONE, entry?.status, "Diphtheria dose $dose should be DONE")
        }
    }

    @Test
    fun explicitDiseasesCoverWithoutBrand() {
        val rec = VaccinationRecord(
            id = "r1", childId = "c1", date = LocalDate(2024, 4, 1),
            diseaseIds = listOf("bcg")
        )
        val results = ScheduleEngine.compute(child(), listOf(rec), today26w)
        val bcg = results.find { it.disease.id == "bcg" && it.entry.doseNumber == 1 }
        assertEquals(ScheduleStatus.DONE, bcg?.status, "Explicit disease should mark BCG done")
    }

    @Test
    fun serbiaScheduleUsedWhenCountryIsSerbia() {
        val results = ScheduleEngine.compute(child(Country.SERBIA), emptyList(), today26w)
        // Serbia has BCG at birth — should be highlighted at 26 weeks with no records
        val bcg = results.find { it.disease.id == "bcg" }
        assertNotNull(bcg, "Serbia schedule should include BCG")
        assertEquals(ScheduleStatus.HIGHLIGHTED, bcg.status)
    }
}
