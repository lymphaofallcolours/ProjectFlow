import { useUIStore } from '@/application/ui-store'
import { FieldPanel } from './field-panel'

/**
 * Top-level overlay renderer. Reads the activeOverlay state from useUIStore
 * and renders the appropriate overlay component.
 *
 * Note: RadialSubnodes are rendered inside GraphCanvasInner (they need
 * React Flow context for flowToScreenPosition). This component handles
 * the full-screen overlays (FieldPanel, CockpitOverlay).
 */
export function OverlayRoot() {
  const activeOverlay = useUIStore((s) => s.activeOverlay)

  if (!activeOverlay) return null

  switch (activeOverlay.type) {
    case 'field-panel':
      return (
        <FieldPanel
          nodeId={activeOverlay.nodeId}
          fieldKey={activeOverlay.fieldKey}
        />
      )
    case 'cockpit':
      // Cockpit overlay — implemented in Commit 9
      return null
  }
}
