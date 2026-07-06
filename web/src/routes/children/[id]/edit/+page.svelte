<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import ChildForm from '$lib/components/ChildForm.svelte'
  import type { Child } from '$lib/types'

  const id = page.params.id as string

  let child = $state<Child | undefined>(undefined)
  let confirmDelete = $state(false)

  onMount(async () => {
    child = await db.getChild(id)
    if (!child) goto('/')
  })

  async function save(fields: Omit<Child, 'id'>) {
    await db.saveChild({ id, ...fields })
    goto(`/children/${id}`)
  }

  async function doDelete() {
    await db.deleteChild(id)
    if (localStorage.getItem('activeChildId') === id) localStorage.removeItem('activeChildId')
    goto('/')
  }
</script>

{#if child}
  <ChildForm title="Edit family member" initial={child} onSave={save}>
    {#snippet extraActions()}
      <button class="btn btn-ghost text-error ml-auto" onclick={() => confirmDelete = true}>Delete</button>
    {/snippet}
  </ChildForm>
{/if}

{#if confirmDelete}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Delete {child?.name}?</h3>
      <p class="py-4">All vaccination records for {child?.name} will be deleted.</p>
      <div class="modal-action">
        <button class="btn" onclick={() => confirmDelete = false}>Cancel</button>
        <button class="btn btn-error" onclick={doDelete}>Delete</button>
      </div>
    </div>
    <button type="button" class="modal-backdrop" aria-label="Close" onclick={() => confirmDelete = false}></button>
  </div>
{/if}
