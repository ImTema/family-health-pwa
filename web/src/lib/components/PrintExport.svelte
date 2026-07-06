<script lang="ts">
  import { brandNameFor, diseaseNamesFor } from '../schedule'
  import { formatDate, childAge, todayISO } from '../utils'
  import type { Child, VaccinationRecord } from '../types'
  import Icon from './Icon.svelte'

  let {
    child,
    groupByDisease,
    sortedRecords,
    groupedRecords,
    illnessRecords,
  }: {
    child: Child
    groupByDisease: boolean
    sortedRecords: () => VaccinationRecord[]
    groupedRecords: () => Map<string, VaccinationRecord[]>
    illnessRecords: () => VaccinationRecord[]
  } = $props()

  let hasNotes = $derived(sortedRecords().some((r) => r.notes))

  function doPrint() {
    const today = todayISO()
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

<button class="btn btn-ghost btn-sm print:hidden" title="Export PDF" onclick={doPrint}><Icon name="printer" /></button>

<div class="hidden print:block">
  <div class="mb-4">
    <h1 class="text-2xl font-bold">{child.name}</h1>
    <p class="text-xs">{formatDate(child.birthDate)} · {childAge(child.birthDate)}</p>
  </div>
  {#if groupByDisease}
    {#each groupedRecords() as [disease, recs]}
      <h2 class="text-lg font-semibold mt-4 mb-1">{disease}</h2>
      <table class="w-full border-collapse text-xs mb-4">
        <thead>
          <tr>{#each (hasNotes ? ['Date', 'Vaccine / Brand', 'Serial / Lot', 'Notes'] : ['Date', 'Vaccine / Brand', 'Serial / Lot']) as h}<th class="border border-gray-400 p-2 text-left bg-gray-100">{h}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each recs as r}
            <tr>
              <td class="border border-gray-400 p-2">{formatDate(r.date)}</td>
              <td class="border border-gray-400 p-2">{brandNameFor(r)}</td>
              <td class="border border-gray-400 p-2">{r.kind === 'vaccine' ? r.serialNumber ?? '' : ''}</td>
              {#if hasNotes}<td class="border border-gray-400 p-2">{r.notes ?? ''}</td>{/if}
            </tr>
          {/each}
        </tbody>
      </table>
    {/each}
    {#if illnessRecords().length > 0}
      <h2 class="text-lg font-semibold mt-4 mb-1">Illnesses</h2>
      <table class="w-full border-collapse text-xs mb-4">
        <thead>
          <tr>{#each (hasNotes ? ['Date', 'Disease', 'Notes'] : ['Date', 'Disease']) as h}<th class="border border-gray-400 p-2 text-left bg-gray-100">{h}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each illnessRecords() as r}
            <tr>
              <td class="border border-gray-400 p-2">{formatDate(r.date)}</td>
              <td class="border border-gray-400 p-2">{brandNameFor(r)}</td>
              {#if hasNotes}<td class="border border-gray-400 p-2">{r.notes ?? ''}</td>{/if}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {:else}
    <table class="w-full border-collapse text-xs mb-4">
      <thead>
        <tr>{#each (hasNotes ? ['Date', 'Vaccine / Brand', 'Diseases', 'Serial / Lot', 'Notes'] : ['Date', 'Vaccine / Brand', 'Diseases', 'Serial / Lot']) as h}<th class="border border-gray-400 p-2 text-left bg-gray-100">{h}</th>{/each}</tr>
      </thead>
      <tbody>
        {#each sortedRecords().filter(r => r.kind === 'vaccine') as r}
          <tr>
            <td class="border border-gray-400 p-2">{formatDate(r.date)}</td>
            <td class="border border-gray-400 p-2">{brandNameFor(r)}</td>
            <td class="border border-gray-400 p-2">{diseaseNamesFor(r).join(', ')}</td>
            <td class="border border-gray-400 p-2">{r.kind === 'vaccine' ? r.serialNumber ?? '' : ''}</td>
            {#if hasNotes}<td class="border border-gray-400 p-2">{r.notes ?? ''}</td>{/if}
          </tr>
        {/each}
      </tbody>
    </table>
    {#if illnessRecords().length > 0}
      <h2 class="text-lg font-semibold mt-4 mb-1">Illnesses</h2>
      <table class="w-full border-collapse text-xs mb-4">
        <thead>
          <tr>{#each (hasNotes ? ['Date', 'Disease', 'Notes'] : ['Date', 'Disease']) as h}<th class="border border-gray-400 p-2 text-left bg-gray-100">{h}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each illnessRecords() as r}
            <tr>
              <td class="border border-gray-400 p-2">{formatDate(r.date)}</td>
              <td class="border border-gray-400 p-2">{brandNameFor(r)}</td>
              {#if hasNotes}<td class="border border-gray-400 p-2">{r.notes ?? ''}</td>{/if}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</div>
