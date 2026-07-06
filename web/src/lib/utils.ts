export function compressImage(file: File, maxPx = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

// ponytail: fallback for non-secure contexts (HTTP over local WiFi)
export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function swipeTabs<T extends string>(node: HTMLElement, opts: { values: readonly T[]; get: () => T; set: (v: T) => void }) {
  let x = 0, y = 0
  const onStart = (e: TouchEvent) => { x = e.touches[0].clientX; y = e.touches[0].clientY }
  const onEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - x
    const dy = e.changedTouches[0].clientY - y
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    const { values, get, set } = opts
    const i = values.indexOf(get()) + (dx < 0 ? 1 : -1)
    if (i >= 0 && i < values.length) set(values[i])
  }
  // ponytail: listen on window (not node) so swipe still registers over short content / the footer strip
  window.addEventListener('touchstart', onStart, { passive: true })
  window.addEventListener('touchend', onEnd, { passive: true })
  return { destroy() { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) } }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(iso: string): string {
  return iso.replace(/-/g, '.')
}

export function childAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const now = new Date()
  const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 1) return 'newborn'
  if (days < 30) return `${days}d`
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) { years--; months += 12 }
  if (years < 1) return `${months}m`
  if (months === 0) return `${years}y`
  return `${years}y ${months}m`
}
