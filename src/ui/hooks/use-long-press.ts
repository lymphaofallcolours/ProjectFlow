import { useRef, useEffect, useCallback } from 'react'

/**
 * Custom hook for detecting long press (~500ms).
 * Uses native DOM event listeners via a ref to avoid interfering with
 * React Flow's synthetic event handling (which caused double-click-to-select bugs).
 * Cancels if the pointer moves more than the moveThreshold (default 15px).
 */
export function useLongPress(
  callback: () => void,
  options?: { threshold?: number; moveThreshold?: number },
): React.RefCallback<HTMLElement> {
  const threshold = options?.threshold ?? 500
  const moveThreshold = options?.moveThreshold ?? 15
  const callbackRef = useRef(callback)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Keep callback ref current without re-attaching listeners
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  const refCallback = useCallback(
    (element: HTMLElement | null) => {
      // Detach from previous element
      cleanupRef.current?.()
      cleanupRef.current = null

      if (!element) return

      let timer: ReturnType<typeof setTimeout> | null = null
      let startPos: { x: number; y: number } | null = null
      let moveHandler: ((e: PointerEvent) => void) | null = null

      const clear = () => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
        if (moveHandler) {
          document.removeEventListener('pointermove', moveHandler)
          moveHandler = null
        }
        startPos = null
      }

      const onPointerDown = (e: PointerEvent) => {
        // Only trigger on left mouse button
        if (e.button !== 0) return
        startPos = { x: e.clientX, y: e.clientY }

        moveHandler = (moveEvent: PointerEvent) => {
          if (!startPos) return
          const dx = moveEvent.clientX - startPos.x
          const dy = moveEvent.clientY - startPos.y
          if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
            clear()
          }
        }

        document.addEventListener('pointermove', moveHandler)

        timer = setTimeout(() => {
          if (moveHandler) {
            document.removeEventListener('pointermove', moveHandler)
            moveHandler = null
          }
          callbackRef.current()
          timer = null
          startPos = null
        }, threshold)
      }

      const onPointerUp = () => clear()

      element.addEventListener('pointerdown', onPointerDown)
      element.addEventListener('pointerup', onPointerUp)
      element.addEventListener('pointerleave', onPointerUp)

      cleanupRef.current = () => {
        clear()
        element.removeEventListener('pointerdown', onPointerDown)
        element.removeEventListener('pointerup', onPointerUp)
        element.removeEventListener('pointerleave', onPointerUp)
      }
    },
    [threshold, moveThreshold],
  )

  return refCallback
}
