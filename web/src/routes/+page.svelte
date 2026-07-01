<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { brands, brandCoverage, diseases } from '$lib/seed'
  import { formatDate, childAge } from '$lib/utils'
  import { COUNTRY_LABELS, type Child } from '$lib/types'
  import Icon from '$lib/Icon.svelte'

  let children = $state<Child[]>([])
  let activeId = $state<string | null>(null)
  let confirmDelete = $state<Child | null>(null)
  let tab = $state<'children' | 'dictionary'>('children')
  let dictView = $state<'brands' | 'diseases'>('brands')
  let dictSearch = $state('')

  onMount(async () => {
    activeId = localStorage.getItem('activeChildId')
    children = await db.getChildren()
    if (!children.some(c => c.id === activeId)) {
      activeId = null
      localStorage.removeItem('activeChildId')
    }
  })

  function activate(id: string) {
    activeId = id
    localStorage.setItem('activeChildId', id)
  }

  async function doDelete(child: Child) {
    await db.deleteChild(child.id)
    if (activeId === child.id) {
      activeId = null
      localStorage.removeItem('activeChildId')
    }
    children = await db.getChildren()
    confirmDelete = null
  }

  const filteredBrands = $derived(
    brands.filter(b => b.name.toLowerCase().includes(dictSearch.toLowerCase()))
  )
  const filteredDiseases = $derived(
    diseases.filter(d => d.name.toLowerCase().includes(dictSearch.toLowerCase()))
  )
</script>

<div class="min-h-screen bg-base-100 p-4">
  <div class="max-w-lg mx-auto">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">VaxTrack</h1>
      <div class="flex gap-2">
        <a href="/settings" class="btn btn-ghost btn-sm" title="Settings"><Icon name="settings" /></a>
        {#if tab === 'children'}
          <a href="/children/new" class="btn btn-primary">+ Add child</a>
        {/if}
      </div>
    </div>

    <div role="tablist" class="tabs tabs-bordered mb-4">
      <button role="tab" class="tab {tab === 'children' ? 'tab-active' : ''}" onclick={() => tab = 'children'}>
        Children
      </button>
      <button role="tab" class="tab {tab === 'dictionary' ? 'tab-active' : ''}" onclick={() => tab = 'dictionary'}>
        Dictionary
      </button>
    </div>

    {#if tab === 'children'}
      {#if children.length === 0}
        <div class="hero min-h-64">
          <div class="hero-content text-center">
            <div>
              <p class="text-base-content/60 mb-4">No children yet.</p>
              <a href="/children/new" class="btn btn-primary">Add your first child</a>
            </div>
          </div>
        </div>
      {:else}
        <div class="flex flex-col gap-3">
          {#each children as child}
            <div
              class="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
              onclick={() => { activate(child.id); goto(`/children/${child.id}`) }}
              role="button"
              tabindex="0"
              onkeydown={e => e.key === 'Enter' && goto(`/children/${child.id}`)}
            >
              <div class="card-body p-4">
                <div class="flex justify-between items-start gap-3">
                  {#if child.photo}
                    <img src={child.photo} alt={child.name} class="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  {/if}
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-lg">{child.name}</div>
                    <div class="text-sm text-base-content/60">
                      {formatDate(child.birthDate)} · {childAge(child.birthDate)} · {COUNTRY_LABELS[child.country]}
                      {#if child.sex} · {child.sex === 'MALE' ? 'Male' : 'Female'}{/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <a
                      href="/children/{child.id}/edit"
                      class="btn btn-ghost btn-sm"
                      title="Edit"
                      onclick={e => e.stopPropagation()}
                    ><Icon name="pencil" /></a>
                    <button
                      class="btn btn-ghost btn-sm text-error"
                      title="Delete"
                      onclick={e => { e.stopPropagation(); confirmDelete = child }}
                    ><Icon name="trash" /></button>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

    {:else}
      <div class="flex flex-col gap-3">
        <input
          type="text"
          class="input input-bordered w-full"
          placeholder="Search…"
          bind:value={dictSearch}
        />

        <div role="tablist" class="tabs tabs-bordered">
          <button role="tab" class="tab {dictView === 'brands' ? 'tab-active' : ''}" onclick={() => dictView = 'brands'}>
            Brands ({filteredBrands.length})
          </button>
          <button role="tab" class="tab {dictView === 'diseases' ? 'tab-active' : ''}" onclick={() => dictView = 'diseases'}>
            Diseases ({filteredDiseases.length})
          </button>
        </div>

        {#if dictView === 'brands'}
          <div class="flex flex-col gap-2">
            {#each filteredBrands as brand}
              <a href="/dictionary/brand/{brand.id}" class="card bg-base-200 hover:bg-base-300 transition-colors">
                <div class="card-body p-3">
                  <div class="font-semibold text-sm">{brand.name}</div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    {#each (brandCoverage[brand.id] ?? []) as diseaseId}
                      <span class="badge badge-outline badge-sm">{diseases.find(d => d.id === diseaseId)?.name ?? diseaseId}</span>
                    {/each}
                  </div>
                </div>
              </a>
            {/each}
          </div>
        {:else}
          <div class="flex flex-col gap-2">
            {#each filteredDiseases as disease}
              {@const coveringBrands = brands.filter(b => (brandCoverage[b.id] ?? []).includes(disease.id))}
              <a href="/dictionary/disease/{disease.id}" class="card bg-base-200 hover:bg-base-300 transition-colors">
                <div class="card-body p-3">
                  <div class="font-semibold text-sm">{disease.name}</div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    {#each coveringBrands as brand}
                      <span class="badge badge-outline badge-sm">{brand.name}</span>
                    {/each}
                  </div>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if confirmDelete}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Delete {confirmDelete.name}?</h3>
      <p class="py-4">All vaccination records for {confirmDelete.name} will be deleted.</p>
      <div class="modal-action">
        <button class="btn" onclick={() => confirmDelete = null}>Cancel</button>
        <button class="btn btn-error" onclick={() => doDelete(confirmDelete!)}>Delete</button>
      </div>
    </div>
    <div class="modal-backdrop" onclick={() => confirmDelete = null}></div>
  </div>
{/if}
