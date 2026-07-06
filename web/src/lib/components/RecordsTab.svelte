<script lang="ts">
  import { brandNameFor, diseaseNamesFor, groupRecordsByDisease } from '../schedule'
  import { formatDate } from '../utils'
  import type { Child, VaccinationRecord } from '../types'
  import Icon from './Icon.svelte'
  import PrintExport from './PrintExport.svelte'

  let { childId, child, records }: { childId: string; child: Child; records: VaccinationRecord[] } = $props()

  let sortBy = $state<'date' | 'brand'>('date')
  let groupByDisease = $state(false)

  function sortedRecords(): VaccinationRecord[] {
    return [...records].sort((a, b) =>
      sortBy === 'date'
        ? b.date.localeCompare(a.date)
        : (brandNameFor(a) || '').localeCompare(brandNameFor(b) || '') || b.date.localeCompare(a.date)
    )
  }

  function groupedRecords(): Map<string, VaccinationRecord[]> {
    return groupRecordsByDisease(sortedRecords())
  }


</script>

<div class="flex items-center gap-3 mb-3">
  <select class="select select-ghost select-sm w-auto text-sm font-normal focus:outline-none print:hidden" bind:value={sortBy}>
    <option value="date">Sort by date</option>
    <option value="brand">Sort by brand</option>
  </select>
  <div class="ml-auto flex gap-2">
    <button
      class="btn btn-ghost btn-sm print:hidden {groupByDisease ? 'btn-active' : ''}"
      title="Group by disease"
      onclick={() => groupByDisease = !groupByDisease}
    ><Icon name="virus" size={20} strokeWidth={1.5} /></button>
    <PrintExport {child} {groupByDisease} {sortedRecords} {groupedRecords} />
  </div>
</div>

<div class="print:hidden">
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
            {#each recs.filter(r => r.kind === 'vaccine') as record}
              {@render recordRow(record)}
            {/each}
            {#each recs.filter(r => r.kind === 'illness') as record}
              {@render recordRow(record)}
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

{#snippet recordRow(record: VaccinationRecord)}
  <tr class={record.kind === 'illness' ? 'bg-error/10' : ''}>
    <td class="whitespace-nowrap">{formatDate(record.date)}</td>
    <td>{brandNameFor(record)}</td>
    <td>{record.kind === 'vaccine' ? record.serialNumber ?? '' : ''}</td>
    <td>{record.notes ?? ''}</td>
    <td>
      <a href="/children/{childId}/record/{record.id}" class="btn btn-ghost btn-xs" title="Edit"><Icon name="pencil" /></a>
    </td>
  </tr>
{/snippet}

{#snippet recordCard(record: VaccinationRecord)}
  <div class="card mb-3 {record.kind === 'illness' ? 'bg-error/10' : 'bg-base-200'}">
    <div class="card-body p-4">
      <div class="flex justify-between items-start">
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
            <span>{formatDate(record.date)}</span>
            {#if brandNameFor(record)}<span class="font-semibold">{brandNameFor(record)}</span>{/if}
            {#if record.kind === 'vaccine' && record.serialNumber}<span class="text-base-content/50 text-[10px]">{record.serialNumber}</span>{/if}
          </div>
          {#if diseaseNamesFor(record).length > 0}
            <div class="flex flex-wrap gap-1 mt-1.5">
              {#each diseaseNamesFor(record) as name}
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
