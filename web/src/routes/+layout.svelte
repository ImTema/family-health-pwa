<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'

  let { children } = $props()

  onMount(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
    }
    const saved = localStorage.getItem('theme') ?? 'light'
    document.documentElement.setAttribute('data-theme', saved)
  })
</script>

{@render children()}
