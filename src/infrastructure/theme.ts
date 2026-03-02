const THEME_STORAGE_KEY = 'projectflow-theme'

export function getStoredTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return getSystemTheme()
}

export function getSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

export function applyTheme(theme: 'light' | 'dark'): void {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}
