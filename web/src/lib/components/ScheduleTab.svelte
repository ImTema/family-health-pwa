<script lang="ts">
  import { assignFootnotes, childAgeWeeks, weeksToLabel, scheduleMilestones, scheduleDiseases, recurringFor } from '../schedule'
  import { formatDate } from '../utils'
  import { COUNTRY_LABELS } from '../types'
  import { db } from '../db'
  import Icon from './Icon.svelte'
  import type { Child, ScheduleResult, VaccinationRecord } from '../types'

  let { child, schedule, records }: { child: Child; schedule: ScheduleResult[]; records: VaccinationRecord[] } = $props()

  const milestones = $derived(scheduleMilestones(schedule))
  const diseases = $derived(scheduleDiseases(schedule))
  const todayCol = $derived(milestones.findLastIndex(w => w <= childAgeWeeks(child.birthDate)))
  const recurring = $derived(recurringFor(child.country, records))
  const footnotes = $derived(assignFootnotes([...schedule.map(r => r.entry), ...recurring.map(r => r.entry)]))
  const footnoteLegend = $derived([...footnotes.entries()])

  function onCountryChange() {
    db.saveChild($state.snapshot(child))
  }

  let scrollEl = $state<HTMLDivElement>()
  let canScrollMore = $state(false)

  function updateCanScrollMore() {
    if (!scrollEl) return
    canScrollMore = scrollEl.scrollWidth - scrollEl.scrollLeft - scrollEl.clientWidth > 1
  }

  $effect(() => {
    milestones.length
    diseases.length
    if (!scrollEl) return
    const el = scrollEl
    const observer = new ResizeObserver(updateCanScrollMore)
    observer.observe(el)
    // ponytail: table-layout:auto needs a paint before scrollWidth reflects final column widths
    requestAnimationFrame(updateCanScrollMore)
    window.addEventListener('resize', updateCanScrollMore)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateCanScrollMore)
    }
  })
</script>

<div class="flex items-center gap-3 mb-3">
  <select class="select select-ghost select-sm w-auto text-sm font-normal focus:outline-none" bind:value={child.country} onchange={onCountryChange}>
    {#each Object.entries(COUNTRY_LABELS) as [value, label]}
      <option {value}>{label}</option>
    {/each}
  </select>
</div>

<div class="flex gap-4 text-xs mb-3 text-base-content/60">
  <span class="inline-flex items-center gap-1">✓ Done &nbsp; ! Overdue &nbsp; · Upcoming &nbsp; <Icon name="virus" size={12} strokeWidth={1.5} /> = covered by illness (not vaccine)</span>
  <span class="ml-auto">Age: {childAgeWeeks(child.birthDate)}w</span>
</div>
<div class="flex items-center gap-1 text-xs text-base-content/40 mb-2">
  <span class="inline-block w-1 h-1 rounded-full ring-1 ring-blue-500"></span> = optional vaccine
</div>
<div class="relative">
  <div class="overflow-x-scroll" bind:this={scrollEl} onscroll={updateCanScrollMore}>
  <table class="table table-xs table-pin-rows">
    <thead>
      <tr>
        <th class="sticky left-0 z-20 bg-base-100 text-xs whitespace-nowrap max-w-24 overflow-hidden text-ellipsis">Disease</th>
        {#each milestones as w, i}
          <th class="text-center text-xs {i === todayCol ? 'bg-primary/15 text-primary' : ''}">
            {weeksToLabel(w)}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each diseases as disease}
        {@const diseaseNotes = [...new Set(schedule.filter(r => r.entry.diseaseId === disease.id && r.entry.note).map(r => r.entry.note))]}
        <tr>
          <td class="sticky left-0 z-10 bg-base-100 text-xs font-medium">
            <div class="group relative" tabindex="0">
              <span class="block max-w-24 overflow-hidden text-ellipsis whitespace-nowrap">
                {disease.name}{#each diseaseNotes as note}<sup class="text-[9px] text-base-content/50">{footnotes.get(note)}</sup>{/each}
              </span>
              <div class="hidden group-hover:block group-focus:block absolute z-40 bottom-full left-0 mb-1 whitespace-nowrap rounded bg-neutral text-neutral-content text-xs px-2 py-1">
                {disease.name}
              </div>
            </div>
          </td>
          {#each milestones as w, i}
            {@const result = schedule.find(r => r.entry.diseaseId === disease.id && r.entry.ageWeeks === w)}
            <td class="text-center {i === todayCol ? 'bg-primary/10' : ''}">
              {#if result}
                {#if result.status === 'DONE' && result.coveredByRecord?.kind === 'illness'}
                  <span class="text-success inline-block align-middle"><Icon name="virus" size={14} strokeWidth={1.5} /></span>
                {:else}
                  {@const [icon, cls] =
                    result.status === 'DONE'        ? ['✓', 'text-success font-bold'] :
                    result.status === 'HIGHLIGHTED' ? ['!', 'text-warning font-bold'] :
                                                      ['●', 'text-base-content/20 text-[5px]']}
                  <span class={cls}>{icon}</span>
                {/if}
                {#if result.entry.necessity === 'OPTIONAL' && result.coveredByRecord?.kind !== 'illness'}
                  <span class="inline-block w-1 h-1 rounded-full ring-1 ring-blue-500 align-super ml-0.5"></span>
                {/if}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  </div>
  {#if canScrollMore}
    <div class="pointer-events-none absolute top-0 right-0 bottom-0 w-8 z-30 bg-gradient-to-l from-base-100 to-transparent"></div>
  {/if}
</div>

{#if recurring.length}
  <div class="text-xs text-base-content/40 mt-4 mb-1">Recurring — no fixed age, tracked by count</div>
  <ul class="text-sm divide-y divide-base-200">
    {#each recurring as r}
      <li class="flex justify-between items-center py-1.5">
        <span>
          {r.disease.name}
          {#if r.entry.necessity === 'OPTIONAL'}<span class="inline-block w-1 h-1 rounded-full ring-1 ring-blue-500 align-super ml-0.5"></span>{/if}
          {#if r.entry.note}<sup class="text-[9px] text-base-content/50">{footnotes.get(r.entry.note)}</sup>{/if}
        </span>
        <span class="text-base-content/60 text-xs">
          {r.count > 0 ? `${r.count}× · last ${formatDate(r.lastDate!)}` : 'none yet'}
        </span>
      </li>
    {/each}
  </ul>
{/if}

{#if footnoteLegend.length}
  <ul class="text-xs text-base-content/50 mt-2 space-y-0.5">
    {#each footnoteLegend as [note, num]}
      <li><sup>{num}</sup> {note}</li>
    {/each}
  </ul>
{/if}
