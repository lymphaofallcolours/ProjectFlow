import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2, Copy, Scissors, Clipboard, CheckCircle, Edit3, XCircle, Circle, Tag, Download, Blocks, FolderOpen, FolderClosed, Ungroup, FolderX, Minus, X } from 'lucide-react'
import type { SceneType, PlaythroughStatus } from '@/domain/types'
import { SCENE_TYPES, SCENE_TYPE_CONFIG } from '@/domain/types'
import { PLAYTHROUGH_STATUSES, PLAYTHROUGH_STATUS_CONFIG } from '@/domain/playthrough-operations'
import { useGraphStore } from '@/application/graph-store'
import { useSessionStore } from '@/application/session-store'
import { serializeSubgraph } from '@/domain/subgraph-operations'
import { saveSubgraphToFile } from '@/infrastructure/file-io'
import { extractSubgraph } from '@/domain/graph-operations'
import { createCustomTemplate } from '@/domain/graph-templates'
import { useCampaignStore } from '@/application/campaign-store'
import { PlaythroughNotesInput } from './playthrough-notes-input'
import { EdgeLabelInput } from './edge-label-input'
import { useEscapeKey } from '@/ui/hooks/use-escape-key'
import { useMenuPosition } from '@/ui/hooks/use-menu-position'

type ContextMenuProps = {
  nodeId: string
  position: { x: number; y: number }
  onClose: () => void
}

export { MenuItem }

function BannerIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="9" viewBox="0 0 14 9" className="inline-block">
      <path d="M2,0 L12,0 L14,4.5 L12,9 L2,9 L0,4.5 Z" fill={color} opacity="0.8" />
    </svg>
  )
}

const SHAPE_ICONS: Record<SceneType, string | null> = {
  event: '○',
  narration: '□',
  combat: '△',
  social: '◇',
  investigation: '⬡',
  divider: null,
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  played_as_planned: <CheckCircle size={13} />,
  modified: <Edit3 size={13} />,
  skipped: <XCircle size={13} />,
  unvisited: <Circle size={13} />,
}

