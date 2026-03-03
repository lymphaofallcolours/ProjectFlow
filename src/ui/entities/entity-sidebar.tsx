import { useState, useCallback, useMemo } from 'react'
import { X, Plus, Search, FileText } from 'lucide-react'
import type { EntityType } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { useUIStore } from '@/application/ui-store'
import { useEntityStore } from '@/application/entity-store'
import { exportEntityRegistryAsMarkdown } from '@/domain/entity-operations'
import { downloadMarkdown } from '@/infrastructure/markdown-export'
import { EntityList } from './entity-list'
import { EntityProfile } from './entity-profile'
import { EntityCreateDialog } from './entity-create-dialog'

type FilterTab = 'all' | EntityType

export function EntitySidebar() {
  const isOpen = useUIStore((s) => s.entitySidebarOpen)
  const close = useUIStore((s) => s.toggleEntitySidebar)
  const selectedEntityId = useUIStore((s) => s.selectedEntityId)
  const selectEntity = useUIStore((s) => s.selectEntity)

  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const entitiesMap = useEntityStore((s) => s.entities)
  const filteredEntities = useMemo(() => {
    const entities = Object.values(entitiesMap)
    let list = filter === 'all' ? entities : entities.filter((e) => e.type === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((e) => e.name.toLowerCase().includes(q))
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [entitiesMap, filter, search])

  const handleClose = useCallback(() => {
    close()
    selectEntity(null)
    setShowCreate(false)
  }, [close, selectEntity])

  const handleBack = useCallback(() => {
    selectEntity(null)
    setShowCreate(false)
  }, [selectEntity])

  if (!isOpen) return null

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-80 z-30 glass-panel border-l border-border
        flex flex-col shadow-2xl"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2
          className="text-sm font-semibold text-text-primary tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {selectedEntityId ? 'Entity Profile' : showCreate ? 'New Entity' : 'Entities'}
        </h2>
        <div className="flex items-center gap-1">
          {(selectedEntityId || showCreate) && (
            <button
              onClick={handleBack}
              className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary
                transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary
              hover:bg-surface-glass transition-all cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Profile or Create or List view */}
      {selectedEntityId ? (
        <EntityProfile entityId={selectedEntityId} />
      ) : showCreate ? (
        <EntityCreateDialog
          onCreated={(id) => {
            setShowCreate(false)
            selectEntity(id)
          }}
          onCancel={() => setShowCreate(false)}
        />
      ) : (
        <>
          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entities..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-glass border border-border
                  text-xs text-text-primary placeholder:text-text-muted outline-none
                  focus:border-node-event transition-colors"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto">
            <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </FilterPill>
            {ENTITY_TYPE_CONFIGS.map((cfg) => (
              <FilterPill
                key={cfg.type}
                active={filter === cfg.type}
                onClick={() => setFilter(cfg.type)}
                color={cfg.color}
              >
                {cfg.label}
              </FilterPill>
            ))}
          </div>

          {/* Entity list */}
          <div className="flex-1 overflow-y-auto">
            <EntityList
              entities={filteredEntities}
              onSelect={(id) => selectEntity(id)}
            />
          </div>

          {/* Actions */}
          <div className="px-3 py-2 border-t border-border flex gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                text-xs font-medium text-text-secondary hover:text-text-primary
                bg-surface-glass hover:bg-surface-overlay border border-border
                transition-all cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Plus size={13} />
              Add Entity
            </button>
            <button
              onClick={() => {
                const registry = { entities: entitiesMap }
                const md = exportEntityRegistryAsMarkdown(registry)
                downloadMarkdown(md, 'entity-codex.md')
              }}
              title="Export Entity Codex"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                text-xs font-medium text-text-secondary hover:text-text-primary
                bg-surface-glass hover:bg-surface-overlay border border-border
                transition-all cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <FileText size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function FilterPill({
  children,
  active,
  onClick,
  color,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap
        transition-all cursor-pointer border
        ${active
          ? 'text-text-primary border-current'
          : 'text-text-muted border-transparent hover:text-text-secondary'
        }`}
      style={active && color ? { color, borderColor: `${color}66` } : undefined}
    >
      {children}
    </button>
  )
}
