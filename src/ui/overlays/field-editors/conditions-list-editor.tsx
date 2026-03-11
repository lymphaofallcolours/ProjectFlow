import { useCallback, useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ConditionEntry, StoryEdge } from '@/domain/types'
import { useGraphStore } from '@/application/graph-store'

type ConditionsListEditorProps = {
  value: ConditionEntry[]
  onChange: (value: ConditionEntry[]) => void
  nodeId: string
}

const STATUS_CYCLE: ConditionEntry['status'][] = ['unknown', 'unmet', 'met']
const STATUS_DISPLAY: Record<ConditionEntry['status'], { symbol: string; color: string; label: string }> = {
  met: { symbol: '●', color: 'var(--color-status-played)', label: 'Met' },
  unmet: { symbol: '○', color: 'var(--color-text-muted)', label: 'Unmet' },
  unknown: { symbol: '?', color: '#d97706', label: 'Unknown' },
}

export function ConditionsListEditor({ value, onChange, nodeId }: ConditionsListEditorProps) {
  const edges = useGraphStore((s) => s.edges)
  const nodes = useGraphStore((s) => s.nodes)

  const outgoingEdges = Object.values(edges).filter(
    (e: StoryEdge) => e.source === nodeId,
  )

  const handleAdd = useCallback(() => {
    onChange([...value, { description: '', status: 'unknown' }])
  }, [value, onChange])

  const handleRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange],
  )

  const handleUpdate = useCallback(
    (index: number, patch: Partial<ConditionEntry>) => {
      onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
    },
    [value, onChange],
  )

  const cycleStatus = useCallback(
    (index: number) => {
      const current = value[index].status
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
      handleUpdate(index, { status: next })
    },
    [value, handleUpdate],
  )

  return (
    <div className="space-y-2">
      {value.map((entry, i) => (
        <ConditionRow
          key={i}
          entry={entry}
          outgoingEdges={outgoingEdges}
          nodes={nodes}
          onCycleStatus={() => cycleStatus(i)}
          onUpdate={(patch) => handleUpdate(i, patch)}
          onRemove={() => handleRemove(i)}
        />
      ))}
      <button
        onClick={handleAdd}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary
          transition-colors cursor-pointer"
      >
        <Plus size={12} />
        Add condition
      </button>
    </div>
  )
}

function ConditionRow({
  entry,
  outgoingEdges,
  nodes,
  onCycleStatus,
  onUpdate,
  onRemove,
}: {
  entry: ConditionEntry
  outgoingEdges: StoryEdge[]
  nodes: Record<string, { label: string }>
  onCycleStatus: () => void
  onUpdate: (patch: Partial<ConditionEntry>) => void
  onRemove: () => void
}) {
  const status = STATUS_DISPLAY[entry.status]
  const [showNotes, setShowNotes] = useState(!!entry.notes)

  return (
    <div className="flex gap-2 items-start group">
      <button
        onClick={onCycleStatus}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded
          hover:bg-surface-glass transition-colors cursor-pointer mt-0.5"
        style={{ color: status.color }}
        title={`Status: ${status.label} — click to cycle`}
      >
        <span className="text-sm font-bold">{status.symbol}</span>
      </button>

      <div className="flex-1 space-y-1 min-w-0">
        <input
          value={entry.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Condition description"
          className="w-full bg-transparent text-sm text-text-primary
            placeholder:text-text-muted outline-none"
        />

        <div className="flex items-center gap-2">
          <select
            value={entry.targetEdgeId ?? ''}
            onChange={(e) =>
              onUpdate({ targetEdgeId: e.target.value || undefined })
            }
            className="bg-transparent text-xs text-text-secondary outline-none
              cursor-pointer border-none appearance-none"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <option value="">No linked edge</option>
            {outgoingEdges.map((edge) => {
              const targetNode = nodes[edge.target]
              return (
                <option key={edge.id} value={edge.id}>
                  → {targetNode?.label ?? edge.target}
                  {edge.label ? ` (${edge.label})` : ''}
                </option>
              )
            })}
          </select>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            title={showNotes ? 'Hide notes' : 'Add notes'}
          >
            {showNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {showNotes && (
          <input
            value={entry.notes ?? ''}
            onChange={(e) => onUpdate({ notes: e.target.value || undefined })}
            placeholder="Notes (optional)"
            className="w-full bg-transparent text-xs text-text-muted
              placeholder:text-text-muted/50 outline-none"
          />
        )}
      </div>

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity mt-1 cursor-pointer"
      >
        <X size={14} className="text-text-muted" />
      </button>
    </div>
  )
}
