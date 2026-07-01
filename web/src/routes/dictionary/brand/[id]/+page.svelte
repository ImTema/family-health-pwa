<script lang="ts">
  import { page } from '$app/state'
  import { brands, brandCoverage, diseases } from '$lib/seed'

  const brand = brands.find(b => b.id === page.params.id)
  const coveredDiseases = (brandCoverage[page.params.id] ?? []).map(id => diseases.find(d => d.id === id)).filter(Boolean)
</script>

<div class="min-h-screen bg-base-100 p-4">
  <div class="max-w-lg mx-auto">
    <a href="/" onclick={e => { e.preventDefault(); history.back() }} class="btn btn-ghost btn-xs mb-4">← Dictionary</a>

    {#if brand}
      <h1 class="text-2xl font-bold mb-1">{brand.name}</h1>

      <div class="flex flex-col gap-4 mt-4">
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-base">About</h2>
            <p class="text-sm">{brand.description ?? 'Description coming soon.'}</p>
          </div>
        </div>

        {#if coveredDiseases.length > 0}
          <div class="card bg-base-200">
            <div class="card-body">
              <h2 class="card-title text-base">Diseases covered</h2>
              <div class="flex flex-wrap gap-2 mt-1">
                {#each coveredDiseases as disease}
                  <a href="/dictionary/disease/{disease!.id}" class="badge badge-outline badge-md hover:badge-primary">{disease!.name}</a>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-base-content/60">Vaccine not found.</p>
    {/if}
  </div>
</div>
