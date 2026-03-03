import { useLayoutEffect } from 'react'

type Position = { x: number; y: number }
const VIEWPORT_PADDING = 8

/**
 * Adjusts a fixed-position menu so it stays within the viewport.
 * Mutates the element's style directly in useLayoutEffect (before paint).
 * Runs on every render to maintain correct position after internal state changes.
 */
export function useMenuPosition(
  ref: React.RefObject<HTMLDivElement | null>,
  position: Position,
) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    let { x, y } = position

    if (y + rect.height > window.innerHeight - VIEWPORT_PADDING) {
      y = Math.max(VIEWPORT_PADDING, y - rect.height)
    }
    if (x + rect.width > window.innerWidth - VIEWPORT_PADDING) {
      x = Math.max(VIEWPORT_PADDING, x - rect.width)
    }

    el.style.top = `${y}px`
    el.style.left = `${x}px`
  })
}
