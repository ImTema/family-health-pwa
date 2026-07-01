<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { COUNTRY_LABELS, type Country } from '$lib/types'

  const id = page.params.id

  let name = $state('')
  let birthDate = $state('')
  let country = $state<Country>('RUSSIA')

  onMount(async () => {
    const child = (await db.getChildren()).find(c => c.id === id)
    if (!child) { goto('/'); return }
    name = child.name
    birthDate = child.birthDate
    country = child.country
  })

  async function save() {
    if (!name.trim() || !birthDate) return
    await db.saveChild({ id, name: name.trim(), birthDate, country })
    goto(`/children/${id}`)
  }
</script>

<div class="min-h-screen bg-base-100 p-4">
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-6">Edit child</h1>

    <div class="flex flex-col gap-4">
      <div class="form-control">
        <label class="label"><span class="label-text">Name</span></label>
        <input type="text" class="input input-bordered w-full" placeholder="Child's name" bind:value={name} />
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Date of birth</span></label>
        <input type="date" class="input input-bordered w-full" bind:value={birthDate} />
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Vaccination schedule</span></label>
        <select class="select select-bordered w-full" bind:value={country}>
          {#each Object.entries(COUNTRY_LABELS) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="flex gap-3 mt-8">
      <a href="/children/{id}" class="btn btn-ghost">Cancel</a>
      <button class="btn btn-primary" onclick={save}>Save</button>
    </div>
  </div>
</div>
