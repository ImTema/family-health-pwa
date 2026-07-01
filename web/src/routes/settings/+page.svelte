<script lang="ts">
  import { onMount } from 'svelte'
  import { db } from '$lib/db'

  let theme = $state('light')
  let importError = $state<string | null>(null)
  let exportDone = $state(false)
  let importInput: HTMLInputElement

  onMount(() => {
    theme = localStorage.getItem('theme') ?? 'light'
  })

  function setTheme(t: string) {
    theme = t
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  async function doExport() {
    const today = new Date().toISOString().split('T')[0]
    const chs = await db.getChildren()
    const backup = {
      version: 2,
      exportedAt: today,
      children: await Promise.all(chs.map(async c => ({ ...c, records: await db.getRecords(c.id) })))
    }
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

  async function doImport(json: string) {
    if (!confirm('This will replace all existing data with the backup. Continue?')) return
    try {
      const backup = JSON.parse(json)
      await db.deleteAll()
      for (const bc of backup.children) {
        await db.saveChild({ id: bc.id, name: bc.name, birthDate: bc.birthDate, country: bc.country, sex: bc.sex, photo: bc.photo })
        for (const br of bc.records ?? []) await db.saveRecord(br)
      }
      localStorage.removeItem('activeChildId')
    } catch (e) {
      importError = `Import failed: ${e instanceof Error ? e.message : 'Invalid file'}`
    }
  }
</script>

<div class="min-h-screen bg-base-100 p-4">
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
          <h2 class="card-title text-base">Backup</h2>
          <p class="text-sm text-base-content/60">Export all children, records, and photos to a JSON file. Import restores from a previous export.</p>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" onclick={doExport}>Export backup</button>
            <button class="btn btn-outline btn-sm" onclick={() => importInput.click()}>Import backup</button>
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

{#if importError}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Import failed</h3>
      <p class="py-4">{importError}</p>
      <div class="modal-action">
        <button class="btn" onclick={() => importError = null}>OK</button>
      </div>
    </div>
    <div class="modal-backdrop" onclick={() => importError = null}></div>
  </div>
{/if}
