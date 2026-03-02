import { useGraphStore } from '@/application/graph-store'
import { useCampaignStore } from '@/application/campaign-store'
import { useEntityStore } from '@/application/entity-store'

export function StatusBar() {
  const nodeCount = useGraphStore((s) => Object.keys(s.nodes).length)
  const edgeCount = useGraphStore((s) => Object.keys(s.edges).length)
  const entityCount = useEntityStore((s) => Object.keys(s.entities).length)
  const name = useCampaignStore((s) => s.name)

  return (
    <div
      className="relative z-10 flex items-center gap-4 px-4 py-1.5 glass-panel border-t border-border
        text-[11px] text-text-muted"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <span>{name}</span>
      <span className="opacity-30">|</span>
      <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
      <span className="opacity-30">|</span>
      <span>{edgeCount} edge{edgeCount !== 1 ? 's' : ''}</span>
      <span className="opacity-30">|</span>
      <span>{entityCount} entit{entityCount !== 1 ? 'ies' : 'y'}</span>
    </div>
  )
}
