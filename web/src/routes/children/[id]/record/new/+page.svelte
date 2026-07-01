<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { uuid } from '$lib/utils'
  import { brands, brandCoverage, diseases, diseaseById } from '$lib/seed'

  const childId = page.params.id
  const today = new Date().toISOString().split('T')[0]

  let brandInput = $state('')
  let selectedBrandId = $state<string | undefined>(undefined)
  let selectedDiseases = $state<Set<string>>(new Set())
  let diseaseQuery = $state('')
  let date = $state(today)
  let serial = $state('')
  let notes = $state('')
  let error = $state('')
  let childBirthDate = $state('')
  let showBrandList = $state(false)
  let showDiseaseList = $state(false)

  onMount(async () => {
    const children = await db.getChildren()
    childBirthDate = children.find(c => c.id === childId)?.birthDate ?? ''
  })

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
    brandInput.length > 0
      ? brands.filter(b => b.name.toLowerCase().includes(brandInput.toLowerCase())).slice(0, 8)
      : brands.slice(0, 8)
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
    await db.saveRecord({
      id: uuid(),
      childId,
      date,
      brandId: selectedBrandId,
      customBrandName: !selectedBrandId && brandInput.trim() ? brandInput.trim() : undefined,
      diseaseIds: [...selectedDiseases],
      serialNumber: serial.trim() || undefined,
      notes: notes.trim() || undefined
    })
    goto(`/children/${childId}`)
  }
</script>

<div class="min-h-screen bg-base-100 p-4">
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-6">Add record</h1>

    <div class="flex flex-col gap-4">
      <div class="form-control">
        <label class="label"><span class="label-text">Vaccine / Brand</span></label>
        <div class="relative">
          <input
            type="text"
            class="input input-bordered w-full"
            placeholder="Search or type brand name"
            bind:value={brandInput}
            oninput={() => { selectedBrandId = undefined }}
            onfocus={() => showBrandList = true}
          />
          {#if showBrandList && brandSuggestions.length > 0}
            <div class="fixed inset-0 z-10" onclick={() => showBrandList = false}></div>
            <div class="absolute z-20 bg-base-100 border border-base-300 rounded-lg shadow-lg w-full mt-1 max-h-48 overflow-y-auto">
              {#each brandSuggestions as b}
                <button class="w-full text-left px-3 py-2 hover:bg-base-200 text-sm" onclick={() => selectBrand(b.name)}>{b.name}</button>
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
        <label class="label"><span class="label-text">Add disease</span></label>
        <div class="relative">
          <input
            type="text"
            class="input input-bordered w-full"
            placeholder="Search disease…"
            bind:value={diseaseQuery}
            onfocus={() => showDiseaseList = true}
          />
          {#if showDiseaseList && diseaseSuggestions.length > 0}
            <div class="fixed inset-0 z-10" onclick={() => showDiseaseList = false}></div>
            <div class="absolute z-20 bg-base-100 border border-base-300 rounded-lg shadow-lg w-full mt-1 max-h-48 overflow-y-auto">
              {#each diseaseSuggestions as d}
                <button class="w-full text-left px-3 py-2 hover:bg-base-200 text-sm" onclick={() => addDisease(d.id)}>{d.name}</button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Date</span></label>
        <input type="date" class="input input-bordered w-full" max={today} bind:value={date} />
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Serial / Lot number (optional)</span></label>
        <input type="text" class="input input-bordered w-full" placeholder="e.g. A12345B" bind:value={serial} />
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Notes (optional)</span></label>
        <input type="text" class="input input-bordered w-full" placeholder="Doctor name, clinic, etc." bind:value={notes} />
      </div>
    </div>

    {#if error}
      <div class="alert alert-error mt-4 text-sm">{error}</div>
    {/if}

    <div class="flex gap-3 mt-8">
      <a href="/children/{childId}" class="btn btn-ghost">Cancel</a>
      <button class="btn btn-primary" onclick={save}>Save</button>
    </div>
  </div>
</div>
