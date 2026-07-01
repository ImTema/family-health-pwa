package org.hetemateam

object Seed {

    val diseases = listOf(
        Disease("bcg", "BCG (Tuberculosis)"),
        Disease("hepb", "Hepatitis B"),
        Disease("diphtheria", "Diphtheria"),
        Disease("tetanus", "Tetanus"),
        Disease("pertussis", "Pertussis (Whooping Cough)"),
        Disease("ipv", "Polio (IPV/OPV)"),
        Disease("hib", "Haemophilus influenzae type b (Hib)"),
        Disease("pcv", "Pneumococcal disease"),
        Disease("rotavirus", "Rotavirus"),
        Disease("measles", "Measles"),
        Disease("mumps", "Mumps"),
        Disease("rubella", "Rubella"),
        Disease("varicella", "Varicella (Chickenpox)"),
        Disease("menc", "Meningococcal C"),
        Disease("hepa", "Hepatitis A"),
        Disease("hpv", "Human Papillomavirus (HPV)"),
    )

    val diseaseById: Map<String, Disease> = diseases.associateBy { it.id }

    val brands = listOf(
        Brand("pentaxim", "Pentaxim"),
        Brand("infanrix_hexa", "Infanrix Hexa"),
        Brand("infanrix", "Infanrix"),
        Brand("infanrix_ipv", "Infanrix IPV"),
        Brand("hexaxim", "Hexaxim"),
        Brand("bcg", "BCG"),
        Brand("bcg_m", "BCG-M"),
        Brand("engerix_b", "Engerix-B"),
        Brand("euvax_b", "Euvax-B"),
        Brand("regevar", "Regevak B"),
        Brand("priorix", "Priorix"),
        Brand("mmr_ii", "M-M-R II"),
        Brand("varivax", "Varivax"),
        Brand("varilrix", "Varilrix"),
        Brand("prevenar_13", "Prevenar 13"),
        Brand("synflorix", "Synflorix"),
        Brand("rotateq", "RotaTeq"),
        Brand("rotarix", "Rotarix"),
        Brand("menjugate", "Menjugate"),
        Brand("neisvac_c", "NeisVac-C"),
        Brand("nimenrix", "Nimenrix"),
        Brand("gardasil_9", "Gardasil 9"),
        Brand("cervarix", "Cervarix"),
        Brand("havrix", "Havrix"),
        Brand("avaxim", "Avaxim"),
        Brand("akds", "АКДС (DTP)"),
        Brand("ads_m", "АДС-М (ADS-M)"),
        Brand("opv", "ОПВ (OPV)"),
    )

    // Maps brandId → set of diseaseIds covered
    val brandCoverage: Map<String, Set<String>> = mapOf(
        "pentaxim"      to setOf("diphtheria", "tetanus", "pertussis", "ipv", "hib"),
        "infanrix_hexa" to setOf("diphtheria", "tetanus", "pertussis", "ipv", "hib", "hepb"),
        "infanrix"      to setOf("diphtheria", "tetanus", "pertussis"),
        "infanrix_ipv"  to setOf("diphtheria", "tetanus", "pertussis", "ipv"),
        "hexaxim"       to setOf("diphtheria", "tetanus", "pertussis", "ipv", "hib", "hepb"),
        "bcg"           to setOf("bcg"),
        "bcg_m"         to setOf("bcg"),
        "engerix_b"     to setOf("hepb"),
        "euvax_b"       to setOf("hepb"),
        "regevar"       to setOf("hepb"),
        "priorix"       to setOf("measles", "mumps", "rubella"),
        "mmr_ii"        to setOf("measles", "mumps", "rubella"),
        "varivax"       to setOf("varicella"),
        "varilrix"      to setOf("varicella"),
        "prevenar_13"   to setOf("pcv"),
        "synflorix"     to setOf("pcv"),
        "rotateq"       to setOf("rotavirus"),
        "rotarix"       to setOf("rotavirus"),
        "menjugate"     to setOf("menc"),
        "neisvac_c"     to setOf("menc"),
        "nimenrix"      to setOf("menc"),
        "gardasil_9"    to setOf("hpv"),
        "cervarix"      to setOf("hpv"),
        "havrix"        to setOf("hepa"),
        "avaxim"        to setOf("hepa"),
        "akds"          to setOf("diphtheria", "tetanus", "pertussis"),
        "ads_m"         to setOf("diphtheria", "tetanus"),
        "opv"           to setOf("ipv"),
    )

