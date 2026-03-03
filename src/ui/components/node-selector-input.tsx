import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { SCENE_TYPE_CONFIG } from '@/domain/types'
import { useGraphStore } from '@/application/graph-store'

type NodeSelectorInputProps = {
  value: string
  onChange: (nodeId: string) => void
  excludeIds?: string[]
  label?: string
}

export function NodeSelectorInput({ value, onChange, excludeIds = [], label }: NodeSelectorInputProps) {
  const nodes = useGraphStore((s) => s.nodes)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filteredNodes = useMemo(() => {
    const excludeSet = new Set(excludeIds)
    const all = Object.values(nodes).filter((n) => !excludeSet.has(n.id))
    if (!search) return all.slice(0, 20)
    const q = search.toLowerCase()
    return all.filter((n) => n.label.toLowerCase().includes(q)).slice(0, 20)
  }, [nodes, search, excludeIds])

  const selectedNode = nodes[value]

  const handleSelect = useCallback(
    (nodeId: string) => {
      onChange(nodeId)
      setOpen(false)
      setSearch('')
    },
    [onChange],
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      {label && (
        <span className="text-[9px] text-text-muted uppercase tracking-wider font-medium">
          {label}
        </span>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-2 py-1 text-xs text-text-primary
          bg-surface-glass border border-border rounded-md
          hover:border-node-event transition-colors cursor-pointer truncate"
      >
        {selectedNode ? selectedNode.label : 'Select node...'}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50
          glass-panel border border-border rounded-lg shadow-xl max-h-[160px] overflow-y-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            autoFocus
            className="w-full px-2 py-1.5 text-xs bg-transparent text-text-primary
              placeholder:text-text-muted outline-none border-b border-border"
          />
          {filteredNodes.length === 0 ? (
            <div className="px-2 py-1.5 text-[10px] text-text-muted">No nodes found</div>
          ) : (
            filteredNodes.map((node) => {
              const cfg = SCENE_TYPE_CONFIG[node.sceneType]
              return (
                <button
                  key={node.id}
                  onClick={() => handleSelect(node.id)}
                  className={`w-full text-left px-2 py-1 text-xs flex items-center gap-1.5
                    hover:bg-surface-glass transition-colors cursor-pointer
                    ${node.id === value ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: `var(--color-${cfg.color})` }}
                  />
                  <span className="truncate">{node.label}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
