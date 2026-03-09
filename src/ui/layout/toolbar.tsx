import { useState, useCallback } from 'react'
import {
  Plus,
  Save,
  FolderOpen,
  Sun,
  Moon,
  ArrowRightLeft,
  ArrowUpDown,
  Users,
  HelpCircle,
  Search,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Timer,
  Upload,
  LayoutTemplate,
  Network,
  Blocks,
  BarChart3,
  Grip,
  Grid3X3,
  Square,
  Magnet,
} from 'lucide-react'
import { useUIStore } from '@/application/ui-store'
import { useGraphStore } from '@/application/graph-store'
import { useSessionStore } from '@/application/session-store'
import { useHistoryStore } from '@/application/history-store'
import { applyTheme } from '@/infrastructure/theme'
import { saveCampaignAction, loadCampaignAction } from '@/application/campaign-actions'
import { loadSubgraphFromFile } from '@/infrastructure/file-io'
import { deserializeSubgraph } from '@/domain/subgraph-operations'
import { SceneTypePicker } from './scene-type-picker'
import { SessionSelector } from './session-selector'

export function Toolbar() {
  const [showPicker, setShowPicker] = useState(false)
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const scrollDirection = useGraphStore((s) => s.scrollDirection)
  const setScrollDirection = useGraphStore((s) => s.setScrollDirection)
  const toggleEntitySidebar = useUIStore((s) => s.toggleEntitySidebar)
  const toggleTemplateManager = useUIStore((s) => s.toggleTemplateManager)
  const toggleEntityGraph = useUIStore((s) => s.toggleEntityGraph)
  const toggleGraphTemplatePanel = useUIStore((s) => s.toggleGraphTemplatePanel)
  const toggleDashboard = useUIStore((s) => s.toggleDashboard)
  const toggleLegendPanel = useUIStore((s) => s.toggleLegendPanel)
  const toggleSearchPanel = useUIStore((s) => s.toggleSearchPanel)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const diffOverlayActive = useSessionStore((s) => s.diffOverlayActive)
  const toggleDiffOverlay = useSessionStore((s) => s.toggleDiffOverlay)
  const canUndo = useHistoryStore((s) => s.past.length > 0)
  const canRedo = useHistoryStore((s) => s.future.length > 0)
  const undo = useGraphStore((s) => s.undo)
  const redo = useGraphStore((s) => s.redo)
  const canvasBackground = useUIStore((s) => s.canvasBackground)
  const cycleCanvasBackground = useUIStore((s) => s.cycleCanvasBackground)
  const snapToGrid = useUIStore((s) => s.snapToGrid)
  const toggleSnapToGrid = useUIStore((s) => s.toggleSnapToGrid)
  const autoSaveEnabled = useUIStore((s) => s.autoSaveEnabled)
  const toggleAutoSave = useUIStore((s) => s.toggleAutoSave)
  const importSubgraph = useGraphStore((s) => s.importSubgraph)

  const handleThemeToggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    toggleTheme()
    applyTheme(next)
  }, [theme, toggleTheme])

  const handleScrollToggle = useCallback(() => {
    setScrollDirection(scrollDirection === 'horizontal' ? 'vertical' : 'horizontal')
  }, [scrollDirection, setScrollDirection])

  const handleSave = useCallback(async () => {
    await saveCampaignAction()
  }, [])

  const handleLoad = useCallback(async () => {
    await loadCampaignAction()
  }, [])

  const handleImportSubgraph = useCallback(async () => {
    const json = await loadSubgraphFromFile()
    if (!json) return
    try {
      const { nodes, edges } = deserializeSubgraph(json)
      importSubgraph(nodes, edges)
    } catch {
      // Invalid subgraph file — silently ignore
    }
  }, [importSubgraph])

  return (
    <div className="relative z-10 flex items-center gap-1 px-3 py-2 glass-panel border-b border-border overflow-x-auto">
      {/* Left group: graph actions + session */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <ToolbarButton
            icon={<Plus size={16} />}
            label="New Node"
            onClick={() => setShowPicker(!showPicker)}
          />
          {showPicker && (
            <SceneTypePicker onClose={() => setShowPicker(false)} />
          )}
        </div>

        <ToolbarDivider />

        <SessionSelector />
        <ToolbarButton
          icon={diffOverlayActive ? <EyeOff size={16} /> : <Eye size={16} />}
          label={diffOverlayActive ? 'Hide Diff' : 'Show Diff'}
          onClick={toggleDiffOverlay}
          active={diffOverlayActive}
          disabled={!activeSessionId}
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={<Undo2 size={16} />}
          label="Undo"
          onClick={undo}
          disabled={!canUndo}
        />
        <ToolbarButton
          icon={<Redo2 size={16} />}
          label="Redo"
          onClick={redo}
          disabled={!canRedo}
        />
      </div>

      {/* Center spacer */}
      <div className="flex-1" />

      {/* Right group: panels + file ops + settings */}
      <div className="flex items-center gap-1">
        <ToolbarButton icon={<Search size={16} />} label="Search" onClick={toggleSearchPanel} />
        <ToolbarButton icon={<Users size={16} />} label="Entities" onClick={toggleEntitySidebar} />
        <ToolbarButton icon={<Network size={16} />} label="Relationships" onClick={toggleEntityGraph} />
        <ToolbarButton icon={<Blocks size={16} />} label="Structures" onClick={toggleGraphTemplatePanel} />
        <ToolbarButton icon={<BarChart3 size={16} />} label="Dashboard" onClick={toggleDashboard} />
        <ToolbarButton icon={<LayoutTemplate size={16} />} label="Templates" onClick={toggleTemplateManager} />

        <ToolbarDivider />

        <ToolbarButton icon={<HelpCircle size={16} />} label="Help" onClick={toggleLegendPanel} />
        <ToolbarButton icon={<Save size={16} />} label="Save" onClick={handleSave} />
        <ToolbarButton icon={<FolderOpen size={16} />} label="Load" onClick={handleLoad} />
        <ToolbarButton icon={<Upload size={16} />} label="Import" onClick={handleImportSubgraph} />
        <ToolbarButton
          icon={<Timer size={16} />}
          label={autoSaveEnabled ? 'Auto-save On' : 'Auto-save'}
          onClick={toggleAutoSave}
          active={autoSaveEnabled}
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={scrollDirection === 'horizontal'
            ? <ArrowRightLeft size={16} />
            : <ArrowUpDown size={16} />}
          label={scrollDirection === 'horizontal' ? 'Horizontal' : 'Vertical'}
          onClick={handleScrollToggle}
        />

        <ToolbarButton
          icon={<Magnet size={16} />}
          label={snapToGrid ? 'Snap On' : 'Snap to Grid'}
          onClick={toggleSnapToGrid}
          active={snapToGrid}
        />

        <ToolbarButton
          icon={canvasBackground === 'dots'
            ? <Grip size={16} />
            : canvasBackground === 'grid'
              ? <Grid3X3 size={16} />
              : <Square size={16} />}
          label={`Background: ${canvasBackground}`}
          onClick={cycleCanvasBackground}
        />

        <ToolbarButton
          icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={handleThemeToggle}
        />
      </div>
    </div>
  )
}

function ToolbarDivider() {
  return (
    <div
      className="shrink-0 w-[2px] h-5 mx-1 rounded-full"
      style={{ background: 'var(--color-surface-glass-border)' }}
    />
  )
}

function ToolbarButton({
  icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        transition-all duration-100
        ${disabled
          ? 'text-text-muted opacity-40 cursor-default'
          : active
            ? 'text-status-modified bg-status-modified/10 hover:bg-status-modified/15 active:scale-[0.97] cursor-pointer'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass active:scale-[0.97] cursor-pointer'}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
