import { Toolbar } from './toolbar'
import { StatusBar } from './status-bar'
import { GraphCanvas } from '@/ui/graph/graph-canvas'
import { OverlayRoot } from '@/ui/overlays/overlay-root'
import { PeripheralView } from '@/ui/overlays/peripheral-view'
import { EntitySidebar } from '@/ui/entities/entity-sidebar'
import { HelpPanel } from '@/ui/components/help-panel'
import { SearchPanel } from '@/ui/components/search-panel'
import { SessionTimeline } from '@/ui/components/session-timeline'
import { TemplateManager } from '@/ui/components/template-manager'
import { GraphTemplatePicker } from '@/ui/components/graph-template-picker'
import { EntityRelationshipGraph } from '@/ui/entities/entity-relationship-graph'
import { CampaignDashboard } from '@/ui/components/campaign-dashboard'
import { PWAInstallPrompt } from '@/ui/components/pwa-prompt'
import { useKeyboardShortcuts } from '@/ui/hooks/use-keyboard-shortcuts'
import { useAutoSave } from '@/ui/hooks/use-auto-save'

export function AppShell() {
  useKeyboardShortcuts()
  useAutoSave()

  return (
    <div className="flex flex-col h-screen bg-canvas text-text-primary overflow-hidden">
      <Toolbar />
      <main className="flex-1 relative overflow-hidden">
        <GraphCanvas />
        <OverlayRoot />
        <PeripheralView />
        <SearchPanel />
        <EntitySidebar />
        <TemplateManager />
        <GraphTemplatePicker />
        <SessionTimeline />
        <HelpPanel />
        <EntityRelationshipGraph />
        <CampaignDashboard />
      </main>
      <StatusBar />
      <PWAInstallPrompt />
    </div>
  )
}
