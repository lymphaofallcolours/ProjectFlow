import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { X, Search, Users } from 'lucide-react'
import { useUIStore } from '@/application/ui-store'
import { useGraphStore } from '@/application/graph-store'
import { useEntityStore } from '@/application/entity-store'
import { searchNodes, searchNodesByEntity } from '@/domain/search'
import type { EntityType } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'

export function SearchPanel() {
  const isOpen = useUIStore((s) => s.searchPanelOpen)
  const close = useUIStore((s) => s.toggleSearchPanel)
  const openFieldPanel = useUIStore((s) => s.openFieldPanel)
  const setEntityHighlightFilter = useUIStore((s) => s.setEntityHighlightFilter)
  const selectNodes = useGraphStore((s) => s.selectNodes)
  const nodes = useGraphStore((s) => s.nodes)
  const entitiesMap = useEntityStore((s) => s.entities)

  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'text' | 'entity'>('text')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(timer)
  }, [query])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  // Clear highlight filter when closing
  const handleClose = useCallback(() => {
    close()
    setEntityHighlightFilter(null)
  }, [close, setEntityHighlightFilter])

  // Text search results
  const textResults = useMemo(() => {
    if (mode !== 'text' || !debouncedQuery) return []
    return searchNodes(nodes, debouncedQuery)
  }, [nodes, debouncedQuery, mode])

  // Entity search results (for entity highlight mode)
  const entityResults = useMemo(() => {
    if (mode !== 'entity' || !debouncedQuery) return []
    return searchNodesByEntity(nodes, debouncedQuery)
  }, [nodes, debouncedQuery, mode])

  // Entity list for quick filtering
  const allEntities = useMemo(
    () => Object.values(entitiesMap).sort((a, b) => a.name.localeCompare(b.name)),
    [entitiesMap],
  )

  const handleTextResultClick = useCallback(
    (nodeId: string, fieldKey: string) => {
      selectNodes([nodeId])
      openFieldPanel(nodeId, fieldKey as Parameters<typeof openFieldPanel>[1])
    },
    [selectNodes, openFieldPanel],
  )

  const handleEntityHighlight = useCallback(
    (entityName: string, entityType?: EntityType) => {
      setQuery(entityName)
      setEntityHighlightFilter({ entityName, entityType })
    },
    [setEntityHighlightFilter],
  )

  if (!isOpen) return null

  // Group text results by node
  const grouped = textResults.reduce<Record<string, typeof textResults>>((acc, r) => {
    if (!acc[r.nodeId]) acc[r.nodeId] = []
    acc[r.nodeId].push(r)
    return acc
  }, {})

  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-80 z-30 glass-panel border-r border-border
        flex flex-col shadow-2xl"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2
          className="text-sm font-semibold text-text-primary tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Search
        </h2>
        <button
          onClick={handleClose}
          className="p-1 rounded-md text-text-muted hover:text-text-primary
            hover:bg-surface-glass transition-all cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
        <ModeButton active={mode === 'text'} onClick={() => { setMode('text'); setEntityHighlightFilter(null) }}>
          <Search size={11} /> Text
        </ModeButton>
        <ModeButton active={mode === 'entity'} onClick={() => setMode('entity')}>
          <Users size={11} /> Entity
        </ModeButton>
      </div>

      {/* Search input */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'text' ? 'Search all fields...' : 'Search by entity name...'}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-glass border border-border
              text-xs text-text-primary placeholder:text-text-muted outline-none
              focus:border-node-event transition-colors"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'text' && debouncedQuery && (
          textResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-text-muted">No matches found</div>
          ) : (
            <div className="py-1">
              {Object.entries(grouped).map(([nodeId, results]) => (
                <div key={nodeId} className="border-b border-border/40">
                  <div className="px-4 py-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wider">
                    {results[0].nodeLabel}
                  </div>
                  {results.map((r, i) => (
                    <button
                      key={`${nodeId}-${i}`}
                      onClick={() => handleTextResultClick(r.nodeId, r.fieldKey)}
                      className="w-full px-4 py-1.5 text-left hover:bg-surface-glass
                        transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] text-text-muted">{r.fieldKey}</span>
                      <p className="text-xs text-text-secondary truncate">{r.matchText}</p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )
        )}

        {mode === 'entity' && (
          <div className="py-1">
            {debouncedQuery ? (
              entityResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-text-muted">No matching nodes</div>
              ) : (
                <div className="px-4 py-2 text-xs text-text-muted">
                  Found in {new Set(entityResults.map((r) => r.nodeId)).size} node(s)
                </div>
              )
            ) : (
              allEntities.map((entity) => {
                const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === entity.type)
                return (
                  <button
                    key={entity.id}
                    onClick={() => handleEntityHighlight(entity.name, entity.type)}
                    className="w-full flex items-center gap-2 px-4 py-1.5 text-left
                      hover:bg-surface-glass transition-colors cursor-pointer"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: config?.color }}
                    />
                    <span className="text-xs text-text-secondary">{entity.name}</span>
                    <span className="text-[10px] text-text-muted ml-auto">{config?.label}</span>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <div className="px-3 py-1.5 border-t border-border text-[9px] text-text-muted text-center">
        <kbd className="px-1 py-0.5 rounded bg-surface-glass border border-border text-text-secondary">
          Ctrl+F
        </kbd>
        {' '}to toggle
      </div>
    </div>
  )
}

function ModeButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium
        transition-all cursor-pointer
        ${active
          ? 'text-text-primary bg-surface-glass border border-border'
          : 'text-text-muted hover:text-text-secondary border border-transparent'
        }`}
    >
      {children}
    </button>
  )
}
