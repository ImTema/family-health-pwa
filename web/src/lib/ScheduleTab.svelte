<script lang="ts">
  import { childAgeWeeks, weeksToLabel, scheduleMilestones, scheduleDiseases } from './schedule'
  import type { Child, ScheduleResult } from './types'

  let { child, schedule }: { child: Child; schedule: ScheduleResult[] } = $props()

  const milestones = $derived(scheduleMilestones(schedule))
  const diseases = $derived(scheduleDiseases(schedule))
  const todayCol = $derived(milestones.findLastIndex(w => w <= childAgeWeeks(child.birthDate)))
</script>

<div class="flex gap-4 text-xs mb-3 text-base-content/60">
  <span>✓ Done &nbsp; ! Overdue &nbsp; · Upcoming</span>
  <span class="ml-auto">Age: {childAgeWeeks(child.birthDate)}w</span>
</div>
<div class="text-xs text-base-content/40 mb-2">Dim = optional vaccine</div>
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
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
