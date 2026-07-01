<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { brands, brandCoverage, diseases } from '$lib/seed'

  const childId = page.params.id
  const today = new Date().toISOString().split('T')[0]

  let brandInput = $state('')
  let selectedBrandId = $state<string | undefined>(undefined)
  let selectedDiseases = $state<Set<string>>(new Set())
  let date = $state(today)
  let serial = $state('')
  let notes = $state('')

  function onBrandChange(value: string) {
    brandInput = value
    const matched = brands.find(b => b.name === value)
    selectedBrandId = matched?.id
    if (matched) selectedDiseases = new Set(brandCoverage[matched.id] ?? [])
  }

  async function save() {
    if (!date) return
    await db.saveRecord({
      id: crypto.randomUUID(),
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

    <datalist id="brands-list">
      {#each brands as brand}<option value={brand.name}></option>{/each}
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

      <div class="form-control">
        <label class="label"><span class="label-text">Diseases covered</span></label>
        <div class="border border-base-300 rounded-lg p-2 max-h-48 overflow-y-auto">
          {#each diseases as disease}
            {@const checked = selectedDiseases.has(disease.id)}
            <label class="flex items-center gap-2 p-1 cursor-pointer hover:bg-base-200 rounded">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                {checked}
                onchange={() => {
                  const next = new Set(selectedDiseases)
                  checked ? next.delete(disease.id) : next.add(disease.id)
                  selectedDiseases = next
                }}
              />
              <span class="text-sm">{disease.name}</span>
            </label>
          {/each}
        </div>
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Date</span></label>
        <input type="date" class="input input-bordered w-full" bind:value={date} />
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

    <div class="flex gap-3 mt-8">
      <a href="/children/{childId}" class="btn btn-ghost">Cancel</a>
      <button class="btn btn-primary" onclick={save}>Save</button>
    </div>
  </div>
</div>
