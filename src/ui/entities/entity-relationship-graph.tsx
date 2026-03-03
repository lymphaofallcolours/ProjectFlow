import { useMemo, useState, useCallback } from 'react'
import { ReactFlow, ReactFlowProvider, Background, Controls } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import { X } from 'lucide-react'
import type { EntityType } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { computeEntityGraphLayout } from '@/domain/entity-graph-layout'
import { useEntityStore } from '@/application/entity-store'
import { useUIStore } from '@/application/ui-store'
import { EntityGraphNodeComponent } from './entity-graph-node'
import type { EntityFlowNode } from './entity-graph-node'

const entityGraphNodeTypes = { entity: EntityGraphNodeComponent } as const

const ALL_TYPES: EntityType[] = ['pc', 'npc', 'enemy', 'object', 'location', 'secret']

export function EntityRelationshipGraph() {
  const isOpen = useUIStore((s) => s.entityGraphOpen)
  const toggleEntityGraph = useUIStore((s) => s.toggleEntityGraph)
  const selectEntity = useUIStore((s) => s.selectEntity)
  const openEntitySidebar = useUIStore((s) => s.openEntitySidebar)
  const entities = useEntityStore((s) => s.getAllEntities)

  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(new Set(ALL_TYPES))

  const toggleType = useCallback((type: EntityType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  const allEntities = entities()

  const layout = useMemo(
    () => computeEntityGraphLayout(allEntities, activeTypes),
    [allEntities, activeTypes],
  )

  const flowNodes: EntityFlowNode[] = useMemo(
    () =>
      layout.nodes.map((n) => ({
        id: n.entityId,
        type: 'entity' as const,
        position: n.position,
        data: { entityId: n.entityId, name: n.name, entityType: n.type },
      })),
    [layout.nodes],
  )

  const flowEdges: Edge[] = useMemo(
    () =>
      layout.edges.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        label: e.label,
        type: 'default',
        style: { stroke: 'var(--color-text-muted)', strokeWidth: 1 },
        labelStyle: { fontSize: 9, fill: 'var(--color-text-muted)' },
      })),
    [layout.edges],
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: EntityFlowNode) => {
      selectEntity(node.data.entityId)
      openEntitySidebar()
    },
    [selectEntity, openEntitySidebar],
  )

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-40 glass-panel flex flex-col">
      <Header onClose={toggleEntityGraph} />
      <TypeFilterBar activeTypes={activeTypes} onToggle={toggleType} />
      <div className="flex-1">
        <ReactFlowProvider>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={entityGraphNodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <h2
        className="text-sm font-semibold text-text-primary tracking-wide"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Entity Relationships
      </h2>
      <button
        onClick={onClose}
        className="p-1 rounded-md text-text-muted hover:text-text-primary
          hover:bg-surface-glass transition-all cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function TypeFilterBar({
  activeTypes,
  onToggle,
}: {
  activeTypes: Set<EntityType>
  onToggle: (type: EntityType) => void
}) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border">
      {ALL_TYPES.map((type) => {
        const cfg = ENTITY_TYPE_CONFIGS.find((c) => c.type === type)
        const active = activeTypes.has(type)
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer
              border ${active
                ? 'border-transparent text-white/90'
                : 'border-border text-text-muted hover:text-text-secondary'}`}
            style={active ? { backgroundColor: cfg?.color } : undefined}
          >
            {cfg?.label}
          </button>
        )
      })}
    </div>
  )
}
