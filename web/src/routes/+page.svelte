<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { COUNTRY_LABELS, type Child } from '$lib/types'

  let children = $state<Child[]>([])
  let activeId = $state<string | null>(null)
  let confirmDelete = $state<Child | null>(null)
  let importError = $state<string | null>(null)
  let importInput: HTMLInputElement

  onMount(async () => {
    activeId = localStorage.getItem('activeChildId')
    children = await db.getChildren()
    if (!children.some(c => c.id === activeId)) {
      activeId = null
      localStorage.removeItem('activeChildId')
    }
  })

  function activate(id: string) {
    activeId = id
    localStorage.setItem('activeChildId', id)
  }

  async function doDelete(child: Child) {
    await db.deleteChild(child.id)
    if (activeId === child.id) {
      activeId = null
      localStorage.removeItem('activeChildId')
    }
    children = await db.getChildren()
    confirmDelete = null
  }

  async function doExport() {
    const today = new Date().toISOString().split('T')[0]
    const chs = await db.getChildren()
    const backup = {
      version: 1,
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
  }

  async function doImport(json: string) {
    if (!confirm('This will replace all existing data with the backup. Continue?')) return
    try {
      const backup = JSON.parse(json)
      await db.deleteAll()
      for (const bc of backup.children) {
        await db.saveChild({ id: bc.id, name: bc.name, birthDate: bc.birthDate, country: bc.country })
        for (const br of bc.records ?? []) await db.saveRecord(br)
      }
      children = await db.getChildren()
      activeId = children[0]?.id ?? null
      if (activeId) localStorage.setItem('activeChildId', activeId)
      else localStorage.removeItem('activeChildId')
    } catch (e) {
      importError = `Import failed: ${e instanceof Error ? e.message : 'Invalid file'}`
    }
  }
</script>

<div class="min-h-screen bg-base-100 p-4">
  <div class="max-w-lg mx-auto">
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

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">VaxTrack</h1>
      <div class="flex gap-2">
        <div class="dropdown dropdown-end">
          <button tabindex="0" class="btn btn-ghost btn-sm">⋮</button>
          <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44 z-10">
            <li><a href="#" onclick={e => { e.preventDefault(); doExport() }}>Export backup</a></li>
            <li><a href="#" onclick={e => { e.preventDefault(); importInput.click() }}>Import backup</a></li>
          </ul>
        </div>
        <a href="/children/new" class="btn btn-primary btn-sm">+ Add child</a>
      </div>
    </div>

    {#if children.length === 0}
      <div class="hero min-h-64">
        <div class="hero-content text-center">
          <div>
            <p class="text-base-content/60 mb-4">No children yet.</p>
            <a href="/children/new" class="btn btn-primary">Add your first child</a>
          </div>
        </div>
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#each children as child}
          {@const isActive = child.id === activeId}
          <div
            class="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors {isActive ? 'ring-2 ring-primary' : ''}"
            onclick={() => { activate(child.id); goto(`/children/${child.id}`) }}
            role="button"
            tabindex="0"
            onkeydown={e => e.key === 'Enter' && goto(`/children/${child.id}`)}
          >
            <div class="card-body p-4">
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-semibold text-lg">{child.name}</div>
                  <div class="text-sm text-base-content/60">
                    {COUNTRY_LABELS[child.country]} · Born {child.birthDate}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  {#if isActive}<span class="badge badge-primary badge-sm">Active</span>{/if}
                  <a
                    href="/children/{child.id}/edit"
                    class="btn btn-ghost btn-xs"
                    onclick={e => e.stopPropagation()}
                  >Edit</a>
                  <button
                    class="btn btn-ghost btn-xs text-error"
                    onclick={e => { e.stopPropagation(); confirmDelete = child }}
                  >Delete</button>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if confirmDelete}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Delete {confirmDelete.name}?</h3>
      <p class="py-4">All vaccination records for {confirmDelete.name} will be deleted.</p>
      <div class="modal-action">
        <button class="btn" onclick={() => confirmDelete = null}>Cancel</button>
        <button class="btn btn-error" onclick={() => doDelete(confirmDelete!)}>Delete</button>
      </div>
    </div>
    <div class="modal-backdrop" onclick={() => confirmDelete = null}></div>
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
