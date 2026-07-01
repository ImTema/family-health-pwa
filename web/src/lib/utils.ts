// ponytail: fallback for non-secure contexts (HTTP over local WiFi)
export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
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
