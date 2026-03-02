import { AppShell } from '@/ui/layout/app-shell'
import { ThemeInitializer } from '@/ui/layout/theme-initializer'

export function App() {
  return (
    <>
      <ThemeInitializer />
      <AppShell />
    </>
  )
}
