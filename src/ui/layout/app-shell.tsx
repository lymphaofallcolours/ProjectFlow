import { Toolbar } from './toolbar'
import { StatusBar } from './status-bar'
import { GraphCanvas } from '@/ui/graph/graph-canvas'
import { OverlayRoot } from '@/ui/overlays/overlay-root'
import { EntitySidebar } from '@/ui/entities/entity-sidebar'
import { LegendPanel } from '@/ui/components/legend-panel'
import { SearchPanel } from '@/ui/components/search-panel'
import { useKeyboardShortcuts } from '@/ui/hooks/use-keyboard-shortcuts'

export function AppShell() {
  useKeyboardShortcuts()

  return (
    <div className="flex flex-col h-screen bg-canvas text-text-primary overflow-hidden">
      <Toolbar />
      <main className="flex-1 relative overflow-hidden">
        <GraphCanvas />
        <OverlayRoot />
        <SearchPanel />
        <EntitySidebar />
        <LegendPanel />
      </main>
      <StatusBar />
    </div>
  )
}
