<script lang="ts">
  import { compressImage, todayISO } from './utils'
  import { COUNTRY_LABELS, type Child, type Country } from './types'
  import type { Snippet } from 'svelte'

  type ChildFields = Omit<Child, 'id'>

  let {
    title,
    initial,
    onSave,
    extraActions
  }: {
    title: string
    initial?: ChildFields
    onSave: (fields: ChildFields) => void | Promise<void>
    extraActions?: Snippet
  } = $props()

  const today = todayISO()

  let name = $state(initial?.name ?? '')
  let birthDate = $state(initial?.birthDate ?? '')
  let country = $state<Country>(initial?.country ?? 'RUSSIA')
  let sex = $state<'MALE' | 'FEMALE' | ''>(initial?.sex ?? '')
  let photo = $state<string | undefined>(initial?.photo)
  let error = $state('')

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
    await onSave({ name: name.trim(), birthDate, country, sex, photo })
  }
</script>

<div class="min-h-full bg-base-100 p-4">
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-6">{title}</h1>

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
      {@render extraActions?.()}
    </div>
  </div>
</div>
