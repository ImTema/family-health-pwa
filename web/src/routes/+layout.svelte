<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'

  let { children } = $props()

  onMount(() => {
    if (import.meta.env.DEV) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (link) link.href = '/icon-dev.svg'
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
    }
    const saved = localStorage.getItem('theme') ?? 'light'
    document.documentElement.setAttribute('data-theme', saved)
  })
</script>

<div class="min-h-dvh flex flex-col">
  <div class="flex-1">
    {@render children()}
  </div>

  <footer class="print:hidden text-center text-xs text-base-content/40 py-6">
    <a href="https://linkedin.com/in/apetrov08/" target="_blank" rel="noopener" class="link">LinkedIn</a>
     · Artem Petrov · 2026 · v{__APP_VERSION__}
  </footer>
</div>