    // Schedule entries: (country, diseaseId, ageWeeks nominal, doseNumber)
    val scheduleEntries: List<ScheduleEntry> = buildList {

        // ── RUSSIA (National Immunisation Calendar) ───────────────────────
        fun ru(id: String, disease: String, ageWeeks: Int, dose: Int) =
            add(ScheduleEntry("ru_${disease}_$dose", Country.RUSSIA, disease, ageWeeks, dose))

        ru("", "hepb",       0,  1)
        ru("", "hepb",       4,  2)
        ru("", "hepb",      26,  3)
        ru("", "bcg",        0,  1)
        ru("", "diphtheria", 13, 1)
        ru("", "diphtheria", 19, 2)
        ru("", "diphtheria", 26, 3)
        ru("", "diphtheria", 78, 4)
        ru("", "tetanus",    13, 1)
        ru("", "tetanus",    19, 2)
        ru("", "tetanus",    26, 3)
        ru("", "tetanus",    78, 4)
        ru("", "pertussis",  13, 1)
        ru("", "pertussis",  19, 2)
        ru("", "pertussis",  26, 3)
        ru("", "pertussis",  78, 4)
        ru("", "ipv",        13, 1)
        ru("", "ipv",        19, 2)
        ru("", "ipv",        26, 3)
        ru("", "ipv",        78, 4)
        ru("", "ipv",        87, 5)
        ru("", "hib",        13, 1)
        ru("", "hib",        19, 2)
        ru("", "hib",        26, 3)
        ru("", "hib",        78, 4)
        ru("", "pcv",         8, 1)
        ru("", "pcv",        19, 2)
        ru("", "pcv",        65, 3)
        ru("", "measles",    52, 1)
        ru("", "measles",   312, 2)
        ru("", "mumps",      52, 1)
        ru("", "mumps",     312, 2)
        ru("", "rubella",    52, 1)
        ru("", "rubella",   312, 2)
        ru("", "varicella",  52, 1)

        // ── SERBIA (National Immunisation Calendar) ───────────────────────
        fun rs(id: String, disease: String, ageWeeks: Int, dose: Int) =
            add(ScheduleEntry("rs_${disease}_$dose", Country.SERBIA, disease, ageWeeks, dose))

        rs("", "bcg",        0,  1)
        rs("", "hepb",       0,  1)
        rs("", "hepb",       8,  2)
        rs("", "hepb",      30,  3)
        rs("", "diphtheria",  8, 1)
        rs("", "diphtheria", 16, 2)
        rs("", "diphtheria", 24, 3)
        rs("", "diphtheria", 78, 4)
        rs("", "tetanus",     8, 1)
        rs("", "tetanus",    16, 2)
        rs("", "tetanus",    24, 3)
        rs("", "tetanus",    78, 4)
        rs("", "pertussis",   8, 1)
        rs("", "pertussis",  16, 2)
        rs("", "pertussis",  24, 3)
        rs("", "pertussis",  78, 4)
        rs("", "ipv",         8, 1)
        rs("", "ipv",        16, 2)
        rs("", "ipv",        24, 3)
        rs("", "ipv",        78, 4)
        rs("", "hib",         8, 1)
        rs("", "hib",        16, 2)
        rs("", "hib",        24, 3)
        rs("", "hib",        78, 4)
        rs("", "pcv",         8, 1)
        rs("", "pcv",        16, 2)
        rs("", "pcv",        52, 3)
        rs("", "measles",    52, 1)
        rs("", "measles",   260, 2)
        rs("", "mumps",      52, 1)
        rs("", "mumps",     260, 2)
        rs("", "rubella",    52, 1)
        rs("", "rubella",   260, 2)

        // ── EU (ECDC generalised schedule) ───────────────────────────────
        fun eu(id: String, disease: String, ageWeeks: Int, dose: Int) =
            add(ScheduleEntry("eu_${disease}_$dose", Country.EU, disease, ageWeeks, dose))

        eu("", "hepb",        0, 1)
        eu("", "hepb",        8, 2)
        eu("", "hepb",       24, 3)
        eu("", "diphtheria",  8, 1)
        eu("", "diphtheria", 16, 2)
        eu("", "diphtheria", 26, 3)
        eu("", "diphtheria", 52, 4)
        eu("", "tetanus",     8, 1)
        eu("", "tetanus",    16, 2)
        eu("", "tetanus",    26, 3)
        eu("", "tetanus",    52, 4)
        eu("", "pertussis",   8, 1)
        eu("", "pertussis",  16, 2)
        eu("", "pertussis",  26, 3)
        eu("", "pertussis",  52, 4)
        eu("", "ipv",         8, 1)
        eu("", "ipv",        16, 2)
        eu("", "ipv",        26, 3)
        eu("", "ipv",        52, 4)
        eu("", "hib",         8, 1)
        eu("", "hib",        16, 2)
        eu("", "hib",        26, 3)
        eu("", "hib",        52, 4)
        eu("", "pcv",         8, 1)
        eu("", "pcv",        16, 2)
        eu("", "pcv",        52, 3)
        eu("", "measles",    52, 1)
        eu("", "measles",   260, 2)
        eu("", "mumps",      52, 1)
        eu("", "mumps",     260, 2)
        eu("", "rubella",    52, 1)
        eu("", "rubella",   260, 2)
        eu("", "varicella",  52, 1)
        eu("", "varicella",  78, 2)
        eu("", "menc",       52, 1)
    }
}
