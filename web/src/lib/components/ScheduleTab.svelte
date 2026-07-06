<script lang="ts">
  import { childAgeWeeks, weeksToLabel, scheduleMilestones, scheduleDiseases, recurringFor } from '../schedule'
  import { formatDate } from '../utils'
  import type { Child, ScheduleResult, VaccinationRecord } from '../types'

  let { child, schedule, records }: { child: Child; schedule: ScheduleResult[]; records: VaccinationRecord[] } = $props()

  const milestones = $derived(scheduleMilestones(schedule))
  const diseases = $derived(scheduleDiseases(schedule))
  const todayCol = $derived(milestones.findLastIndex(w => w <= childAgeWeeks(child.birthDate)))
  const recurring = $derived(recurringFor(child.country, records))
</script>

<div class="flex gap-4 text-xs mb-3 text-base-content/60">
  <span>✓ Done &nbsp; ! Overdue &nbsp; · Upcoming</span>
  <span class="ml-auto">Age: {childAgeWeeks(child.birthDate)}w</span>
</div>
<div class="text-xs text-base-content/40 mb-2">○ = optional vaccine</div>
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
            <td class="text-center {i === todayCol ? 'bg-primary/10' : ''} {result?.entry.necessity === 'OPTIONAL' ? 'opacity-40' : ''}">
              {#if result}
                {@const [icon, cls] =
                  result.status === 'DONE'        ? ['✓', 'text-success font-bold'] :
                  result.status === 'HIGHLIGHTED' ? ['!', 'text-warning font-bold'] :
                                                    ['·', 'text-base-content/20']}
                <span class={cls}>{icon}</span>
                {#if result.entry.necessity === 'OPTIONAL'}
                  <sup class="text-info">○</sup>
                {/if}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if recurring.length}
  <div class="text-xs text-base-content/40 mt-4 mb-1">Recurring — no fixed age, tracked by count</div>
  <ul class="text-sm divide-y divide-base-200">
    {#each recurring as r}
      <li class="flex justify-between items-center py-1.5">
        <span>
          {r.disease.name}
          {#if r.entry.necessity === 'OPTIONAL'}<sup class="text-info">○</sup>{/if}
        </span>
        <span class="text-base-content/60 text-xs">
          {r.count > 0 ? `${r.count}× · last ${formatDate(r.lastDate!)}` : 'none yet'}
        </span>
      </li>
    {/each}
  </ul>
{/if}
