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
} from 'lucide-react'
import { useUIStore } from '@/application/ui-store'
import { useGraphStore } from '@/application/graph-store'
import { useSessionStore } from '@/application/session-store'
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
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        active:scale-[0.97] transition-all duration-100 cursor-pointer
        ${active
          ? 'text-status-modified bg-status-modified/10 hover:bg-status-modified/15'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