export function NodeContextMenu({ nodeId, position, onClose }: ContextMenuProps) {
  const deleteNode = useGraphStore((s) => s.deleteNode)
  const duplicateNode = useGraphStore((s) => s.duplicateNode)
  const changeSceneType = useGraphStore((s) => s.changeSceneType)
  const setPlaythroughStatus = useGraphStore((s) => s.setPlaythroughStatus)
  const currentType = useGraphStore((s) => s.nodes[nodeId]?.sceneType)
  const currentPlaythroughStatus = useGraphStore((s) => s.nodes[nodeId]?.playthroughStatus)
  const currentArcLabel = useGraphStore((s) => s.nodes[nodeId]?.arcLabel)
  const setArcLabel = useGraphStore((s) => s.setArcLabel)
  const currentTags = useGraphStore((s) => s.nodes[nodeId]?.metadata.tags ?? [])
  const setNodeTags = useGraphStore((s) => s.setNodeTags)
  const recordNodeVisit = useSessionStore((s) => s.recordNodeVisit)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)
  const deleteSelectedNodes = useGraphStore((s) => s.deleteSelectedNodes)
  const duplicateSelectedNodes = useGraphStore((s) => s.duplicateSelectedNodes)
  const copySelectedNodes = useGraphStore((s) => s.copySelectedNodes)
  const cutSelectedNodes = useGraphStore((s) => s.cutSelectedNodes)
  const createGroup = useGraphStore((s) => s.createGroup)
  const addToGroup = useGraphStore((s) => s.addToGroup)
  const removeFromGroup = useGraphStore((s) => s.removeFromGroup)
  const deleteGroup = useGraphStore((s) => s.deleteGroup)
  const toggleGroupCollapsed = useGraphStore((s) => s.toggleGroupCollapsed)
  const nodeIsGroup = useGraphStore((s) => s.nodes[nodeId]?.isGroup)
  const nodeGroupId = useGraphStore((s) => s.nodes[nodeId]?.groupId)
  const nodeCollapsed = useGraphStore((s) => s.nodes[nodeId]?.collapsed)
  const nodePosition = useGraphStore((s) => s.nodes[nodeId]?.position)
  const nodeExists = useGraphStore((s) => !!s.nodes[nodeId])
  const isDivider = currentType === 'divider'
  const currentMagnitude = useGraphStore((s) => s.nodes[nodeId]?.dividerMagnitude ?? 1)
  const setDividerMagnitude = useGraphStore((s) => s.setDividerMagnitude)
  const ref = useRef<HTMLDivElement>(null)

  useEscapeKey(onClose)
  useMenuPosition(ref, position)

  const [awaitingNotes, setAwaitingNotes] = useState(false)
  const [editingArcLabel, setEditingArcLabel] = useState(false)

  const isMultiSelect = selectedNodeIds.size > 1 && selectedNodeIds.has(nodeId)
  const selCount = selectedNodeIds.size

  const handleDelete = useCallback(() => {
    if (isMultiSelect) {
      deleteSelectedNodes()
    } else {
      deleteNode(nodeId)
    }
    onClose()
  }, [isMultiSelect, deleteSelectedNodes, deleteNode, nodeId, onClose])

  const handleDuplicate = useCallback(() => {
    if (isMultiSelect) {
      duplicateSelectedNodes()
    } else {
      duplicateNode(nodeId)
    }
    onClose()
  }, [isMultiSelect, duplicateSelectedNodes, duplicateNode, nodeId, onClose])

  const handleCopy = useCallback(() => {
    copySelectedNodes()
    onClose()
  }, [copySelectedNodes, onClose])

  const handleCut = useCallback(() => {
    cutSelectedNodes()
    onClose()
  }, [cutSelectedNodes, onClose])

  const addGraphTemplate = useCampaignStore((s) => s.addGraphTemplate)

  const handleExportSubgraph = useCallback(async () => {
    const { nodes, edges } = useGraphStore.getState()
    const ids = Array.from(selectedNodeIds)
    const json = serializeSubgraph(nodes, edges, ids)
    await saveSubgraphToFile(json, 'subgraph.pfsg.json')
    onClose()
  }, [selectedNodeIds, onClose])

  const handleSaveAsStructure = useCallback(() => {
    const { nodes, edges } = useGraphStore.getState()
    const sub = extractSubgraph(nodes, edges, Array.from(selectedNodeIds))
    const template = createCustomTemplate(
      `Structure (${selectedNodeIds.size} nodes)`,
      '',
      sub.nodes,
      sub.edges,
    )
    addGraphTemplate(template)
    onClose()
  }, [selectedNodeIds, addGraphTemplate, onClose])

  const handleGroupSelected = useCallback(() => {
    const pos = nodePosition ?? { x: 0, y: 0 }
    const groupId = createGroup(currentType ?? 'narration', { x: pos.x - 30, y: pos.y - 60 }, 'Group')
    const ids = Array.from(selectedNodeIds).filter((id) => {
      const n = useGraphStore.getState().nodes[id]
      return !!n
    })
    if (ids.length > 0) addToGroup(groupId, ids)
    onClose()
  }, [nodePosition, createGroup, currentType, selectedNodeIds, addToGroup, onClose])

  const handleUngroup = useCallback(() => {
    deleteGroup(nodeId, false)
    onClose()
  }, [deleteGroup, nodeId, onClose])

  const handleDeleteGroupWithChildren = useCallback(() => {
    deleteGroup(nodeId, true)
    onClose()
  }, [deleteGroup, nodeId, onClose])

  const handleToggleCollapse = useCallback(() => {
    toggleGroupCollapsed(nodeId)
    onClose()
  }, [toggleGroupCollapsed, nodeId, onClose])

  const handleRemoveFromGroup = useCallback(() => {
    removeFromGroup([nodeId])
    onClose()
  }, [removeFromGroup, nodeId, onClose])

  const handleChangeType = useCallback(
    (sceneType: SceneType) => {
      changeSceneType(nodeId, sceneType)
      onClose()
    },
    [changeSceneType, nodeId, onClose],
  )

  const handleSetStatus = useCallback(
    (status: PlaythroughStatus, notes?: string) => {
      setPlaythroughStatus(nodeId, status, notes)
      if (activeSessionId) {
        recordNodeVisit(nodeId, status, notes)
      }
      onClose()
    },
    [setPlaythroughStatus, recordNodeVisit, nodeId, activeSessionId, onClose],
  )

  const handleStatusClick = useCallback(
    (status: PlaythroughStatus) => {
      if (status === 'modified') {
        setAwaitingNotes(true)
      } else {
        handleSetStatus(status)
      }
    },
    [handleSetStatus],
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Guard: node was deleted while context menu was open
  if (!nodeExists) return null

  return (
    <div
      ref={ref}
      className="fixed glass-panel rounded-xl p-1 min-w-[180px] shadow-xl z-[100]"
      style={{ top: position.y, left: position.x }}
    >
      {isMultiSelect ? (
        <>
          {/* Multi-select header */}
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
            {selCount} Nodes Selected
          </div>

          <MenuItem
            icon={<Copy size={14} className="text-text-muted" />}
            label="Copy"
            onClick={handleCopy}
          />
          <MenuItem
            icon={<Scissors size={14} className="text-text-muted" />}
            label="Cut"
            onClick={handleCut}
          />
          <MenuItem
            icon={<Clipboard size={14} className="text-text-muted" />}
            label={`Duplicate ${selCount}`}
            onClick={handleDuplicate}
          />
          <MenuItem
            icon={<Download size={14} className="text-text-muted" />}
            label="Export Subgraph"
            onClick={handleExportSubgraph}
          />
          <MenuItem
            icon={<Blocks size={14} className="text-text-muted" />}
            label="Save as Structure"
            onClick={handleSaveAsStructure}
          />

          <div className="h-px bg-border my-1 mx-2" />

          <MenuItem
            icon={<FolderClosed size={14} className="text-text-muted" />}
            label="Group Selected"
            onClick={handleGroupSelected}
          />

          <div className="h-px bg-border my-1 mx-2" />

          <MenuItem
            icon={<Trash2 size={14} className="text-status-skipped" />}
            label={`Delete ${selCount}`}
            onClick={handleDelete}
            destructive
          />
        </>
      ) : (
        <>
          {/* Scene type submenu */}
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
            Scene Type
          </div>
          {SCENE_TYPES.map((type) => {
            const config = SCENE_TYPE_CONFIG[type]
            const isActive = type === currentType
            const accentColor = `var(--color-${config.color})`
            return (
              <MenuItem
                key={type}
                icon={
                  <span
                    className="text-sm w-4 text-center"
                    style={{ color: accentColor }}
                  >
                    {type === 'divider' ? <BannerIcon color={accentColor} /> : SHAPE_ICONS[type]}
                  </span>
                }
                label={config.label}
                active={isActive}
                onClick={() => handleChangeType(type)}
              />
            )
          })}

          {/* Divider magnitude — only for divider nodes */}
          {isDivider && (
            <>
              <div className="h-px bg-border my-1 mx-2" />
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                Magnitude
              </div>
              {([1, 2, 3] as const).map((mag) => (
                <MenuItem
                  key={mag}
                  icon={<span className="text-sm w-4 text-center text-text-muted">{mag === 3 ? '━' : mag === 2 ? '═' : '─'}</span>}
                  label={mag === 3 ? 'Arc Break' : mag === 2 ? 'Session Break' : 'Scene Break'}
                  active={mag === currentMagnitude}
                  onClick={() => { setDividerMagnitude(nodeId, mag); onClose() }}
                />
              ))}
            </>
          )}

          <div className="h-px bg-border my-1 mx-2" />

          {/* Arc label section */}
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
            Arc Label
          </div>
          {editingArcLabel ? (
            <EdgeLabelInput
              initialValue={currentArcLabel ?? ''}
              placeholder="Arc label..."
              onConfirm={(label) => {
                setArcLabel(nodeId, label)
                onClose()
              }}
              onCancel={() => setEditingArcLabel(false)}
              onClear={() => {
                setArcLabel(nodeId, undefined)
                onClose()
              }}
            />
          ) : (
            <MenuItem
              icon={<Tag size={14} className="text-text-muted" />}
              label={currentArcLabel ?? 'Set arc label...'}
              onClick={() => setEditingArcLabel(true)}
            />
          )}

          <div className="h-px bg-border my-1 mx-2" />

          {/* Tags section */}
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
            Tags
          </div>
          <TagChipEditor
            tags={currentTags}
            onChange={(tags) => setNodeTags(nodeId, tags)}
          />

          <div className="h-px bg-border my-1 mx-2" />

          {/* Playthrough status submenu — requires active session */}
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
            Playthrough
          </div>
          {activeSessionId ? (
            <>
              {PLAYTHROUGH_STATUSES.map((status) => {
                const config = PLAYTHROUGH_STATUS_CONFIG[status]
                const isActive = status === currentPlaythroughStatus
                return (
                  <MenuItem
                    key={status}
                    icon={
                      <span style={{ color: `var(--color-${config.color})` }}>
                        {STATUS_ICONS[status]}
                      </span>
                    }
                    label={config.label}
                    active={isActive}
                    onClick={() => handleStatusClick(status)}
                  />
                )
              })}

              {awaitingNotes && (
                <PlaythroughNotesInput
                  onConfirm={(notes) => handleSetStatus('modified', notes)}
                  onCancel={onClose}
                />
              )}
            </>
          ) : (
            <div className="px-3 py-1.5 text-[10px] text-text-muted italic">
              Start a session to track playthrough
            </div>
          )}

          {/* Group operations — shown for group nodes */}
          {nodeIsGroup && (
            <>
              <div className="h-px bg-border my-1 mx-2" />
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                Group
              </div>
              <MenuItem
                icon={nodeCollapsed
                  ? <FolderOpen size={14} className="text-text-muted" />
                  : <FolderClosed size={14} className="text-text-muted" />}
                label={nodeCollapsed ? 'Expand' : 'Collapse'}
                onClick={handleToggleCollapse}
              />
              <MenuItem
                icon={<Ungroup size={14} className="text-text-muted" />}
                label="Ungroup"
                onClick={handleUngroup}
              />
              <MenuItem
                icon={<FolderX size={14} className="text-status-skipped" />}
                label="Delete Group + Children"
                onClick={handleDeleteGroupWithChildren}
                destructive
              />
            </>
          )}

          {/* Remove from group — shown for any node inside a group */}
          {nodeGroupId && (
            <>
              <div className="h-px bg-border my-1 mx-2" />
              <MenuItem
                icon={<Minus size={14} className="text-text-muted" />}
                label="Remove from Group"
                onClick={handleRemoveFromGroup}
              />
            </>
          )}

          <div className="h-px bg-border my-1 mx-2" />

          <MenuItem
            icon={<Copy size={14} className="text-text-muted" />}
            label="Duplicate"
            onClick={handleDuplicate}
          />
          <MenuItem
            icon={<Trash2 size={14} className="text-status-skipped" />}
            label="Delete"
            onClick={handleDelete}
            destructive
          />
        </>
      )}
    </div>
  )
}

const TAG_COLORS = [
  'var(--color-node-event)',
  'var(--color-node-narration)',
  'var(--color-node-combat)',
  'var(--color-node-social)',
  'var(--color-node-investigation)',
]

function tagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) | 0
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

function TagChipEditor({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const handleAdd = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
  }, [input, tags, onChange])

  return (
    <div className="px-3 pb-1">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px]
                font-medium text-white/90"
              style={{ backgroundColor: tagColor(tag), opacity: 0.85 }}
            >
              {tag}
              <button
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="ml-0.5 hover:text-white cursor-pointer"
              >
                <X size={8} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
          if (e.key === 'Escape') setInput('')
        }}
        placeholder="Add tag..."
        className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted
          outline-none border-b border-border focus:border-node-event transition-colors pb-0.5"
      />
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  active,
  destructive,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-left text-xs
        transition-colors duration-100 cursor-pointer
        ${active ? 'bg-surface-glass text-text-primary font-medium' : ''}
        ${destructive ? 'text-status-skipped hover:bg-status-skipped/10' : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {icon}
      {label}
    </button>
  )
}
