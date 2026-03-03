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
} from 'lucide-react'
import { useUIStore } from '@/application/ui-store'
import { useGraphStore } from '@/application/graph-store'
import { useSessionStore } from '@/application/session-store'
import { useHistoryStore } from '@/application/history-store'
import { applyTheme } from '@/infrastructure/theme'
import { saveCampaignAction, loadCampaignAction } from '@/application/campaign-actions'
import { SceneTypePicker } from './scene-type-picker'
import { SessionSelector } from './session-selector'

export function Toolbar() {
  const [showPicker, setShowPicker] = useState(false)
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const scrollDirection = useGraphStore((s) => s.scrollDirection)
  const setScrollDirection = useGraphStore((s) => s.setScrollDirection)
  const toggleEntitySidebar = useUIStore((s) => s.toggleEntitySidebar)
  const toggleLegendPanel = useUIStore((s) => s.toggleLegendPanel)
  const toggleSearchPanel = useUIStore((s) => s.toggleSearchPanel)
  const diffOverlayActive = useSessionStore((s) => s.diffOverlayActive)
  const toggleDiffOverlay = useSessionStore((s) => s.toggleDiffOverlay)
  const canUndo = useHistoryStore((s) => s.past.length > 0)
  const canRedo = useHistoryStore((s) => s.future.length > 0)
  const undo = useGraphStore((s) => s.undo)
  const redo = useGraphStore((s) => s.redo)
  const autoSaveEnabled = useUIStore((s) => s.autoSaveEnabled)
  const toggleAutoSave = useUIStore((s) => s.toggleAutoSave)

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

  return (
    <div className="relative z-10 flex items-center gap-1 px-3 py-2 glass-panel border-b border-border">
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

        <div className="w-px h-5 bg-border mx-1" />

        <SessionSelector />
        <ToolbarButton
          icon={diffOverlayActive ? <EyeOff size={16} /> : <Eye size={16} />}
          label={diffOverlayActive ? 'Hide Diff' : 'Show Diff'}
          onClick={toggleDiffOverlay}
          active={diffOverlayActive}
        />

        <div className="w-px h-5 bg-border mx-1" />

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
        <ToolbarButton icon={<HelpCircle size={16} />} label="Legend" onClick={toggleLegendPanel} />

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton icon={<Save size={16} />} label="Save" onClick={handleSave} />
        <ToolbarButton icon={<FolderOpen size={16} />} label="Load" onClick={handleLoad} />
        <ToolbarButton
          icon={<Timer size={16} />}
          label={autoSaveEnabled ? 'Auto-save On' : 'Auto-save'}
          onClick={toggleAutoSave}
          active={autoSaveEnabled}
        />

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          icon={scrollDirection === 'horizontal'
            ? <ArrowRightLeft size={16} />
            : <ArrowUpDown size={16} />}
          label={scrollDirection === 'horizontal' ? 'Horizontal' : 'Vertical'}
          onClick={handleScrollToggle}
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
