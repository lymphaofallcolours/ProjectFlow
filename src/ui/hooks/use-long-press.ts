import { useRef, useCallback } from 'react'

type LongPressHandlers = {
  onMouseDown: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: () => void
}

/**
 * Custom hook for detecting long press (~500ms).
 * Cancels if the pointer moves more than 5px (to avoid conflict with drag).
 */
export function useLongPress(
  callback: () => void,
  options?: { threshold?: number; moveThreshold?: number },
): LongPressHandlers {
  const threshold = options?.threshold ?? 500
  const moveThreshold = options?.moveThreshold ?? 5
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }, [])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      startPosRef.current = { x: e.clientX, y: e.clientY }

      const handleMove = (moveEvent: MouseEvent) => {
        if (!startPosRef.current) return
        const dx = moveEvent.clientX - startPosRef.current.x
        const dy = moveEvent.clientY - startPosRef.current.y
        if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
          clear()
          document.removeEventListener('mousemove', handleMove)
        }
      }

      document.addEventListener('mousemove', handleMove)

      timerRef.current = setTimeout(() => {
        document.removeEventListener('mousemove', handleMove)
        callback()
        clear()
      }, threshold)
    },
    [callback, threshold, moveThreshold, clear],
  )

  const onMouseUp = useCallback(() => clear(), [clear])
  const onMouseLeave = useCallback(() => clear(), [clear])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      startPosRef.current = { x: touch.clientX, y: touch.clientY }

      timerRef.current = setTimeout(() => {
        callback()
        clear()
      }, threshold)
    },
    [callback, threshold, clear],
  )

  const onTouchEnd = useCallback(() => clear(), [clear])

  return { onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd }
}
