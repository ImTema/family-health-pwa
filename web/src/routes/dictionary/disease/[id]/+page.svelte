<script lang="ts">
  import { page } from '$app/state'
  import { diseases, brands, brandCoverage } from '$lib/seed'

  const disease = diseases.find(d => d.id === page.params.id)
  const coveringBrands = brands.filter(b => (brandCoverage[b.id] ?? []).includes(page.params.id))
</script>

<div class="min-h-full bg-base-100 p-4">
  <div class="max-w-lg mx-auto">
    <a href="/" onclick={e => { e.preventDefault(); history.back() }} class="btn btn-ghost btn-xs mb-4">← Dictionary</a>

    {#if disease}
      <h1 class="text-2xl font-bold mb-1">{disease.name}</h1>

      <div class="flex flex-col gap-4 mt-4">
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-base">About</h2>
            <p class="text-sm">{disease.description ?? 'Description coming soon.'}</p>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-base">Symptoms</h2>
            <p class="text-sm">{disease.symptoms ?? 'Symptoms coming soon.'}</p>
          </div>
        </div>

        {#if coveringBrands.length > 0}
          <div class="card bg-base-200">
            <div class="card-body">
              <h2 class="card-title text-base">Vaccines that cover this disease</h2>
              <div class="flex flex-wrap gap-2 mt-1">
                {#each coveringBrands as brand}
                  <a href="/dictionary/brand/{brand.id}" class="badge badge-outline badge-md hover:badge-primary">{brand.name}</a>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-base-content/60">Disease not found.</p>
    {/if}
  </div>
</div>
