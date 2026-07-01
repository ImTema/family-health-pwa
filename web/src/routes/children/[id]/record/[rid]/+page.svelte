<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { brands, brandCoverage, diseases, diseaseById } from '$lib/seed'

  const childId = page.params.id
  const rid = page.params.rid
  const today = new Date().toISOString().split('T')[0]

  let brandInput = $state('')
  let selectedBrandId = $state<string | undefined>(undefined)
  let selectedDiseases = $state<Set<string>>(new Set())
  let diseaseInput = $state('')
  let date = $state('')
  let serial = $state('')
  let notes = $state('')
  let error = $state('')
  let childBirthDate = $state('')

  onMount(async () => {
    const children = await db.getChildren()
    childBirthDate = children.find(c => c.id === childId)?.birthDate ?? ''

    const record = (await db.getRecords(childId)).find(r => r.id === rid)
    if (!record) { goto(`/children/${childId}`); return }

    date = record.date
    serial = record.serialNumber ?? ''
    notes = record.notes ?? ''
    selectedBrandId = record.brandId
    selectedDiseases = new Set(
      record.diseaseIds.length ? record.diseaseIds : (record.brandId ? brandCoverage[record.brandId] ?? [] : [])
    )
    brandInput = brands.find(b => b.id === record.brandId)?.name ?? record.customBrandName ?? ''
  })

  function onBrandChange(value: string) {
    brandInput = value
    const matched = brands.find(b => b.name === value)
    selectedBrandId = matched?.id
    if (matched) selectedDiseases = new Set(brandCoverage[matched.id] ?? [])
  }

  function addDiseaseByName(name: string) {
    const d = diseases.find(d => d.name === name)
    if (d) selectedDiseases = new Set([...selectedDiseases, d.id])
    diseaseInput = ''
  }

  function removeDisease(id: string) {
    const next = new Set(selectedDiseases)
    next.delete(id)
    selectedDiseases = next
  }

  const availableDiseases = $derived(diseases.filter(d => !selectedDiseases.has(d.id)))

  async function save() {
    error = ''
    if (!date) { error = 'Date is required.'; return }
    if (childBirthDate && date < childBirthDate) { error = 'Vaccination date cannot be before birth date.'; return }
    await db.saveRecord({
      id: rid,
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
    <h1 class="text-2xl font-bold mb-6">Edit record</h1>

    <datalist id="brands-list">
      {#each brands as brand}<option value={brand.name}></option>{/each}
    </datalist>
    <datalist id="diseases-list">
      {#each availableDiseases as d}<option value={d.name}></option>{/each}
    </datalist>

    <div class="flex flex-col gap-4">
      <div class="form-control">
        <label class="label"><span class="label-text">Vaccine / Brand</span></label>
        <input
          type="text"
          list="brands-list"
          class="input input-bordered w-full"
          placeholder="Search or type brand name"
          value={brandInput}
          oninput={e => onBrandChange((e.target as HTMLInputElement).value)}
        />
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
        <input
          type="text"
          list="diseases-list"
          class="input input-bordered w-full"
          placeholder="Search disease…"
          value={diseaseInput}
          oninput={e => {
            const val = (e.target as HTMLInputElement).value
            diseaseInput = val
            if (diseases.find(d => d.name === val)) addDiseaseByName(val)
          }}
          onkeydown={e => { if (e.key === 'Enter') { e.preventDefault(); addDiseaseByName(diseaseInput) } }}
        />
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
