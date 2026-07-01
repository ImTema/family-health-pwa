package org.hetemateam

import androidx.compose.runtime.*
import kotlinx.browser.document
import kotlinx.browser.localStorage
import kotlinx.browser.window
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.daysUntil
import kotlinx.datetime.todayIn
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.hetemateam.db.IdbRepository
import org.jetbrains.compose.web.attributes.*
import org.jetbrains.compose.web.dom.*
import org.w3c.dom.HTMLAnchorElement
import org.w3c.dom.HTMLInputElement
import org.w3c.dom.HTMLSelectElement

private val scope = CoroutineScope(Dispatchers.Default)

private fun randomId(): String = js("crypto.randomUUID()").unsafeCast<String>()

private fun weeksToLabel(w: Int) = when (w) {
    0 -> "Birth"; 4 -> "1m"; 8 -> "2m"; 13 -> "3m"; 16 -> "4m"; 19 -> "4.5m"
    24 -> "6m"; 26 -> "6m+"; 30 -> "7m"; 52 -> "12m"; 65 -> "15m"; 78 -> "18m"
    87 -> "20m"; 260 -> "5yr"; 312 -> "6yr"; else -> "${w}w"
}

private enum class Screen { CHILDREN, CHILD_FORM, CHILD_DETAIL, RECORD_FORM }
private enum class DetailTab { RECORDS, SCHEDULE }

// ── Export / import (issue 008) ───────────────────────────────────────────────

@Serializable private data class Backup(val version: Int = 1, val exportedAt: String, val children: List<BackupChild>)
@Serializable private data class BackupChild(val id: String, val name: String, val birthDate: String, val country: String, val records: List<BackupRecord>)
@Serializable private data class BackupRecord(val id: String, val date: String, val brandId: String? = null, val customBrandName: String? = null, val diseaseIds: List<String> = emptyList(), val serialNumber: String? = null, val notes: String? = null)

private fun triggerDownload(content: String, filename: String) {
    val a = document.createElement("a").unsafeCast<HTMLAnchorElement>()
    val blob = js("new Blob([content], {type: 'application/json'})").unsafeCast<dynamic>()
    val url = js("URL.createObjectURL(blob)") as String
    a.href = url
    a.setAttribute("download", filename)
    document.body!!.appendChild(a)
    a.click()
    document.body!!.removeChild(a)
    js("URL.revokeObjectURL(url)")
}

private fun readFileContent(file: dynamic, onRead: (String) -> Unit) {
    val reader = js("new FileReader()").unsafeCast<dynamic>()
    reader.addEventListener("load", { e: dynamic -> onRead(e.target.result.unsafeCast<String>()) })
    reader.readAsText(file)
}

// ── App root ──────────────────────────────────────────────────────────────────

