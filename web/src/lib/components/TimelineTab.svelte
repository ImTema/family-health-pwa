<script lang="ts">
  import { weeksToLabel, scheduleMilestones, scheduleDiseases } from '../schedule'
  import { formatDate } from '../utils'
  import type { Child, ScheduleResult } from '../types'

  let { child, schedule }: { child: Child; schedule: ScheduleResult[] } = $props()

  let timelineView = $state<'table' | 'chart'>('table')
  const chartWidth = 600

  const milestones = $derived(scheduleMilestones(schedule))
  const diseases = $derived(scheduleDiseases(schedule))

  const timelineData = $derived(
    schedule.map(r => {
      const actualWeeks = r.coveredByRecord
        ? Math.floor((new Date(r.coveredByRecord.date).getTime() - new Date(child.birthDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : null
      return { ...r, actualWeeks }
    })
  )
  const actualWeeksValues = $derived(
    timelineData.map(r => r.actualWeeks).filter((w): w is number => w !== null)
  )
  const timelineMax = $derived(Math.max(...milestones, ...actualWeeksValues) + 4)
  // ponytail: sqrt compresses long gaps (e.g. birth dose given years late) so the chart
  // isn't mostly empty space; swap for log(w+1) if sqrt still isn't compressed enough
  function weekPct(weeks: number) {
    return (Math.sqrt(weeks) / Math.sqrt(timelineMax)) * 100
  }
</script>

<div class="flex gap-2 mb-3">
  <button class="btn btn-xs {timelineView === 'table' ? 'btn-primary' : 'btn-ghost'}" onclick={() => timelineView = 'table'}>Table</button>
  <button class="btn btn-xs {timelineView === 'chart' ? 'btn-primary' : 'btn-ghost'}" onclick={() => timelineView = 'chart'}>Chart</button>
</div>

{#if timelineView === 'table'}
  <div class="overflow-x-auto">
    <table class="table table-xs w-full">
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
            <td class="text-xs whitespace-nowrap">{r.disease.name}</td>
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

{:else}
  <div class="text-xs text-base-content/50 mb-2 flex gap-4 items-center">
    <span><span class="inline-block w-3 h-0.5 bg-base-content/30 align-middle"></span> Recommended</span>
    <span><span class="inline-block w-2.5 h-2.5 rounded-full bg-success align-middle"></span> Given</span>
  </div>
  <div class="overflow-x-auto">
    <div class="flex flex-col gap-1 min-w-max">
      {#each diseases as disease}
        {@const rows = timelineData.filter(r => r.disease.id === disease.id)}
        {@const rowMaxPct = Math.max(...rows.map(r => weekPct(Math.max(r.entry.ageWeeks, r.actualWeeks ?? 0))))}
        <div class="flex items-center gap-2">
          <div class="text-xs w-28 flex-shrink-0 truncate text-base-content/70 sticky left-0 bg-base-100">{disease.name}</div>
          <div class="relative h-5" style="width: {chartWidth}px">
            <div class="absolute top-1/2 left-0 h-px bg-base-300" style="width: {rowMaxPct}%"></div>
            {#each rows as r}
              {@const recPct = weekPct(r.entry.ageWeeks)}
              <div class="absolute top-0 w-px h-full bg-base-content/20" style="left: {recPct}%"></div>
              {#if r.actualWeeks !== null}
                {@const actPct = weekPct(r.actualWeeks)}
                <div
                  class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-success border-2 border-base-100"
                  style="left: {actPct}%"
                  title="{r.disease.name} dose {r.entry.doseNumber}: given at {r.actualWeeks}w (rec: {r.entry.ageWeeks}w)"
                ></div>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
      <div class="flex items-center gap-2">
        <div class="w-28 flex-shrink-0"></div>
        <div class="relative h-4" style="width: {chartWidth}px">
          {#each milestones.filter((_, i) => i % 2 === 0) as w}
            <span class="absolute text-[10px] text-base-content/40 -translate-x-1/2" style="left: {weekPct(w)}%">{weeksToLabel(w)}</span>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
