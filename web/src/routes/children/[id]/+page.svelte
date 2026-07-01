<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { brands, brandCoverage, diseaseById } from '$lib/seed'
  import { computeSchedule, childAgeWeeks, weeksToLabel } from '$lib/schedule'
  import { COUNTRY_LABELS, type Child, type VaccinationRecord } from '$lib/types'

  const id = page.params.id

  let child = $state<Child | null>(null)
  let records = $state<VaccinationRecord[]>([])
  let tab = $state<'records' | 'schedule'>('records')
  let confirmDelete = $state<VaccinationRecord | null>(null)

  onMount(async () => {
    const children = await db.getChildren()
    child = children.find(c => c.id === id) ?? null
    if (!child) { goto('/'); return }
    records = await db.getRecords(id)
  })

  async function doDeleteRecord(record: VaccinationRecord) {
    await db.deleteRecord(record.id)
    records = await db.getRecords(id)
    confirmDelete = null
  }

  function brandName(r: VaccinationRecord): string {
    return brands.find(b => b.id === r.brandId)?.name ?? r.customBrandName ?? ''
  }

  function diseaseNames(r: VaccinationRecord): string {
    const ids = r.diseaseIds.length ? r.diseaseIds : (r.brandId ? brandCoverage[r.brandId] ?? [] : [])
    return ids.map(id => diseaseById[id]?.name).filter(Boolean).join(', ')
  }

  const schedule = $derived(child ? computeSchedule(child, records) : [])
  const milestones = $derived([...new Set(schedule.map(r => r.entry.ageWeeks))].sort((a, b) => a - b))
  const diseases = $derived([...new Map(schedule.map(r => [r.disease.id, r.disease])).values()])
  const todayCol = $derived(child ? milestones.findLastIndex(w => w <= childAgeWeeks(child!.birthDate)) : -1)
</script>

{#if child}
<div class="min-h-screen bg-base-100">
  <div class="bg-base-200 p-4 shadow-sm print:hidden">
    <div class="max-w-2xl mx-auto">
      <a href="/" class="btn btn-ghost btn-xs mb-2">← All children</a>
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-xl font-bold">{child.name}</h1>
          <p class="text-sm text-base-content/60">Born {child.birthDate} · {COUNTRY_LABELS[child.country]}</p>
        </div>
        <div class="flex gap-2">
          <a href="/children/{id}/edit" class="btn btn-ghost btn-sm">Edit</a>
          <a href="/children/{id}/record/new" class="btn btn-primary btn-sm">+ Record</a>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-2xl mx-auto p-4">
    <div role="tablist" class="tabs tabs-bordered mb-4 print:hidden">
      <button role="tab" class="tab {tab === 'records' ? 'tab-active' : ''}" onclick={() => tab = 'records'}>
        Records ({records.length})
      </button>
      <button role="tab" class="tab {tab === 'schedule' ? 'tab-active' : ''}" onclick={() => tab = 'schedule'}>
        Schedule
      </button>
    </div>

    <div class="print:hidden">
      {#if tab === 'records'}
        <div class="flex justify-end mb-3">
          <button class="btn btn-outline btn-sm" onclick={() => window.print()}>Export PDF</button>
        </div>

        {#if records.length === 0}
          <div class="text-center py-12 text-base-content/60">
            <p>No vaccination records yet. Tap "+ Record" to add one.</p>
          </div>
        {:else}
          <div class="flex flex-col gap-3">
            {#each [...records].sort((a, b) => b.date.localeCompare(a.date)) as record}
              <div class="card bg-base-200">
                <div class="card-body p-4">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold">{record.date}</div>
                      {#if brandName(record)}<div class="text-sm">{brandName(record)}</div>{/if}
                      {#if diseaseNames(record)}<div class="text-xs text-base-content/60">{diseaseNames(record)}</div>{/if}
                      {#if record.serialNumber}<div class="text-xs text-base-content/50">S/N: {record.serialNumber}</div>{/if}
                      {#if record.notes}<div class="text-xs text-base-content/50 italic">{record.notes}</div>{/if}
                    </div>
                    <div class="flex gap-1 ml-2 flex-shrink-0">
                      <a href="/children/{id}/record/{record.id}" class="btn btn-ghost btn-xs">Edit</a>
                      <button class="btn btn-ghost btn-xs text-error" onclick={() => confirmDelete = record}>Del</button>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}

      {:else}
        <div class="flex gap-4 text-xs mb-3 text-base-content/60">
          <span>✓ Done &nbsp; ! Overdue &nbsp; · Upcoming</span>
          <span class="ml-auto">Age: {childAgeWeeks(child.birthDate)}w</span>
        </div>
        <div class="overflow-x-auto">
          <table class="table table-xs table-pin-rows">
            <thead>
              <tr>
                <th class="bg-base-100 text-xs whitespace-nowrap">Disease</th>
                {#each milestones as w, i}
                  <th class="text-center text-xs {i === todayCol ? 'bg-primary/15 text-primary' : ''}">
                    {weeksToLabel(w)}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each diseases as disease}
                <tr>
                  <td class="text-xs whitespace-nowrap font-medium">{disease.name}</td>
                  {#each milestones as w, i}
                    {@const result = schedule.find(r => r.entry.diseaseId === disease.id && r.entry.ageWeeks === w)}
                    <td class="text-center {i === todayCol ? 'bg-primary/10' : ''}">
                      {#if result}
                        {@const [icon, cls] =
                          result.status === 'DONE'        ? ['✓', 'text-success font-bold'] :
                          result.status === 'HIGHLIGHTED' ? ['!', 'text-warning font-bold'] :
                                                            ['·', 'text-base-content/20']}
                        <span class={cls}>{icon}</span>
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Print view -->
    <div class="hidden print:block">
      <div class="mb-4">
        <h1 class="text-2xl font-bold">{child.name}</h1>
        <p class="text-sm">Date of birth: {child.birthDate} · {COUNTRY_LABELS[child.country]}</p>
      </div>
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            {#each ['Date', 'Vaccine / Brand', 'Diseases', 'Serial / Lot', 'Notes'] as h}
              <th class="border border-gray-400 p-2 text-left bg-gray-100">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each [...records].sort((a, b) => a.date.localeCompare(b.date)) as r}
            <tr>
              <td class="border border-gray-400 p-2">{r.date}</td>
              <td class="border border-gray-400 p-2">{brandName(r)}</td>
              <td class="border border-gray-400 p-2">{diseaseNames(r)}</td>
              <td class="border border-gray-400 p-2">{r.serialNumber ?? ''}</td>
              <td class="border border-gray-400 p-2">{r.notes ?? ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
{/if}

{#if confirmDelete}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Delete this record?</h3>
      <p class="py-4">Recorded on {confirmDelete.date}. This cannot be undone.</p>
      <div class="modal-action">
        <button class="btn" onclick={() => confirmDelete = null}>Cancel</button>
        <button class="btn btn-error" onclick={() => doDeleteRecord(confirmDelete!)}>Delete</button>
      </div>
    </div>
    <div class="modal-backdrop" onclick={() => confirmDelete = null}></div>
  </div>
{/if}
