<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import RecordForm from '$lib/components/RecordForm.svelte'
  import type { VaccinationRecord } from '$lib/types'

  const childId = page.params.id as string
  const rid = page.params.rid as string

  let childBirthDate = $state('')
  let record = $state<VaccinationRecord | null>(null)
  let confirmDelete = $state(false)

  onMount(async () => {
    childBirthDate = (await db.getChild(childId))?.birthDate ?? ''

    const found = (await db.getRecords(childId)).find(r => r.id === rid)
    if (!found) { goto(`/children/${childId}`); return }
    record = found
  })

  async function doDelete() {
    await db.deleteRecord(rid)
    goto(`/children/${childId}`)
  }
</script>

{#if record}
  <RecordForm
    title="Edit record"
    {childId}
    {childBirthDate}
    initial={record}
    onSave={async fields => {
      await db.saveRecord({ id: rid, childId, ...fields })
      goto(`/children/${childId}`)
    }}
  >
    {#snippet extraActions()}
      <button class="btn btn-ghost text-error ml-auto" onclick={() => confirmDelete = true}>Delete</button>
    {/snippet}
  </RecordForm>
{/if}

{#if confirmDelete}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Delete this record?</h3>
      <p class="py-4">This cannot be undone.</p>
      <div class="modal-action">
        <button class="btn" onclick={() => confirmDelete = false}>Cancel</button>
        <button class="btn btn-error" onclick={doDelete}>Delete</button>
      </div>
    </div>
    <div class="modal-backdrop" onclick={() => confirmDelete = false}></div>
  </div>
{/if}
