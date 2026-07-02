<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { db } from '$lib/db'
  import { brands, brandCoverage, diseases } from '$lib/seed'
  import { formatDate, childAge, swipeTabs } from '$lib/utils'
  import { fade } from 'svelte/transition'
  import { COUNTRY_LABELS, type Child } from '$lib/types'
  import Icon from '$lib/Icon.svelte'

  let children = $state<Child[]>([])
  let activeId = $state<string | null>(null)
  let tab = $state<'children' | 'dictionary'>('children')
  let dictView = $state<'brands' | 'diseases'>('brands')
  let dictSearch = $state('')

  export const snapshot = {
    capture: () => ({ tab, dictView, dictSearch }),
    restore: (v: { tab: typeof tab; dictView: typeof dictView; dictSearch: string }) => {
      tab = v.tab; dictView = v.dictView; dictSearch = v.dictSearch
    }
  }

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

  const filteredBrands = $derived(
    brands.filter(b => b.name.toLowerCase().includes(dictSearch.toLowerCase()))
  )
  const filteredDiseases = $derived(
    diseases.filter(d => d.name.toLowerCase().includes(dictSearch.toLowerCase()))
  )
</script>

<div class="min-h-full bg-base-100" use:swipeTabs={{ values: ['children', 'dictionary'], get: () => tab, set: v => tab = v }}>
  <div class="sticky top-0 z-20 bg-base-200 shadow-sm">
    <div class="max-w-lg mx-auto p-4 pb-0">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">VaxBook</h1>
        <div class="flex gap-2">
          {#if tab === 'children'}
            <a href="/children/new" class="btn btn-primary">+ Add child</a>
          {/if}
          <a href="/settings" class="btn btn-ghost" title="Settings"><Icon name="settings" /></a>
        </div>
      </div>

      <div role="tablist" class="tabs tabs-bordered mt-3">
        <button role="tab" class="tab {tab === 'children' ? 'tab-active' : ''}" onclick={() => tab = 'children'}>
          Children
        </button>
        <button role="tab" class="tab {tab === 'dictionary' ? 'tab-active' : ''}" onclick={() => tab = 'dictionary'}>
          Dictionary
        </button>
      </div>
    </div>
  </div>

  <div class="max-w-lg mx-auto p-4">
    {#key tab}
    <div in:fade={{ duration: 150, delay: 100 }} out:fade={{ duration: 100 }}>
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

        <div use:swipeTabs={{ values: ['brands', 'diseases'], get: () => dictView, set: v => dictView = v }}>
        {#key dictView}
        <div in:fade={{ duration: 150, delay: 100 }} out:fade={{ duration: 100 }}>
        {#if dictView === 'brands'}
          <div class="flex flex-col gap-2">
            {#each filteredBrands as brand}
              <a href="/dictionary/brand/{brand.id}" class="card bg-base-200 hover:bg-base-300 transition-colors">
                <div class="card-body p-3">
                  <div class="flex items-baseline gap-2">
                    <span class="font-semibold text-sm">{brand.name}</span>
                    {#if brand.country}<span class="text-base-content/50 text-[10px]">{brand.country}</span>{/if}
                  </div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    {#each (brandCoverage[brand.id] ?? []) as diseaseId}
                      <span class="badge badge-xs border border-base-300 bg-transparent text-base-content/60">{diseases.find(d => d.id === diseaseId)?.name ?? diseaseId}</span>
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
                      <span class="badge badge-xs border border-base-300 bg-transparent text-base-content/60">{brand.name}</span>
                    {/each}
                  </div>
                </div>
              </a>
            {/each}
          </div>
        {/if}
        </div>
        {/key}
        </div>
      </div>
    {/if}
    </div>
    {/key}
  </div>
</div>
