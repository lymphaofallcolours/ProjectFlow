import { useMemo } from 'react'
import { X } from 'lucide-react'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import type { EntityType } from '@/domain/entity-types'
import { SCENE_TYPE_CONFIG, SCENE_TYPES } from '@/domain/types'
import type { SceneType, StoryNode } from '@/domain/types'
import type { Entity } from '@/domain/entity-types'
import { computeIncomingRelationships } from '@/domain/entity-operations'
import { useUIStore } from '@/application/ui-store'
import { useGraphStore } from '@/application/graph-store'
import { useEntityStore } from '@/application/entity-store'
import { useSessionStore } from '@/application/session-store'

export function CampaignDashboard() {
  const isOpen = useUIStore((s) => s.dashboardOpen)
  const close = useUIStore((s) => s.toggleDashboard)
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const entitiesMap = useEntityStore((s) => s.entities)
  const playthroughLog = useSessionStore((s) => s.playthroughLog)

  if (!isOpen) return null

  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-80 z-30 glass-panel border-r border-border
        flex flex-col shadow-2xl"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2
          className="text-sm font-semibold text-text-primary tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Campaign Dashboard
        </h2>
        <button
          onClick={close}
          className="p-1 rounded-md text-text-muted hover:text-text-primary
            hover:bg-surface-glass transition-all cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <EntityCountsSection entities={entitiesMap} />
        <NodeCountsSection nodes={nodes} />
        <GraphStatsSection
          edgeCount={Object.keys(edges).length}
          groupCount={Object.values(nodes).filter((n) => n.isGroup).length}
        />
        <SessionStatsSection
          sessionCount={playthroughLog.length}
          latestDate={playthroughLog.length > 0
            ? playthroughLog[playthroughLog.length - 1].sessionDate
            : null}
        />
        <TopConnectedSection entities={entitiesMap} />
        <TopTaggedSection nodes={nodes} />
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
      {children}
    </div>
  )
}

function EntityCountsSection({ entities }: { entities: Record<string, Entity> }) {
  const counts = useMemo(() => {
    const map = new Map<EntityType, number>()
    for (const e of Object.values(entities)) {
      map.set(e.type, (map.get(e.type) ?? 0) + 1)
    }
    return map
  }, [entities])

  return (
    <div className="border-b border-border/40 pb-2 mb-1">
      <SectionTitle>Entities ({Object.keys(entities).length})</SectionTitle>
      <div className="flex flex-wrap gap-1.5 px-4">
        {ENTITY_TYPE_CONFIGS.map((cfg) => (
          <span
            key={cfg.type}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
              font-medium text-white/90"
            style={{ backgroundColor: cfg.color }}
          >
            {cfg.label}: {counts.get(cfg.type) ?? 0}
          </span>
        ))}
      </div>
    </div>
  )
}

function NodeCountsSection({ nodes }: { nodes: Record<string, StoryNode> }) {
  const counts = useMemo(() => {
    const map = new Map<SceneType, number>()
    for (const n of Object.values(nodes)) {
      if (n.isGroup) continue
      map.set(n.sceneType, (map.get(n.sceneType) ?? 0) + 1)
    }
    return map
  }, [nodes])

  const totalNodes = Object.values(nodes).filter((n) => !n.isGroup).length

  return (
    <div className="border-b border-border/40 pb-2 mb-1">
      <SectionTitle>Nodes ({totalNodes})</SectionTitle>
      <div className="flex flex-wrap gap-1.5 px-4">
        {SCENE_TYPES.map((type) => {
          const cfg = SCENE_TYPE_CONFIG[type]
          return (
            <span
              key={type}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                font-medium border border-border text-text-secondary"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: `var(--color-${cfg.color})` }}
              />
              {cfg.label}: {counts.get(type) ?? 0}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function GraphStatsSection({ edgeCount, groupCount }: { edgeCount: number; groupCount: number }) {
  return (
    <div className="border-b border-border/40 pb-2 mb-1">
      <SectionTitle>Graph</SectionTitle>
      <div className="px-4 space-y-0.5">
        <StatRow label="Edges" value={edgeCount} />
        <StatRow label="Groups" value={groupCount} />
      </div>
    </div>
  )
}

function SessionStatsSection({
  sessionCount,
  latestDate,
}: {
  sessionCount: number
  latestDate: string | null
}) {
  return (
    <div className="border-b border-border/40 pb-2 mb-1">
      <SectionTitle>Sessions</SectionTitle>
      <div className="px-4 space-y-0.5">
        <StatRow label="Sessions" value={sessionCount} />
        {latestDate && <StatRow label="Latest" value={latestDate} />}
      </div>
    </div>
  )
}

function TopConnectedSection({ entities }: { entities: Record<string, Entity> }) {
  const topConnected = useMemo(() => {
    const entityList = Object.values(entities)
    return entityList
      .map((e) => {
        const outgoing = e.relationships?.length ?? 0
        const incoming = computeIncomingRelationships(entities, e.id).length
        return { entity: e, total: outgoing + incoming }
      })
      .filter((e) => e.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [entities])

  if (topConnected.length === 0) return null

  return (
    <div className="border-b border-border/40 pb-2 mb-1">
      <SectionTitle>Most Connected</SectionTitle>
      <div className="px-4 space-y-0.5">
        {topConnected.map(({ entity, total }) => {
          const cfg = ENTITY_TYPE_CONFIGS.find((c) => c.type === entity.type)
          return (
            <div key={entity.id} className="flex items-center gap-1.5 text-[11px]">
              {cfg && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
              )}
              <span className="text-text-secondary truncate">{entity.name}</span>
              <span className="text-text-muted ml-auto">{total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopTaggedSection({ nodes }: { nodes: Record<string, StoryNode> }) {
  const topTagged = useMemo(() => {
    return Object.values(nodes)
      .filter((n) => n.metadata.tags.length > 0)
      .sort((a, b) => b.metadata.tags.length - a.metadata.tags.length)
      .slice(0, 5)
  }, [nodes])

  if (topTagged.length === 0) return null

  return (
    <div className="pb-2">
      <SectionTitle>Most Tagged Nodes</SectionTitle>
      <div className="px-4 space-y-0.5">
        {topTagged.map((node) => (
          <div key={node.id} className="flex items-center gap-1.5 text-[11px]">
            <span className="text-text-secondary truncate">{node.label}</span>
            <span className="text-text-muted ml-auto">{node.metadata.tags.length} tags</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-secondary font-medium">{value}</span>
    </div>
  )
}
