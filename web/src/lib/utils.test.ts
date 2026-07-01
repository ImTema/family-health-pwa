import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { childAge, formatDate, swipeTabs, uuid } from './utils'

describe('uuid', () => {
  it('generates RFC4122 v4-shaped ids via crypto.randomUUID', () => {
    const id = uuid()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('generates unique ids across calls', () => {
    expect(uuid()).not.toBe(uuid())
  })

  it('falls back to a manual v4 id when crypto.randomUUID is unavailable', () => {
    const original = crypto.randomUUID
    // @ts-expect-error simulating non-secure context fallback
    crypto.randomUUID = undefined
    try {
      const id = uuid()
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    } finally {
      crypto.randomUUID = original
    }
  })
})

describe('formatDate', () => {
  it('replaces dashes with dots', () => {
    expect(formatDate('2024-01-15')).toBe('2024.01.15')
  })
})

describe('childAge', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns "newborn" for a baby born today', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    expect(childAge('2024-01-01')).toBe('newborn')
  })

  it('returns days for a baby under a month old', () => {
    vi.setSystemTime(new Date('2024-01-11T00:00:00Z'))
    expect(childAge('2024-01-01')).toBe('10d')
  })

  it('returns months for a child under 1 year old', () => {
    vi.setSystemTime(new Date('2024-04-01T00:00:00Z'))
    expect(childAge('2024-01-01')).toBe('3m')
  })

  it('returns whole years for a child on an exact birthday', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    expect(childAge('2024-01-01')).toBe('2y')
  })

  it('returns years and months for a child between birthdays', () => {
    vi.setSystemTime(new Date('2026-04-01T00:00:00Z'))
    expect(childAge('2024-01-01')).toBe('2y 3m')
  })
})

describe('swipeTabs', () => {
  const values = ['a', 'b', 'c'] as const
  let node: HTMLElement
  let current: typeof values[number]
  let set: ReturnType<typeof vi.fn<(v: typeof values[number]) => void>>

  beforeEach(() => {
    node = document.createElement('div')
    current = 'b'
    set = vi.fn((v: typeof values[number]) => { current = v })
  })

  const touch = (type: string, x: number, y: number) =>
    node.dispatchEvent(Object.assign(new Event(type), {
      touches: [{ clientX: x, clientY: y }],
      changedTouches: [{ clientX: x, clientY: y }]
    }))

  it('advances to the next tab on a leftward swipe', () => {
    swipeTabs(node, { values, get: () => current, set })
    touch('touchstart', 100, 0)
    touch('touchend', 30, 0)
    expect(set).toHaveBeenCalledWith('c')
  })

  it('goes to the previous tab on a rightward swipe', () => {
    swipeTabs(node, { values, get: () => current, set })
    touch('touchstart', 30, 0)
    touch('touchend', 100, 0)
    expect(set).toHaveBeenCalledWith('a')
  })

  it('ignores swipes shorter than the threshold', () => {
    swipeTabs(node, { values, get: () => current, set })
    touch('touchstart', 100, 0)
    touch('touchend', 80, 0)
    expect(set).not.toHaveBeenCalled()
  })

  it('ignores swipes that are more vertical than horizontal', () => {
    swipeTabs(node, { values, get: () => current, set })
    touch('touchstart', 100, 0)
    touch('touchend', 40, 100)
    expect(set).not.toHaveBeenCalled()
  })

  it('does not advance past the last value', () => {
    current = 'c'
    swipeTabs(node, { values, get: () => current, set })
    touch('touchstart', 100, 0)
    touch('touchend', 30, 0)
    expect(set).not.toHaveBeenCalled()
  })

  it('does not go before the first value', () => {
    current = 'a'
    swipeTabs(node, { values, get: () => current, set })
    touch('touchstart', 30, 0)
    touch('touchend', 100, 0)
    expect(set).not.toHaveBeenCalled()
  })

  it('destroy() removes the touch listeners', () => {
    const { destroy } = swipeTabs(node, { values, get: () => current, set })
    destroy()
    touch('touchstart', 100, 0)
    touch('touchend', 30, 0)
    expect(set).not.toHaveBeenCalled()
  })
})
