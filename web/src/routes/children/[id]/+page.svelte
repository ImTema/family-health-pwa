<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { computeSchedule } from '$lib/schedule'
  import { formatDate, childAge } from '$lib/utils'
  import { fade } from 'svelte/transition'
  import { type Child, type VaccinationRecord } from '$lib/types'
  import RecordsTab from '$lib/components/RecordsTab.svelte'
  import ScheduleTab from '$lib/components/ScheduleTab.svelte'
  import TimelineTab from '$lib/components/TimelineTab.svelte'

  const id = page.params.id as string

  let child = $state<Child | null>(null)
  let records = $state<VaccinationRecord[]>([])
  let tab = $state<'records' | 'schedule' | 'timeline'>('records')

  onMount(async () => {
    child = (await db.getChild(id)) ?? null
    if (!child) { goto('/'); return }
    records = await db.getRecords(id)
  })

  const schedule = $derived(child ? computeSchedule(child, records) : [])
</script>

{#if child}
<div class="min-h-full bg-base-100">
  <div class="sticky top-0 z-20 bg-base-200 shadow-sm print:hidden">
    <div class="max-w-2xl mx-auto p-4 pb-0">
      <a href="/" class="btn btn-ghost btn-xs mb-2">← All family members</a>
      <div class="flex justify-between items-start gap-3">
        <div class="flex items-center gap-3">
          {#if child.photo}
            <img src={child.photo} alt={child.name} class="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          {/if}
          <div>
            <h1 class="text-xl font-bold">{child.name}</h1>
            <p class="text-sm text-base-content/60">
              {formatDate(child.birthDate)} · {childAge(child.birthDate)}
              {#if child.sex} · {child.sex === 'MALE' ? 'Male' : 'Female'}{/if}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <a href="/children/{id}/record/new" class="btn btn-primary btn-md">+ Record</a>
        </div>
      </div>

      <div role="tablist" class="tabs tabs-bordered mt-3">
        <button role="tab" class="tab {tab === 'records' ? 'tab-active' : ''}" onclick={() => tab = 'records'}>
          Records ({records.length})
        </button>
        <button role="tab" class="tab {tab === 'schedule' ? 'tab-active' : ''}" onclick={() => tab = 'schedule'}>
          Schedule
        </button>
        <button role="tab" class="tab {tab === 'timeline' ? 'tab-active' : ''}" onclick={() => tab = 'timeline'}>
          Timeline
        </button>
      </div>
    </div>
  </div>

  <div class="max-w-2xl mx-auto p-4">
    {#key tab}
    <div in:fade={{ duration: 150, delay: 100 }} out:fade={{ duration: 100 }}>
      {#if tab === 'records'}
        <RecordsTab childId={id} {child} {records} />
      {:else if tab === 'schedule'}
        <div class="print:hidden">
          <ScheduleTab {child} {schedule} {records} />
        </div>
      {:else}
        <div class="print:hidden">
          <TimelineTab {child} {schedule} />
        </div>
      {/if}
    </div>
    {/key}
  </div>
</div>
{/if}