@Composable
fun App(repo: IdbRepository) {
    var ready by remember { mutableStateOf(false) }
    var screen by remember { mutableStateOf(Screen.CHILDREN) }
    var children by remember { mutableStateOf<List<Child>>(emptyList()) }
    var activeId by remember { mutableStateOf(localStorage.getItem("activeChildId")) }
    var editingChild by remember { mutableStateOf<Child?>(null) }
    var editingRecord by remember { mutableStateOf<VaccinationRecord?>(null) }
    var records by remember { mutableStateOf<List<VaccinationRecord>>(emptyList()) }
    var confirmDeleteChild by remember { mutableStateOf<Child?>(null) }
    var confirmDeleteRecord by remember { mutableStateOf<VaccinationRecord?>(null) }
    var importError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        repo.init()
        children = repo.getChildren()
        if (children.none { it.id == activeId }) { activeId = null; localStorage.removeItem("activeChildId") }
        activeId?.let { records = repo.getRecords(it) }
        ready = true
    }

    if (!ready) {
        Div({ classes("flex", "items-center", "justify-center", "min-h-screen") }) {
            Span({ classes("loading", "loading-spinner", "loading-lg") })
        }
        return
    }

    fun activate(id: String) { activeId = id; localStorage.setItem("activeChildId", id) }
    fun refreshChildren() = scope.launch { children = repo.getChildren() }
    fun refreshRecords(childId: String) = scope.launch { records = repo.getRecords(childId) }

    fun doExport() = scope.launch {
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        val chs = repo.getChildren()
        val backup = Backup(exportedAt = today.toString(), children = chs.map { child ->
            BackupChild(id = child.id, name = child.name, birthDate = child.birthDate.toString(), country = child.country.name,
                records = repo.getRecords(child.id).map { r ->
                    BackupRecord(id = r.id, date = r.date.toString(), brandId = r.brandId, customBrandName = r.customBrandName,
                        diseaseIds = r.diseaseIds, serialNumber = r.serialNumber, notes = r.notes)
                })
        })
        triggerDownload(Json { prettyPrint = true }.encodeToString(backup), "vaccinations-$today.json")
    }

    fun doImport(json: String) {
        if (!window.confirm("This will replace all existing data with the backup. Continue?")) return
        scope.launch {
            try {
                val backup = Json { ignoreUnknownKeys = true }.decodeFromString<Backup>(json)
                repo.deleteAll()
                backup.children.forEach { bc ->
                    repo.saveChild(Child(bc.id, bc.name, LocalDate.parse(bc.birthDate),
                        Country.entries.firstOrNull { it.name == bc.country } ?: Country.RUSSIA))
                    bc.records.forEach { br ->
                        repo.saveRecord(VaccinationRecord(id = br.id, childId = bc.id, date = LocalDate.parse(br.date),
                            brandId = br.brandId, customBrandName = br.customBrandName, diseaseIds = br.diseaseIds,
                            serialNumber = br.serialNumber, notes = br.notes))
                    }
                }
                children = repo.getChildren()
                activeId = children.firstOrNull()?.id?.also { localStorage.setItem("activeChildId", it) }
                    ?: run { localStorage.removeItem("activeChildId"); null }
                activeId?.let { records = repo.getRecords(it) } ?: run { records = emptyList() }
            } catch (e: Exception) {
                importError = "Import failed: ${e.message ?: "Invalid file"}"
            }
        }
    }

    when (screen) {
        Screen.CHILDREN -> ChildrenScreen(
            children = children,
            activeId = activeId,
            onActivate = { child ->
                activate(child.id)
                scope.launch { records = repo.getRecords(child.id) }
            },
            onOpen = { child ->
                activate(child.id)
                scope.launch { records = repo.getRecords(child.id); screen = Screen.CHILD_DETAIL }
            },
            onAdd = { editingChild = null; screen = Screen.CHILD_FORM },
            onEdit = { editingChild = it; screen = Screen.CHILD_FORM },
            onDelete = { confirmDeleteChild = it },
            onExport = { doExport() },
            onImport = { json -> doImport(json) }
        )
        Screen.CHILD_FORM -> ChildFormScreen(
            initial = editingChild,
            onSave = { child ->
                scope.launch {
                    repo.saveChild(child)
                    refreshChildren()
                    if (activeId == null || activeId == child.id) activate(child.id)
                    screen = if (editingChild != null) Screen.CHILD_DETAIL else Screen.CHILDREN
                }
            },
            onCancel = { screen = if (editingChild != null) Screen.CHILD_DETAIL else Screen.CHILDREN }
        )
        Screen.CHILD_DETAIL -> {
            val child = children.find { it.id == activeId }
            if (child == null) { screen = Screen.CHILDREN; return }
            ChildDetailScreen(
                child = child,
                records = records,
                onBack = { screen = Screen.CHILDREN },
                onEditChild = { editingChild = child; screen = Screen.CHILD_FORM },
                onAddRecord = { editingRecord = null; screen = Screen.RECORD_FORM },
                onEditRecord = { editingRecord = it; screen = Screen.RECORD_FORM },
                onDeleteRecord = { confirmDeleteRecord = it }
            )
        }
        Screen.RECORD_FORM -> {
            val child = children.find { it.id == activeId } ?: run { screen = Screen.CHILD_DETAIL; return }
            RecordFormScreen(
                childId = child.id,
                initial = editingRecord,
                onSave = { record ->
                    scope.launch {
                        repo.saveRecord(record)
                        refreshRecords(child.id)
                        screen = Screen.CHILD_DETAIL
                    }
                },
                onCancel = { screen = Screen.CHILD_DETAIL }
            )
        }
    }

    // Delete child modal
    confirmDeleteChild?.let { child ->
        DeleteModal(
            title = "Delete ${child.name}?",
            body = "All vaccination records for ${child.name} will be deleted.",
            onConfirm = {
                scope.launch {
                    repo.deleteChild(child.id)
                    if (activeId == child.id) { activeId = null; localStorage.removeItem("activeChildId"); records = emptyList() }
                    refreshChildren()
                    confirmDeleteChild = null
                }
            },
            onDismiss = { confirmDeleteChild = null }
        )
    }

    // Delete record modal
    confirmDeleteRecord?.let { record ->
        DeleteModal(
            title = "Delete this record?",
            body = "Recorded on ${record.date}. This cannot be undone.",
            onConfirm = {
                scope.launch {
                    repo.deleteRecord(record.id)
                    activeId?.let { refreshRecords(it) }
                    confirmDeleteRecord = null
                }
            },
            onDismiss = { confirmDeleteRecord = null }
        )
    }

    // Import error modal
    importError?.let { msg ->
        DeleteModal(title = "Import failed", body = msg, onConfirm = { importError = null }, onDismiss = { importError = null })
    }
}

