import { useState, useCallback } from 'react'
import { X, Blocks, Plus, Trash2, ArrowDownToLine } from 'lucide-react'
import { useUIStore } from '@/application/ui-store'
import { useGraphStore } from '@/application/graph-store'
import { useCampaignStore } from '@/application/campaign-store'
import type { GraphTemplate } from '@/domain/types'
import { getBuiltinTemplates, createCustomTemplate } from '@/domain/graph-templates'
import { extractSubgraph } from '@/domain/graph-operations'
import { SCENE_TYPE_CONFIG } from '@/domain/types'

const SHAPE_GLYPHS: Record<string, string> = {
  event: '\u25CB',
  narration: '\u25A1',
  combat: '\u25B3',
  social: '\u25C7',
  investigation: '\u2B21',
}

export function GraphTemplatePicker() {
  const isOpen = useUIStore((s) => s.graphTemplatePanelOpen)
  const close = useUIStore((s) => s.toggleGraphTemplatePanel)
  const importSubgraph = useGraphStore((s) => s.importSubgraph)
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)
  const customTemplates = useCampaignStore((s) => s.graphTemplates)
  const addGraphTemplate = useCampaignStore((s) => s.addGraphTemplate)
  const removeGraphTemplate = useCampaignStore((s) => s.removeGraphTemplate)

  const [showSave, setShowSave] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDesc, setSaveDesc] = useState('')

  const builtinTemplates = getBuiltinTemplates()
  const hasSelection = selectedNodeIds.size > 0

  const handleInsert = useCallback(
    (template: GraphTemplate) => {
      importSubgraph(template.nodes, template.edges)
    },
    [importSubgraph],
  )

  const handleDelete = useCallback(
    (id: string) => {
      removeGraphTemplate(id)
    },
    [removeGraphTemplate],
  )

  const handleSaveSelection = useCallback(() => {
    if (!saveName.trim()) return
    const { nodes, edges, selectedNodeIds: ids } = useGraphStore.getState()
    const sub = extractSubgraph(nodes, edges, Array.from(ids))
    const template = createCustomTemplate(saveName.trim(), saveDesc.trim(), sub.nodes, sub.edges)
    addGraphTemplate(template)
    setSaveName('')
    setSaveDesc('')
    setShowSave(false)
  }, [saveName, saveDesc, addGraphTemplate])

  const handleClose = useCallback(() => {
    close()
    setShowSave(false)
    setSaveName('')
    setSaveDesc('')
  }, [close])

  if (!isOpen) return null

  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-80 z-30 glass-panel border-r border-border
        flex flex-col shadow-2xl"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Blocks size={14} className="text-text-muted" />
          <h2
            className="text-sm font-semibold text-text-primary tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Structures
          </h2>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded-md text-text-muted hover:text-text-primary
            hover:bg-surface-glass transition-all cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Built-in templates */}
        <TemplateSection label="Built-in">
          {builtinTemplates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onInsert={() => handleInsert(t)}
            />
          ))}
        </TemplateSection>

        {/* Custom templates */}
        {customTemplates.length > 0 && (
          <TemplateSection label="Custom">
            {customTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onInsert={() => handleInsert(t)}
                onDelete={() => handleDelete(t.id)}
              />
            ))}
          </TemplateSection>
        )}
      </div>

      {/* Save selection as template */}
      <div className="shrink-0 border-t border-border px-3 py-3">
        {showSave ? (
          <div className="space-y-2">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Structure name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSelection()
                if (e.key === 'Escape') setShowSave(false)
              }}
              className="w-full px-2.5 py-1.5 rounded-md text-xs bg-transparent
                border border-border text-text-primary placeholder:text-text-muted
                outline-none focus:border-node-investigation transition-colors"
            />
            <input
              value={saveDesc}
              onChange={(e) => setSaveDesc(e.target.value)}
              placeholder="Description (optional)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSelection()
                if (e.key === 'Escape') setShowSave(false)
              }}
              className="w-full px-2.5 py-1.5 rounded-md text-xs bg-transparent
                border border-border text-text-primary placeholder:text-text-muted
                outline-none focus:border-node-investigation transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveSelection}
                disabled={!saveName.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md
                  text-xs font-medium transition-all cursor-pointer
                  bg-node-investigation/15 text-node-investigation hover:bg-node-investigation/25
                  disabled:opacity-40 disabled:cursor-default"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Save
              </button>
              <button
                onClick={() => setShowSave(false)}
                className="px-2 py-1.5 rounded-md text-xs text-text-muted
                  hover:text-text-primary hover:bg-surface-glass transition-all cursor-pointer"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSave(true)}
            disabled={!hasSelection}
            className="flex items-center gap-1.5 text-xs text-text-muted
              hover:text-text-secondary transition-colors cursor-pointer
              disabled:opacity-40 disabled:cursor-default"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Plus size={12} />
            Save selection as structure
            {hasSelection && (
              <span className="text-[10px] text-text-muted">
                ({selectedNodeIds.size} nodes)
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function TemplateSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2 px-1">
        {label}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function TemplateCard({
  template,
  onInsert,
  onDelete,
}: {
  template: GraphTemplate
  onInsert: () => void
  onDelete?: () => void
}) {
  const sceneTypes = template.nodes.map((n) => n.sceneType)
  const uniqueTypes = [...new Set(sceneTypes)]

  return (
    <div className="group rounded-lg border border-border hover:border-border/80
      bg-surface-glass/30 hover:bg-surface-glass/50 transition-all p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-medium text-text-primary truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {template.name}
            </span>
          </div>
          {template.description && (
            <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded text-text-muted opacity-0 group-hover:opacity-60
                hover:!opacity-100 hover:text-status-skipped transition-all cursor-pointer"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={onInsert}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
              text-node-investigation bg-node-investigation/10 hover:bg-node-investigation/20
              transition-all cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <ArrowDownToLine size={11} />
            Insert
          </button>
        </div>
      </div>

      {/* Node type preview */}
      <div className="flex items-center gap-1.5 mt-2">
        {uniqueTypes.map((type) => {
          const config = SCENE_TYPE_CONFIG[type]
          const count = sceneTypes.filter((t) => t === type).length
          return (
            <span
              key={type}
              className="inline-flex items-center gap-0.5 text-[10px]"
              style={{ color: `var(--color-node-${config.color})` }}
            >
              <span className="text-xs">{SHAPE_GLYPHS[type] ?? '\u25CB'}</span>
              {count > 1 && <span className="font-medium">{count}</span>}
            </span>
          )
        })}
        <span className="text-[10px] text-text-muted ml-auto">
          {template.nodes.length}n {template.edges.length}e
        </span>
      </div>
    </div>
  )
}
