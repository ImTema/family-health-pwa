<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { uuid } from '$lib/utils'
  import RecordForm from '$lib/RecordForm.svelte'

  const childId = page.params.id

  let childBirthDate = $state('')

  onMount(async () => {
    const children = await db.getChildren()
    childBirthDate = children.find(c => c.id === childId)?.birthDate ?? ''
  })
</script>

<RecordForm
  title="Add record"
  {childId}
  {childBirthDate}
  onSave={async fields => {
    await db.saveRecord({ id: uuid(), childId, ...fields })
    goto(`/children/${childId}`)
  }}
/>