// ── Children list (issue 004) ─────────────────────────────────────────────────

@Composable
private fun ChildrenScreen(
    children: List<Child>,
    activeId: String?,
    onActivate: (Child) -> Unit,
    onOpen: (Child) -> Unit,
    onAdd: () -> Unit,
    onEdit: (Child) -> Unit,
    onDelete: (Child) -> Unit,
    onExport: () -> Unit,
    onImport: (String) -> Unit,
) {
    Div({ classes("min-h-screen", "bg-base-100", "p-4") }) {
        Div({ classes("max-w-lg", "mx-auto") }) {
            // Hidden file input for import
            Input(InputType.File) {
                id("import-file-input")
                attr("accept", ".json")
                attr("style", "display:none")
                onChange { e ->
                    val files = e.nativeEvent.target.asDynamic().files
                    if (files.length > 0) readFileContent(files[0]) { onImport(it) }
                }
            }

            Div({ classes("flex", "justify-between", "items-center", "mb-6") }) {
                H1({ classes("text-2xl", "font-bold") }) { Text("VaxTrack") }
                Div({ classes("flex", "gap-2") }) {
                    // Import/export overflow menu
                    Div({ classes("dropdown", "dropdown-end") }) {
                        Button({
                            attr("tabindex", "0")
                            classes("btn", "btn-ghost", "btn-sm")
                        }) { Text("⋮") }
                        Ul({
                            attr("tabindex", "0")
                            classes("dropdown-content", "menu", "p-2", "shadow", "bg-base-100", "rounded-box", "w-44", "z-10")
                        }) {
                            Li { A(href = "#", { onClick { it.preventDefault(); onExport() } }) { Text("Export backup") } }
                            Li { A(href = "#", { onClick { it.preventDefault(); document.getElementById("import-file-input")?.asDynamic()?.click() } }) { Text("Import backup") } }
                        }
                    }
                    Button({ classes("btn", "btn-primary", "btn-sm"); onClick { onAdd() } }) { Text("+ Add child") }
                }
            }

            if (children.isEmpty()) {
                Div({ classes("hero", "min-h-64") }) {
                    Div({ classes("hero-content", "text-center") }) {
                        Div {
                            P({ classes("text-base-content/60", "mb-4") }) { Text("No children yet.") }
                            Button({ classes("btn", "btn-primary"); onClick { onAdd() } }) { Text("Add your first child") }
                        }
                    }
                }
            } else {
                Div({ classes("flex", "flex-col", "gap-3") }) {
                    children.forEach { child ->
                        val isActive = child.id == activeId
                        Div({
                            classes("card", "bg-base-200", "cursor-pointer", "hover:bg-base-300", "transition-colors")
                            if (isActive) classes("ring-2", "ring-primary")
                            onClick { onOpen(child) }
                        }) {
                            Div({ classes("card-body", "p-4") }) {
                                Div({ classes("flex", "justify-between", "items-start") }) {
                                    Div {
                                        Div({ classes("font-semibold", "text-lg") }) { Text(child.name) }
                                        Div({ classes("text-sm", "text-base-content/60") }) {
                                            Text("${child.country.displayName} · Born ${child.birthDate}")
                                        }
                                    }
                                    Div({ classes("flex", "items-center", "gap-2") }) {
                                        if (isActive) Span({ classes("badge", "badge-primary", "badge-sm") }) { Text("Active") }
                                        Button({
                                            classes("btn", "btn-ghost", "btn-xs")
                                            onClick { it.stopPropagation(); onEdit(child) }
                                        }) { Text("Edit") }
                                        Button({
                                            classes("btn", "btn-ghost", "btn-xs", "text-error")
                                            onClick { it.stopPropagation(); onDelete(child) }
                                        }) { Text("Delete") }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── Child form (issue 004) ────────────────────────────────────────────────────

@Composable
private fun ChildFormScreen(initial: Child?, onSave: (Child) -> Unit, onCancel: () -> Unit) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var birthDate by remember { mutableStateOf(initial?.birthDate?.toString() ?: "") }
    var country by remember { mutableStateOf(initial?.country ?: Country.RUSSIA) }

    Div({ classes("min-h-screen", "bg-base-100", "p-4") }) {
        Div({ classes("max-w-lg", "mx-auto") }) {
            H1({ classes("text-2xl", "font-bold", "mb-6") }) {
                Text(if (initial == null) "Add child" else "Edit child")
            }
            Div({ classes("flex", "flex-col", "gap-4") }) {
                FormField("Name") {
                    Input(InputType.Text) {
                        classes("input", "input-bordered", "w-full")
                        value(name)
                        placeholder("Child's name")
                        onInput { name = it.value }
                    }
                }
                FormField("Date of birth") {
                    Input(InputType.Date) {
                        classes("input", "input-bordered", "w-full")
                        value(birthDate)
                        onInput { birthDate = it.value }
                    }
                }
                FormField("Vaccination schedule") {
                    Select({
                        classes("select", "select-bordered", "w-full")
                        onChange { e ->
                            val v = e.nativeEvent.target.unsafeCast<HTMLSelectElement>().value
                            country = Country.entries.first { it.name == v }
                        }
                    }) {
                        Country.entries.forEach { c ->
                            Option(c.name, { if (c == country) selected() }) { Text(c.displayName) }
                        }
                    }
                }
            }
            Div({ classes("flex", "gap-3", "mt-8") }) {
                Button({ classes("btn", "btn-ghost"); onClick { onCancel() } }) { Text("Cancel") }
                Button({
                    classes("btn", "btn-primary")
                    onClick {
                        if (name.isNotBlank() && birthDate.isNotEmpty()) {
                            onSave(Child(initial?.id ?: randomId(), name.trim(), LocalDate.parse(birthDate), country))
                        }
                    }
                }) { Text("Save") }
            }
        }
    }
}

// ── Child detail: records + schedule tabs (issues 004, 005, 006) ──────────────

@Composable
private fun ChildDetailScreen(
    child: Child,
    records: List<VaccinationRecord>,
    onBack: () -> Unit,
    onEditChild: () -> Unit,
    onAddRecord: () -> Unit,
    onEditRecord: (VaccinationRecord) -> Unit,
    onDeleteRecord: (VaccinationRecord) -> Unit,
) {
    val today = remember { Clock.System.todayIn(TimeZone.currentSystemDefault()) }
    var tab by remember { mutableStateOf(DetailTab.RECORDS) }

    Div({ classes("min-h-screen", "bg-base-100") }) {
        // Screen header — hidden in print
        Div({ classes("bg-base-200", "p-4", "shadow-sm", "print:hidden") }) {
            Div({ classes("max-w-2xl", "mx-auto") }) {
                Button({ classes("btn", "btn-ghost", "btn-xs", "mb-2"); onClick { onBack() } }) { Text("← All children") }
                Div({ classes("flex", "justify-between", "items-start") }) {
                    Div {
                        H1({ classes("text-xl", "font-bold") }) { Text(child.name) }
                        P({ classes("text-sm", "text-base-content/60") }) {
                            Text("Born ${child.birthDate} · ${child.country.displayName}")
                        }
                    }
                    Div({ classes("flex", "gap-2") }) {
                        Button({ classes("btn", "btn-ghost", "btn-sm"); onClick { onEditChild() } }) { Text("Edit") }
                        Button({ classes("btn", "btn-primary", "btn-sm"); onClick { onAddRecord() } }) { Text("+ Record") }
                    }
                }
            }
        }

        Div({ classes("max-w-2xl", "mx-auto", "p-4") }) {
            // Tabs — hidden in print
            Div({ attr("role", "tablist"); classes("tabs", "tabs-bordered", "mb-4", "print:hidden") }) {
                Button({
                    attr("role", "tab")
                    classes("tab", if (tab == DetailTab.RECORDS) "tab-active" else "")
                    onClick { tab = DetailTab.RECORDS }
                }) { Text("Records (${records.size})") }
                Button({
                    attr("role", "tab")
                    classes("tab", if (tab == DetailTab.SCHEDULE) "tab-active" else "")
                    onClick { tab = DetailTab.SCHEDULE }
                }) { Text("Schedule") }
            }

            // Export PDF button — visible on records tab, hidden in print
            if (tab == DetailTab.RECORDS) {
                Div({ classes("flex", "justify-end", "mb-3", "print:hidden") }) {
                    Button({
                        classes("btn", "btn-outline", "btn-sm")
                        onClick { window.print() }
                    }) { Text("Export PDF") }
                }
            }

            // Tab content — hidden in print
            Div({ classes("print:hidden") }) {
                when (tab) {
                    DetailTab.RECORDS -> RecordsList(records, onEditRecord, onDeleteRecord)
                    DetailTab.SCHEDULE -> ScheduleView(child, records, today)
                }
            }

            // Print-only vaccination table
            PrintView(child, records)
        }
    }
}

// ── Records list (issue 005) ──────────────────────────────────────────────────

@Composable
private fun RecordsList(
    records: List<VaccinationRecord>,
    onEdit: (VaccinationRecord) -> Unit,
    onDelete: (VaccinationRecord) -> Unit,
) {
    if (records.isEmpty()) {
        Div({ classes("text-center", "py-12", "text-base-content/60") }) {
            P { Text("No vaccination records yet. Tap \"+ Record\" to add one.") }
        }
        return
    }

    Div({ classes("flex", "flex-col", "gap-3") }) {
        records.sortedByDescending { it.date }.forEach { record ->
            val brandName = record.brandId?.let { id -> Seed.brands.find { it.id == id }?.name }
                ?: record.customBrandName
            val diseaseNames = record.diseaseIds.mapNotNull { Seed.diseaseById[it]?.name }
                .ifEmpty { record.brandId?.let { Seed.brandCoverage[it]?.mapNotNull { d -> Seed.diseaseById[d]?.name } } ?: emptyList() }

            Div({ classes("card", "bg-base-200") }) {
                Div({ classes("card-body", "p-4") }) {
                    Div({ classes("flex", "justify-between", "items-start") }) {
                        Div({ classes("flex-1", "min-w-0") }) {
                            Div({ classes("font-semibold") }) { Text(record.date.toString()) }
                            if (brandName != null) Div({ classes("text-sm") }) { Text(brandName) }
                            if (diseaseNames.isNotEmpty()) Div({ classes("text-xs", "text-base-content/60") }) { Text(diseaseNames.joinToString(", ")) }
                            if (!record.serialNumber.isNullOrBlank()) Div({ classes("text-xs", "text-base-content/50") }) { Text("S/N: ${record.serialNumber}") }
                            if (!record.notes.isNullOrBlank()) Div({ classes("text-xs", "text-base-content/50", "italic") }) { Text(record.notes) }
                        }
                        Div({ classes("flex", "gap-1", "ml-2", "flex-shrink-0") }) {
                            Button({ classes("btn", "btn-ghost", "btn-xs"); onClick { onEdit(record) } }) { Text("Edit") }
                            Button({ classes("btn", "btn-ghost", "btn-xs", "text-error"); onClick { onDelete(record) } }) { Text("Del") }
                        }
                    }
                }
            }
        }
    }
}

// ── Record form (issue 005) ───────────────────────────────────────────────────

// ponytail: datalist element — Compose HTML has no built-in Datalist composable
private val DatalistBuilder = ElementBuilder.createBuilder<org.w3c.dom.HTMLElement>("datalist")
private val DLOptionBuilder = ElementBuilder.createBuilder<org.w3c.dom.HTMLElement>("option")

@Composable
private fun RecordFormScreen(
    childId: String,
    initial: VaccinationRecord?,
    onSave: (VaccinationRecord) -> Unit,
    onCancel: () -> Unit,
) {
    val todayStr = remember { Clock.System.todayIn(TimeZone.currentSystemDefault()).toString() }

    val initBrandName = remember(initial) {
        initial?.customBrandName ?: initial?.brandId?.let { id -> Seed.brands.find { it.id == id }?.name } ?: ""
    }
    val initDiseases = remember(initial) {
        initial?.diseaseIds?.toSet()
            ?: initial?.brandId?.let { Seed.brandCoverage[it] }
            ?: emptySet()
    }

    var brandInput by remember { mutableStateOf(initBrandName) }
    var selectedBrandId by remember { mutableStateOf(initial?.brandId) }
    var selectedDiseases by remember { mutableStateOf(initDiseases) }
    var date by remember { mutableStateOf(initial?.date?.toString() ?: todayStr) }
    var serial by remember { mutableStateOf(initial?.serialNumber ?: "") }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }

    fun onBrandChange(value: String) {
        brandInput = value
        val matched = Seed.brands.find { it.name == value }
        selectedBrandId = matched?.id
        if (matched != null) selectedDiseases = Seed.brandCoverage[matched.id] ?: emptySet()
    }

    Div({ classes("min-h-screen", "bg-base-100", "p-4") }) {
        Div({ classes("max-w-lg", "mx-auto") }) {
            H1({ classes("text-2xl", "font-bold", "mb-6") }) {
                Text(if (initial == null) "Add record" else "Edit record")
            }

            // Brand datalist
            TagElement(DatalistBuilder, { id("brands-list") }) {
                Seed.brands.forEach { brand ->
                    TagElement(DLOptionBuilder, { attr("value", brand.name) }) {}
                }
            }

            Div({ classes("flex", "flex-col", "gap-4") }) {
                FormField("Vaccine / Brand") {
                    Input(InputType.Text) {
                        classes("input", "input-bordered", "w-full")
                        value(brandInput)
                        attr("list", "brands-list")
                        placeholder("Search or type brand name")
                        onInput { onBrandChange(it.value) }
                    }
                }

                FormField("Diseases covered") {
                    Div({ classes("border", "border-base-300", "rounded-lg", "p-2", "max-h-48", "overflow-y-auto") }) {
                        Seed.diseases.forEach { disease ->
                            val isChecked = disease.id in selectedDiseases
                            Label(attrs = { classes("flex", "items-center", "gap-2", "p-1", "cursor-pointer", "hover:bg-base-200", "rounded") }) {
                                Input(InputType.Checkbox) {
                                    classes("checkbox", "checkbox-sm")
                                    prop({ el: HTMLInputElement, v: Boolean -> el.checked = v }, isChecked)
                                    onChange {
                                        selectedDiseases = if (isChecked) selectedDiseases - disease.id else selectedDiseases + disease.id
                                    }
                                }
                                Span({ classes("text-sm") }) { Text(disease.name) }
                            }
                        }
                    }
                }

                FormField("Date") {
                    Input(InputType.Date) {
                        classes("input", "input-bordered", "w-full")
                        value(date)
                        onInput { date = it.value }
                    }
                }

                FormField("Serial / Lot number (optional)") {
                    Input(InputType.Text) {
                        classes("input", "input-bordered", "w-full")
                        value(serial)
                        placeholder("e.g. A12345B")
                        onInput { serial = it.value }
                    }
                }

                FormField("Notes (optional)") {
                    Input(InputType.Text) {
                        classes("input", "input-bordered", "w-full")
                        value(notes)
                        placeholder("Doctor name, clinic, etc.")
                        onInput { notes = it.value }
                    }
                }
            }

            Div({ classes("flex", "gap-3", "mt-8") }) {
                Button({ classes("btn", "btn-ghost"); onClick { onCancel() } }) { Text("Cancel") }
                Button({
                    classes("btn", "btn-primary")
                    onClick {
                        if (date.isNotEmpty()) {
                            onSave(VaccinationRecord(
                                id = initial?.id ?: randomId(),
                                childId = childId,
                                date = LocalDate.parse(date),
                                brandId = selectedBrandId,
                                customBrandName = if (selectedBrandId == null && brandInput.isNotBlank()) brandInput.trim() else null,
                                diseaseIds = selectedDiseases.toList(),
                                serialNumber = serial.trim().takeIf { it.isNotBlank() },
                                notes = notes.trim().takeIf { it.isNotBlank() }
                            ))
                        }
                    }
                }) { Text("Save") }
            }
        }
    }
}

// ── Schedule view matrix (issue 006) ─────────────────────────────────────────

@Composable
private fun ScheduleView(child: Child, records: List<VaccinationRecord>, today: LocalDate) {
    val results = remember(child.id, child.country, records, today) {
        ScheduleEngine.compute(child, records, today)
    }
    val entries = Seed.scheduleEntries.filter { it.country == child.country }
    val diseases = entries.map { Seed.diseaseById.getValue(it.diseaseId) }.distinctBy { it.id }
    val milestones = entries.map { it.ageWeeks }.distinct().sorted()
    val childAgeWeeks = child.birthDate.daysUntil(today) / 7
    val todayCol = milestones.indexOfLast { w -> w <= childAgeWeeks }

    // Legend
    Div({ classes("flex", "gap-4", "text-xs", "mb-3", "text-base-content/60") }) {
        Span { Text("✓ Done  ! Overdue  · Upcoming") }
        Span({ classes("ml-auto") }) { Text("Age: ${childAgeWeeks}w") }
    }

    Div({ classes("overflow-x-auto") }) {
        Table({ classes("table", "table-xs", "table-pin-rows") }) {
            Thead {
                Tr {
                    Th({ classes("bg-base-100", "text-xs", "whitespace-nowrap") }) { Text("Disease") }
                    milestones.forEachIndexed { i: Int, w: Int ->
                        Th({
                            classes("text-center", "text-xs")
                            if (i == todayCol) classes("bg-primary/15", "text-primary")
                        }) { Text(weeksToLabel(w)) }
                    }
                }
            }
            Tbody {
                diseases.forEach { disease ->
                    Tr {
                        Td({ classes("text-xs", "whitespace-nowrap", "font-medium") }) { Text(disease.name) }
                        milestones.forEachIndexed { i: Int, w: Int ->
                            val result = results.find { it.entry.diseaseId == disease.id && it.entry.ageWeeks == w }
                            Td({
                                classes("text-center")
                                if (i == todayCol) classes("bg-primary/10")
                            }) {
                                if (result != null) {
                                    val (icon, cls) = when (result.status) {
                                        ScheduleStatus.DONE -> "✓" to "text-success font-bold"
                                        ScheduleStatus.HIGHLIGHTED -> "!" to "text-warning font-bold"
                                        ScheduleStatus.UPCOMING -> "·" to "text-base-content/20"
                                    }
                                    Span({ classes(cls) }) { Text(icon) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── Print view (issue 007) ────────────────────────────────────────────────────

@Composable
private fun PrintView(child: Child, records: List<VaccinationRecord>) {
    Div({ classes("hidden", "print:block") }) {
        Div({ classes("mb-4") }) {
            H1({ classes("text-2xl", "font-bold") }) { Text(child.name) }
            P({ classes("text-sm") }) { Text("Date of birth: ${child.birthDate} · ${child.country.displayName}") }
        }
        Table({ classes("w-full", "border-collapse", "text-sm") }) {
            Thead {
                Tr {
                    listOf("Date", "Vaccine / Brand", "Diseases", "Serial / Lot", "Notes").forEach { h ->
                        Th({ classes("border", "border-gray-400", "p-2", "text-left", "bg-gray-100") }) { Text(h) }
                    }
                }
            }
            Tbody {
                records.sortedBy { it.date }.forEach { rec ->
                    val brand = rec.brandId?.let { id -> Seed.brands.find { it.id == id }?.name } ?: rec.customBrandName ?: ""
                    val diseases = rec.diseaseIds.mapNotNull { Seed.diseaseById[it]?.name }
                        .ifEmpty { rec.brandId?.let { Seed.brandCoverage[it]?.mapNotNull { d -> Seed.diseaseById[d]?.name } } ?: emptyList() }
                    Tr {
                        Td({ classes("border", "border-gray-400", "p-2") }) { Text(rec.date.toString()) }
                        Td({ classes("border", "border-gray-400", "p-2") }) { Text(brand) }
                        Td({ classes("border", "border-gray-400", "p-2") }) { Text(diseases.joinToString(", ")) }
                        Td({ classes("border", "border-gray-400", "p-2") }) { Text(rec.serialNumber ?: "") }
                        Td({ classes("border", "border-gray-400", "p-2") }) { Text(rec.notes ?: "") }
                    }
                }
            }
        }
    }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

@Composable
private fun FormField(label: String, content: @Composable () -> Unit) {
    Div({ classes("form-control") }) {
        Label(attrs = { classes("label") }) { Span({ classes("label-text") }) { Text(label) } }
        content()
    }
}

@Composable
private fun DeleteModal(title: String, body: String, onConfirm: () -> Unit, onDismiss: () -> Unit) {
    Div({ classes("modal", "modal-open") }) {
        Div({ classes("modal-box") }) {
            H3({ classes("font-bold", "text-lg") }) { Text(title) }
            P({ classes("py-4") }) { Text(body) }
            Div({ classes("modal-action") }) {
                Button({ classes("btn"); onClick { onDismiss() } }) { Text("Cancel") }
                Button({ classes("btn", "btn-error"); onClick { onConfirm() } }) { Text("Delete") }
            }
        }
        Div({ classes("modal-backdrop"); onClick { onDismiss() } }) {}
    }
}
