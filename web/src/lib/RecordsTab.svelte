<script lang="ts">
  import { brands } from './seed'
  import { diseasesFor } from './schedule'
  import { diseaseById } from './seed'
  import { formatDate, childAge } from './utils'
  import { COUNTRY_LABELS, type Child, type VaccinationRecord } from './types'
  import Icon from './Icon.svelte'

  let { childId, child, records }: { childId: string; child: Child; records: VaccinationRecord[] } = $props()

  let sortBy = $state<'date' | 'brand'>('date')
  let groupByDisease = $state(false)

  function brandName(r: VaccinationRecord): string {
    return brands.find(b => b.id === r.brandId)?.name ?? r.customBrandName ?? ''
  }

  function diseaseNames(r: VaccinationRecord): string[] {
    return [...diseasesFor(r)].map(id => diseaseById[id]?.name).filter(Boolean) as string[]
  }

  function sortedRecords(): VaccinationRecord[] {
    return [...records].sort((a, b) =>
      sortBy === 'date'
        ? b.date.localeCompare(a.date)
        : (brandName(a) || '').localeCompare(brandName(b) || '') || b.date.localeCompare(a.date)
    )
  }

  function groupedRecords(): Map<string, VaccinationRecord[]> {
    const groups = new Map<string, VaccinationRecord[]>()
    for (const r of sortedRecords()) {
      const names = diseaseNames(r)
      const key = names.length ? names[0] : 'Other'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(r)
    }
    return groups
  }

  function doPrint() {
    const today = new Date().toISOString().split('T')[0]
    const prev = document.title
    document.title = `${child.name}-vaccinations-${formatDate(today)}`
    // ponytail: force light theme for print so dark-mode gray text doesn't wash out on paper
    document.documentElement.setAttribute('data-theme', 'light')
    window.onafterprint = () => {
      document.title = prev
      document.documentElement.removeAttribute('data-theme')
      window.onafterprint = null
    }
    window.print()
  }
</script>

<div class="print:hidden">
  <div class="flex items-center gap-3 mb-3">
    <select class="select select-ghost select-sm w-auto font-medium focus:outline-none" bind:value={sortBy}>
      <option value="date">Sort by date</option>
      <option value="brand">Sort by brand</option>
    </select>
    <div class="ml-auto flex gap-2">
      <button
        class="btn btn-ghost btn-sm {groupByDisease ? 'btn-active' : ''}"
        title="Group by disease"
        onclick={() => groupByDisease = !groupByDisease}
      ><Icon name="virus" size={20} strokeWidth={1.5} /></button>
      <button class="btn btn-ghost btn-sm" title="Export PDF" onclick={doPrint}><Icon name="printer" /></button>
    </div>
  </div>

  {#if records.length === 0}
    <div class="text-center py-12 text-base-content/60">
      <p>No vaccination records yet. Tap "+ Record" to add one.</p>
    </div>
  {:else if groupByDisease}
    {#each groupedRecords() as [disease, recs]}
      <h2 class="text-sm font-bold bg-base-200 px-3 py-1.5 mt-6 mb-2 rounded">{disease}</h2>
      <div class="overflow-x-auto mb-4">
        <table class="table table-xs w-full">
          <thead>
            <tr>{#each ['Date', 'Vaccine / Brand', 'Serial / Lot', 'Notes', ''] as h}<th class="text-[10px] font-bold text-base-content">{h}</th>{/each}</tr>
          </thead>
          <tbody>
            {#each recs as record}
              <tr>
                <td class="whitespace-nowrap">{formatDate(record.date)}</td>
                <td>{brandName(record)}</td>
                <td>{record.serialNumber ?? ''}</td>
                <td>{record.notes ?? ''}</td>
                <td>
                  <a href="/children/{childId}/record/{record.id}" class="btn btn-ghost btn-xs" title="Edit"><Icon name="pencil" /></a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/each}
  {:else}
    {#each sortedRecords() as record}
      {@render recordCard(record)}
    {/each}
  {/if}
</div>

<!-- Print view -->
<div class="hidden print:block">
  <div class="mb-4">
    <h1 class="text-2xl font-bold">{child.name}</h1>
    <p class="text-sm">{formatDate(child.birthDate)} · {childAge(child.birthDate)} · {COUNTRY_LABELS[child.country]}</p>
  </div>
  {#if groupByDisease}
    {#each groupedRecords() as [disease, recs]}
      <h2 class="text-lg font-semibold mt-4 mb-1">{disease}</h2>
      <table class="w-full border-collapse text-sm mb-4">
        <thead>
          <tr>{#each ['Date', 'Vaccine / Brand', 'Serial / Lot', 'Notes'] as h}<th class="border border-gray-400 p-2 text-left bg-gray-100">{h}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each recs as r}
            <tr>
              <td class="border border-gray-400 p-2">{formatDate(r.date)}</td>
              <td class="border border-gray-400 p-2">{brandName(r)}</td>
              <td class="border border-gray-400 p-2">{r.serialNumber ?? ''}</td>
              <td class="border border-gray-400 p-2">{r.notes ?? ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/each}
  {:else}
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>{#each ['Date', 'Vaccine / Brand', 'Diseases', 'Serial / Lot', 'Notes'] as h}<th class="border border-gray-400 p-2 text-left bg-gray-100">{h}</th>{/each}</tr>
      </thead>
      <tbody>
        {#each sortedRecords() as r}
          <tr>
            <td class="border border-gray-400 p-2">{formatDate(r.date)}</td>
            <td class="border border-gray-400 p-2">{brandName(r)}</td>
            <td class="border border-gray-400 p-2">{diseaseNames(r).join(', ')}</td>
            <td class="border border-gray-400 p-2">{r.serialNumber ?? ''}</td>
            <td class="border border-gray-400 p-2">{r.notes ?? ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

{#snippet recordCard(record: VaccinationRecord)}
  <div class="card bg-base-200 mb-3">
    <div class="card-body p-4">
      <div class="flex justify-between items-start">
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
            <span>{formatDate(record.date)}</span>
            {#if brandName(record)}<span class="font-semibold">{brandName(record)}</span>{/if}
            {#if record.serialNumber}<span class="text-base-content/50 text-[10px]">{record.serialNumber}</span>{/if}
          </div>
          {#if diseaseNames(record).length > 0}
            <div class="flex flex-wrap gap-1 mt-1.5">
              {#each diseaseNames(record) as name}
                <span class="badge badge-xs border border-base-300 bg-transparent text-base-content/60">{name}</span>
              {/each}
            </div>
          {/if}
          {#if record.notes}<div class="text-xs text-base-content/50 italic mt-1">{record.notes}</div>{/if}
        </div>
        <div class="flex gap-1 ml-2 flex-shrink-0">
          <a href="/children/{childId}/record/{record.id}" class="btn btn-ghost btn-sm" title="Edit"><Icon name="pencil" /></a>
        </div>
      </div>
    </div>
  </div>
{/snippet}
