<script lang="ts">
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { uuid } from '$lib/utils'
  import ChildForm from '$lib/components/ChildForm.svelte'
  import type { Child } from '$lib/types'

  async function save(fields: Omit<Child, 'id'>) {
    const id = uuid()
    await db.saveChild({ id, ...fields })
    localStorage.setItem('activeChildId', id)
    goto('/')
  }
</script>

<ChildForm title="Add family member" onSave={save} />
