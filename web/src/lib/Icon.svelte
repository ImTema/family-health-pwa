<script lang="ts">
  const { name, size = 16, strokeWidth = 2 }: { name: string; size?: number; strokeWidth?: number } = $props()

  const paths: Record<string, string> = {
    trash:   '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>',
    pencil:  '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    virus:   '<circle cx="12" cy="12" r="4"/><circle cx="10" cy="11" r="0.6" fill="currentColor"/><circle cx="13" cy="10" r="0.6" fill="currentColor"/><circle cx="12" cy="13" r="0.6" fill="currentColor"/><line x1="16" y1="12" x2="19" y2="12"/><circle cx="19.5" cy="12" r="1"/><line x1="8" y1="12" x2="5" y2="12"/><circle cx="4.5" cy="12" r="1"/><line x1="12" y1="8" x2="12" y2="5"/><circle cx="12" cy="4.5" r="1"/><line x1="12" y1="16" x2="12" y2="19"/><circle cx="12" cy="19.5" r="1"/><line x1="14.83" y1="14.83" x2="16.95" y2="16.95"/><circle cx="17.5" cy="17.5" r="1"/><line x1="9.17" y1="14.83" x2="7.05" y2="16.95"/><circle cx="6.5" cy="17.5" r="1"/><line x1="9.17" y1="9.17" x2="7.05" y2="7.05"/><circle cx="6.5" cy="6.5" r="1"/><line x1="14.83" y1="9.17" x2="16.95" y2="7.05"/><circle cx="17.5" cy="6.5" r="1"/>',
  }
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {@html paths[name] ?? ''}
</svg>
