<script lang="ts">
  import { weeksToLabel } from '../schedule'
  import { formatDate } from '../utils'
  import { COUNTRY_LABELS } from '../types'
  import { db } from '../db'
  import type { Child, ScheduleResult } from '../types'

  let { child, schedule }: { child: Child; schedule: ScheduleResult[] } = $props()

  const timelineData = $derived(
    schedule.map(r => {
      const actualWeeks = r.coveredByRecord
        ? Math.floor((new Date(r.coveredByRecord.date).getTime() - new Date(child.birthDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : null
      return { ...r, actualWeeks }
    })
  )

  function onCountryChange() {
    db.saveChild($state.snapshot(child))
  }
</script>

<div class="flex items-center gap-3 mb-3">
  <select class="select select-ghost select-sm w-auto text-sm font-normal focus:outline-none" bind:value={child.country} onchange={onCountryChange}>
    {#each Object.entries(COUNTRY_LABELS) as [value, label]}
      <option {value}>{label}</option>
    {/each}
  </select>
</div>

<div class="overflow-auto max-h-[70dvh]">
  <table class="table table-xs table-pin-rows w-full">
    <thead>
      <tr>
        <th>Disease</th>
        <th>Dose</th>
        <th>Recommended</th>
        <th>Given at</th>
        <th>Δ weeks</th>
      </tr>
    </thead>
    <tbody>
      {#each timelineData as r}
        <tr class="{r.entry.necessity === 'OPTIONAL' ? 'opacity-50' : ''}">
          <td class="text-xs">
            <div class="group relative" tabindex="0">
              <span class="block max-sm:max-w-24 max-sm:overflow-hidden max-sm:text-ellipsis whitespace-nowrap">{r.disease.name}</span>
              <div class="hidden max-sm:group-hover:block max-sm:group-focus:block absolute z-40 top-full left-0 mt-1 whitespace-nowrap rounded bg-neutral text-neutral-content text-xs px-2 py-1">
                {r.disease.name}
              </div>
            </div>
          </td>
          <td class="text-xs text-center">{r.entry.doseNumber}</td>
          <td class="text-xs text-center">{weeksToLabel(r.entry.ageWeeks)}</td>
          <td class="text-xs text-center">
            {#if r.actualWeeks !== null}
              {weeksToLabel(r.actualWeeks)}
              <div class="text-base-content/40">{formatDate(r.coveredByRecord!.date)}</div>
            {:else}
              <span class="text-base-content/30">—</span>
            {/if}
          </td>
          <td class="text-xs text-center">
            {#if r.actualWeeks !== null}
              {@const delta = r.actualWeeks - r.entry.ageWeeks}
              <span class="{delta > 4 ? 'text-warning' : delta < 0 ? 'text-info' : 'text-success'}">
                {delta > 0 ? `+${delta}` : delta}
              </span>
            {:else}
              <span class="text-base-content/30">—</span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
