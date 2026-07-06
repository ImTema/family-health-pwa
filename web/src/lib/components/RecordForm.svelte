<script lang="ts">
  import { untrack } from 'svelte'
  import { brands, brandCoverage, diseases, diseaseById } from '../seed'
  import { todayISO } from '../utils'
  import type { Snippet } from 'svelte'
  import type { VaccinationRecord } from '../types'

  type RecordFields = Omit<VaccinationRecord, 'id' | 'childId'>

  let {
    title,
    childId,
    childBirthDate,
    initial,
    onSave,
    extraActions
  }: {
    title: string
    childId: string
    childBirthDate: string
    initial?: RecordFields
    onSave: (fields: RecordFields) => void | Promise<void>
    extraActions?: Snippet
  } = $props()

  const today = todayISO()
  // ponytail: form is seeded once from `initial` on mount, never re-seeded from a later prop change
  const seed = untrack(() => initial)

  let brandInput = $state(brands.find(b => b.id === seed?.brandId)?.name ?? seed?.customBrandName ?? '')
  let selectedBrandId = $state<string | undefined>(seed?.brandId)
  let selectedDiseases = $state<Set<string>>(new Set(seed?.diseaseIds ?? []))
  let diseaseQuery = $state('')
  let date = $state(seed?.date ?? today)
  let serial = $state(seed?.serialNumber ?? '')
  let notes = $state(seed?.notes ?? '')
  let error = $state('')
  let showBrandList = $state(false)
  let showDiseaseList = $state(false)

  function selectBrand(name: string) {
    brandInput = name
    const matched = brands.find(b => b.name === name)
    selectedBrandId = matched?.id
    if (matched) selectedDiseases = new Set(brandCoverage[matched.id] ?? [])
    showBrandList = false
  }

  function addDisease(diseaseId: string) {
    selectedDiseases = new Set([...selectedDiseases, diseaseId])
    diseaseQuery = ''
    showDiseaseList = false
  }

  function removeDisease(id: string) {
    const next = new Set(selectedDiseases)
    next.delete(id)
    selectedDiseases = next
  }

  const brandSuggestions = $derived(
    (brandInput.length > 0
      ? brands.filter(b => b.name.toLowerCase().includes(brandInput.toLowerCase()))
      : brands
    ).slice(0, 8)
  )

  const diseaseSuggestions = $derived(
    diseases.filter(d =>
      !selectedDiseases.has(d.id) &&
      (diseaseQuery.length === 0 || d.name.toLowerCase().includes(diseaseQuery.toLowerCase()))
    ).slice(0, 8)
  )

  async function save() {
    error = ''
    if (!date) { error = 'Date is required.'; return }
    if (childBirthDate && date < childBirthDate) { error = 'Vaccination date cannot be before birth date.'; return }
    await onSave({
      date,
      brandId: selectedBrandId,
      customBrandName: !selectedBrandId && brandInput.trim() ? brandInput.trim() : undefined,
      diseaseIds: [...selectedDiseases],
      serialNumber: serial.trim() || undefined,
      notes: notes.trim() || undefined
    })
  }
</script>

<div class="min-h-full bg-base-100 p-4">
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-6">{title}</h1>

    <div class="flex flex-col gap-4">
      <div class="form-control">
        <label class="label" for="brand-input"><span class="label-text">Vaccine / Brand</span></label>
        <div class="relative">
          <input
            id="brand-input"
            type="text"
            class="input input-bordered w-full"
            placeholder="Search or type brand name"
            bind:value={brandInput}
            oninput={() => { selectedBrandId = undefined }}
            onfocus={() => showBrandList = true}
            onblur={() => setTimeout(() => showBrandList = false, 150)}
          />
          {#if showBrandList && brandSuggestions.length > 0}
            <div class="absolute z-20 bg-base-100 border border-base-300 rounded-lg shadow-lg w-full mt-1 max-h-48 overflow-y-auto">
              {#each brandSuggestions as b}
                <button class="w-full text-left px-3 py-2 hover:bg-base-200 text-sm" onpointerdown={() => selectBrand(b.name)}>{b.name}</button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      {#if selectedDiseases.size > 0}
        <div class="flex flex-wrap gap-1">
          {#each [...selectedDiseases] as id}
            <span class="badge badge-primary gap-1">
              {diseaseById[id]?.name ?? id}
              <button class="ml-1 font-bold" onclick={() => removeDisease(id)}>×</button>
            </span>
          {/each}
        </div>
      {/if}

      <div class="form-control">
        <label class="label" for="disease-query"><span class="label-text">Add disease</span></label>
        <div class="relative">
          <input
            id="disease-query"
            type="text"
            class="input input-bordered w-full"
            placeholder="Search disease…"
            bind:value={diseaseQuery}
            onfocus={() => showDiseaseList = true}
            onblur={() => setTimeout(() => showDiseaseList = false, 150)}
          />
          {#if showDiseaseList && diseaseSuggestions.length > 0}
            <div class="absolute z-20 bg-base-100 border border-base-300 rounded-lg shadow-lg w-full mt-1 max-h-48 overflow-y-auto">
              {#each diseaseSuggestions as d}
                <button class="w-full text-left px-3 py-2 hover:bg-base-200 text-sm" onpointerdown={() => addDisease(d.id)}>{d.name}</button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="form-control">
        <label class="label" for="record-date"><span class="label-text">Date</span></label>
        <input id="record-date" type="date" class="input input-bordered w-full" max={today} bind:value={date} />
      </div>

      <div class="form-control">
        <label class="label" for="record-serial"><span class="label-text">Serial / Lot number (optional)</span></label>
        <input id="record-serial" type="text" class="input input-bordered w-full" placeholder="e.g. A12345B" bind:value={serial} />
      </div>

      <div class="form-control">
        <label class="label" for="record-notes"><span class="label-text">Notes (optional)</span></label>
        <input id="record-notes" type="text" class="input input-bordered w-full" placeholder="Doctor name, clinic, etc." bind:value={notes} />
      </div>
    </div>

    {#if error}
      <div class="alert alert-error mt-4 text-sm">{error}</div>
    {/if}

    <div class="flex gap-3 mt-8">
      <a href="/children/{childId}" class="btn btn-ghost">Cancel</a>
      <button class="btn btn-primary" onclick={save}>Save</button>
      {@render extraActions?.()}
    </div>
  </div>
</div>
