<script lang="ts">
  import { onMount } from 'svelte'
  import { db } from '$lib/db'
  import { brandNameFor, diseaseNamesFor } from '$lib/schedule'
  import { todayISO } from '$lib/utils'
  import { toBackup, fromBackup } from '$lib/backup'
  import Icon from '$lib/components/Icon.svelte'
  import type { Child } from '$lib/types'

  let theme = $state('light')
  let importError = $state<string | null>(null)
  let importSummary = $state<string | null>(null)
  let exportDone = $state(false)
  let cleanDone = $state(false)
  let importInput: HTMLInputElement
  let children = $state<Child[]>([])
  let selectedIds = $state<Set<string>>(new Set())

  onMount(async () => {
    theme = localStorage.getItem('theme') ?? 'light'
    await refreshChildren()
  })

  async function refreshChildren() {
    children = await db.getChildren()
    selectedIds = new Set(children.map(c => c.id))
  }

  function setTheme(t: string) {
    theme = t
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  async function doExport() {
    const today = todayISO()
    const chs = children.filter(c => selectedIds.has(c.id))
    const backup = toBackup(await Promise.all(chs.map(async c => ({ ...c, records: await db.getRecords(c.id) }))), today)
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vaccinations-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
    exportDone = true
    setTimeout(() => exportDone = false, 3000)
  }

  function csvField(v: string): string {
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
  }

  async function doExportCsv() {
    const today = todayISO()
    const chs = children.filter(c => selectedIds.has(c.id))
    const rows = [['Name', 'Date', 'Vaccine / Brand', 'Diseases', 'Serial / Lot', 'Notes']]
    for (const c of chs) {
      const records = await db.getRecords(c.id)
      for (const r of records) {
        rows.push([c.name, r.date, brandNameFor(r), diseaseNamesFor(r).join('; '), r.kind === 'vaccine' ? r.serialNumber ?? '' : '', r.notes ?? ''])
      }
    }
    const csv = rows.map(row => row.map(csvField).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vaccinations-${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function doImport(json: string) {
    if (!confirm('This will merge the backup into your existing data (family members/records with matching IDs will be overwritten, everything else stays). Continue?')) return
    try {
      const backup = fromBackup(json)
      let recordCount = 0
      for (const { records, ...child } of backup.children) {
        await db.saveChild(child)
        for (const r of records) await db.saveRecord(r)
        recordCount += records.length
      }
      await refreshChildren()
      importSummary = `Imported ${backup.children.length} ${backup.children.length === 1 ? 'family member' : 'family members'}, ${recordCount} ${recordCount === 1 ? 'record' : 'records'}`
      setTimeout(() => importSummary = null, 3000)
    } catch (e) {
      importError = `Import failed: ${e instanceof Error ? e.message : 'Invalid file'}`
    }
  }

  async function doCleanData() {
    if (!confirm('This will permanently delete ALL family members and records from this device. This cannot be undone. Continue?')) return
    await db.deleteAll()
    localStorage.removeItem('activeChildId')
    await refreshChildren()
    cleanDone = true
    setTimeout(() => cleanDone = false, 3000)
  }
</script>

<svelte:head><title>Settings · VaxTrack</title></svelte:head>

<div class="min-h-full bg-base-100 p-4">
  <div class="max-w-lg mx-auto">
    <a href="/" class="btn btn-ghost btn-xs mb-4">← Back</a>
    <h1 class="text-2xl font-bold mb-6">Settings</h1>

    <input
      bind:this={importInput}
      type="file"
      accept=".json"
      class="hidden"
      onchange={e => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => doImport(ev.target?.result as string)
        reader.readAsText(file)
      }}
    />

    <div class="flex flex-col gap-6">
      <div class="card bg-base-200">
        <div class="card-body gap-3">
          <h2 class="card-title text-base">Backup</h2>
          <p class="text-sm text-base-content/60">Export the selected family members' records and photos to a JSON file. Import merges a backup into your existing data (matching IDs are overwritten, everything else is kept).</p>
          {#if children.length > 1}
            <div class="flex flex-col gap-1">
              {#each children as c (c.id)}
                <label class="label cursor-pointer justify-start gap-2 py-0">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    checked={selectedIds.has(c.id)}
                    onchange={e => {
                      const next = new Set(selectedIds)
                      if ((e.target as HTMLInputElement).checked) next.add(c.id)
                      else next.delete(c.id)
                      selectedIds = next
                    }}
                  />
                  <span class="label-text text-sm">{c.name}</span>
                </label>
              {/each}
            </div>
          {/if}
          <div class="flex gap-2 flex-wrap">
            <button class="btn btn-outline btn-sm" disabled={selectedIds.size === 0} onclick={doExport}>Export backup</button>
            <button class="btn btn-outline btn-sm" onclick={() => importInput.click()}>Import backup</button>
            <button class="btn btn-outline btn-sm" disabled={selectedIds.size === 0} onclick={doExportCsv}>Export CSV</button>
          </div>
        </div>
      </div>

      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title text-base">Appearance</h2>
          <div class="flex items-center justify-between">
            <span class="text-sm">Theme</span>
            <div class="flex gap-2">
              <button
                class="btn btn-sm {theme === 'light' ? 'btn-primary' : 'btn-ghost'}"
                onclick={() => setTheme('light')}
              >Light</button>
              <button
                class="btn btn-sm {theme === 'dark' ? 'btn-primary' : 'btn-ghost'}"
                onclick={() => setTheme('dark')}
              >Dark</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200">
        <div class="card-body gap-3">
          <h2 class="card-title text-base"><Icon name="info" size={18} /> About VaxTrack</h2>
          <p class="text-sm">VaxTrack helps you keep track of your family member's vaccinations wherever you move. See what's done, what's overdue, and what's coming next — compared against your country's official schedule. Export a clean summary for doctors and schools any time.</p>
          <ul class="text-sm list-disc list-inside text-base-content/80">
            <li>Log a vaccination in seconds</li>
            <li>Compare against country schedules</li>
            <li>Export a PDF for clinics or schools</li>
            <li>Works fully offline</li>
            <li>All your data stays on your device</li>
          </ul>
          <p class="text-sm text-base-content/60">Privacy: all your data is stored only on this device. Nothing is uploaded, nothing is shared.</p>
        </div>
      </div>

      <div class="card bg-base-200">
        <div class="card-body gap-3">
          <h2 class="card-title text-base">Danger zone</h2>
          <p class="text-sm text-base-content/60">Permanently delete all family members and records from this device.</p>
          <div>
            <button class="btn btn-error btn-sm" onclick={doCleanData}>Clean all data</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

{#if exportDone}
  <div class="toast toast-top toast-center z-50">
    <div class="alert alert-success">
      <span>Backup exported</span>
    </div>
  </div>
{/if}

{#if cleanDone}
  <div class="toast toast-top toast-center z-50">
    <div class="alert alert-success">
      <span>All data cleared</span>
    </div>
  </div>
{/if}

{#if importSummary}
  <div class="toast toast-top toast-center z-50">
    <div class="alert alert-success">
      <span>{importSummary}</span>
    </div>
  </div>
{/if}

{#if importError}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Import failed</h3>
      <p class="py-4">{importError}</p>
      <div class="modal-action">
        <button class="btn" onclick={() => importError = null}>OK</button>
      </div>
    </div>
    <button type="button" class="modal-backdrop" aria-label="Close" onclick={() => importError = null}></button>
  </div>
{/if}
