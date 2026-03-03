import { useMemo } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { FIELD_DEFINITIONS, SCENE_TYPE_CONFIG } from '@/domain/types'
import { NODE_DIMENSIONS } from '@/ui/graph/node-shapes'
import { isFieldPopulated } from '@/domain/graph-operations'
import { FieldIcon } from './field-icon'

const ORBIT_RADIUS = 72
const SUBNODE_SIZE = 40

export function RadialSubnodes({ nodeId }: { nodeId: string }) {
  const node = useGraphStore((s) => s.nodes[nodeId])
  const openFieldPanel = useUIStore((s) => s.openFieldPanel)
  const { flowToScreenPosition, getZoom } = useReactFlow()

  const positions = useMemo(() => {
    if (!node) return []
    const config = SCENE_TYPE_CONFIG[node.sceneType]
    const dim = NODE_DIMENSIONS[config.shape]
    const centerX = node.position.x + dim.width / 2
    const centerY = node.position.y + dim.height / 2

    return FIELD_DEFINITIONS.map((fieldDef, i) => {
      const angle = (i / FIELD_DEFINITIONS.length) * 2 * Math.PI - Math.PI / 2
      const flowX = centerX + Math.cos(angle) * ORBIT_RADIUS
      const flowY = centerY + Math.sin(angle) * ORBIT_RADIUS
      const screenPos = flowToScreenPosition({ x: flowX, y: flowY })
      return { fieldDef, screenPos }
    })
  }, [node, flowToScreenPosition])

  const zoom = getZoom()

  if (!node) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Scrim — dims the graph behind subnodes */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{ backgroundColor: 'var(--color-surface-overlay)', opacity: 0.5 }}
      />
      {positions.map(({ fieldDef, screenPos }) => {
        const populated = isFieldPopulated(node.fields, fieldDef.key)
        const scaledSize = SUBNODE_SIZE * Math.min(zoom, 1.5)

        return (
          <button
            key={fieldDef.key}
            onClick={() => openFieldPanel(nodeId, fieldDef.key)}
            className="pointer-events-auto absolute flex flex-col items-center justify-center
              rounded-full shadow-lg
              transition-all duration-200 hover:scale-110 cursor-pointer"
            style={{
              width: scaledSize,
              height: scaledSize,
              left: screenPos.x - scaledSize / 2,
              top: screenPos.y - scaledSize / 2,
              opacity: populated ? 1 : 0.75,
              background: 'var(--color-surface-alt)',
              border: populated
                ? `1.5px solid ${fieldDef.color}`
                : '1.5px solid var(--color-surface-glass-border)',
              backdropFilter: 'blur(8px) saturate(160%)',
              boxShadow: populated
                ? `0 0 14px ${fieldDef.color}66, 0 2px 8px rgba(0,0,0,0.1)`
                : '0 2px 8px rgba(0,0,0,0.12)',
            }}
            title={fieldDef.label}
          >
            <FieldIcon
              name={fieldDef.icon}
              size={scaledSize * 0.42}
              style={{ color: populated ? fieldDef.color : 'var(--color-text-muted)' }}
            />
          </button>
        )
      })}
    </div>
  )
}
