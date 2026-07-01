<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { compressImage } from '$lib/utils'
  import { COUNTRY_LABELS, type Country } from '$lib/types'

  const id = page.params.id
  const today = new Date().toISOString().split('T')[0]

  let name = $state('')
  let birthDate = $state('')
  let country = $state<Country>('RUSSIA')
  let sex = $state<'MALE' | 'FEMALE' | ''>('')
  let photo = $state<string | undefined>(undefined)
  let error = $state('')
  let confirmDelete = $state(false)

  onMount(async () => {
    const child = (await db.getChildren()).find(c => c.id === id)
    if (!child) { goto('/'); return }
    name = child.name
    birthDate = child.birthDate
    country = child.country
    sex = child.sex ?? ''
    photo = child.photo
  })

  async function onPhotoChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    photo = await compressImage(file)
  }

  async function save() {
    error = ''
    if (!name.trim()) { error = 'Name is required.'; return }
    if (!birthDate) { error = 'Birth date is required.'; return }
    if (birthDate > today) { error = 'Birth date cannot be in the future.'; return }
    if (!sex) { error = 'Sex is required.'; return }
    await db.saveChild({ id, name: name.trim(), birthDate, country, sex, photo })
    goto(`/children/${id}`)
  }

  async function doDelete() {
    await db.deleteChild(id)
    if (localStorage.getItem('activeChildId') === id) localStorage.removeItem('activeChildId')
    goto('/')
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
        <input type="date" class="input input-bordered w-full" max={today} bind:value={birthDate} />
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Sex</span></label>
        <select class="select select-bordered w-full" bind:value={sex}>
          <option value="">Select…</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Vaccination schedule</span></label>
        <select class="select select-bordered w-full" bind:value={country}>
          {#each Object.entries(COUNTRY_LABELS) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Photo (optional)</span></label>
        {#if photo}
          <div class="flex items-center gap-3 mb-2">
            <img src={photo} alt="Preview" class="w-16 h-16 rounded-full object-cover" />
            <button class="btn btn-ghost btn-xs text-error" onclick={() => photo = undefined}>Remove</button>
          </div>
        {/if}
        <input type="file" accept="image/*" class="file-input file-input-bordered w-full" onchange={onPhotoChange} />
      </div>
    </div>

    {#if error}
      <div class="alert alert-error mt-4 text-sm">{error}</div>
    {/if}

    <div class="flex gap-3 mt-8">
      <a href="/" class="btn btn-ghost">Cancel</a>
      <button class="btn btn-primary" onclick={save}>Save</button>
      <button class="btn btn-ghost text-error ml-auto" onclick={() => confirmDelete = true}>Delete</button>
    </div>
  </div>
</div>

{#if confirmDelete}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Delete {name}?</h3>
      <p class="py-4">All vaccination records for {name} will be deleted.</p>
      <div class="modal-action">
        <button class="btn" onclick={() => confirmDelete = false}>Cancel</button>
        <button class="btn btn-error" onclick={doDelete}>Delete</button>
      </div>
    </div>
    <div class="modal-backdrop" onclick={() => confirmDelete = false}></div>
  </div>
{/if}
