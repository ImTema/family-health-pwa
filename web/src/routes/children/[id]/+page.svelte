<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { brands, diseaseById } from '$lib/seed'
  import { computeSchedule, childAgeWeeks, weeksToLabel, diseasesFor } from '$lib/schedule'
  import { formatDate, childAge, swipeTabs } from '$lib/utils'
  import { fade } from 'svelte/transition'
  import { COUNTRY_LABELS, type Child, type VaccinationRecord } from '$lib/types'
  import Icon from '$lib/Icon.svelte'

  const id = page.params.id

  let child = $state<Child | null>(null)
  let records = $state<VaccinationRecord[]>([])
  let tab = $state<'records' | 'schedule' | 'timeline'>('records')
  let timelineView = $state<'table' | 'chart'>('table')
  let chartZoom = $state(1)

  function pinchZoom(node: HTMLElement) {
    let dist = 0, zoom = 1
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      zoom = chartZoom
    }
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      e.preventDefault()
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      chartZoom = Math.min(10, Math.max(1, zoom * d / dist))
    }
    node.addEventListener('touchstart', onStart, { passive: true })
    node.addEventListener('touchmove', onMove, { passive: false })
    return { destroy() { node.removeEventListener('touchstart', onStart); node.removeEventListener('touchmove', onMove) } }
  }
  let sortBy = $state<'date' | 'brand'>('date')
  let groupByDisease = $state(false)

  onMount(async () => {
    const children = await db.getChildren()
    child = children.find(c => c.id === id) ?? null
    if (!child) { goto('/'); return }
    records = await db.getRecords(id)
  })

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
    document.title = `${child!.name}-vaccinations-${formatDate(today)}`
    // ponytail: force light theme for print so dark-mode gray text doesn't wash out on paper
    document.documentElement.setAttribute('data-theme', 'light')
    window.onafterprint = () => {
      document.title = prev
      document.documentElement.removeAttribute('data-theme')
      window.onafterprint = null
    }
    window.print()
  }

  const schedule = $derived(child ? computeSchedule(child, records) : [])
  const milestones = $derived([...new Set(schedule.map(r => r.entry.ageWeeks))].sort((a, b) => a - b))
  const diseases = $derived([...new Map(schedule.map(r => [r.disease.id, r.disease])).values()])
  const todayCol = $derived(child ? milestones.findLastIndex(w => w <= childAgeWeeks(child!.birthDate)) : -1)

  const timelineData = $derived(
    schedule.map(r => {
      const actualWeeks = r.coveredByRecord
        ? Math.floor((new Date(r.coveredByRecord.date).getTime() - new Date(child!.birthDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : null
      return { ...r, actualWeeks }
    })
  )
  const timelineMax = $derived(Math.max(...milestones, child ? childAgeWeeks(child.birthDate) : 0) + 4)
</script>

{#if child}
<div class="min-h-full bg-base-100" use:swipeTabs={{ values: ['records', 'schedule', 'timeline'], get: () => tab, set: v => tab = v }}>
  <div class="sticky top-0 z-20 bg-base-200 shadow-sm print:hidden">
    <div class="max-w-2xl mx-auto p-4 pb-0">
      <a href="/" class="btn btn-ghost btn-xs mb-2">← All children</a>
      <div class="flex justify-between items-start gap-3">
        <div class="flex items-center gap-3">
          {#if child.photo}
            <img src={child.photo} alt={child.name} class="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          {/if}
          <div>
            <h1 class="text-xl font-bold">{child.name}</h1>
            <p class="text-sm text-base-content/60">
              {formatDate(child.birthDate)} · {childAge(child.birthDate)} · {COUNTRY_LABELS[child.country]}
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
    <div class="print:hidden">
      {#key tab}
      <div in:fade={{ duration: 150, delay: 100 }} out:fade={{ duration: 100 }}>
      {#if tab === 'records'}
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
                        <a href="/children/{id}/record/{record.id}" class="btn btn-ghost btn-xs" title="Edit"><Icon name="pencil" /></a>
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

      {:else if tab === 'schedule'}
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

      {:else}
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
            <div class="ml-auto flex gap-1 items-center">
              <button class="btn btn-xs btn-ghost" onclick={() => chartZoom = Math.max(1, chartZoom - 1)}>−</button>
              <span class="text-[10px] w-6 text-center">{chartZoom}×</span>
              <button class="btn btn-xs btn-ghost" onclick={() => chartZoom = Math.min(10, chartZoom + 1)}>+</button>
            </div>
          </div>
          <div class="overflow-x-auto" style="touch-action: pan-x" use:pinchZoom>
            <div class="flex flex-col gap-1 min-w-max">
              {#each diseases as disease}
                {@const rows = timelineData.filter(r => r.disease.id === disease.id)}
                <div class="flex items-center gap-2">
                  <div class="text-xs w-28 flex-shrink-0 truncate text-base-content/70">{disease.name}</div>
                  <div class="relative h-5" style="width: {chartZoom * 200}px">
                    <div class="absolute top-1/2 left-0 right-0 h-px bg-base-300"></div>
                    {#each rows as r}
                      {@const recPct = (r.entry.ageWeeks / timelineMax) * 100}
                      <div class="absolute top-0 w-px h-full bg-base-content/20" style="left: {recPct}%"></div>
                      {#if r.actualWeeks !== null}
                        {@const actPct = (r.actualWeeks / timelineMax) * 100}
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
                <div class="relative h-4" style="width: {chartZoom * 200}px">
                  {#each milestones.filter((_, i) => i % 2 === 0) as w}
                    <span class="absolute text-[10px] text-base-content/40 -translate-x-1/2" style="left: {(w / timelineMax) * 100}%">{weeksToLabel(w)}</span>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}
      {/if}
      </div>
      {/key}
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
  </div>
</div>
{/if}

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
          <a href="/children/{id}/record/{record.id}" class="btn btn-ghost btn-sm" title="Edit"><Icon name="pencil" /></a>
        </div>
      </div>
    </div>
  </div>
{/snippet}
