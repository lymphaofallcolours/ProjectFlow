import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir = resolve(__dirname, '../../dist')

describe('PWA build output (integration)', () => {
  it('generates a web manifest', () => {
    const manifestPath = resolve(distDir, 'manifest.webmanifest')
    expect(existsSync(manifestPath)).toBe(true)
  })

  it('generates a service worker', () => {
    const swPath = resolve(distDir, 'sw.js')
    expect(existsSync(swPath)).toBe(true)
  })

  it('manifest has required PWA fields', () => {
    const manifestPath = resolve(distDir, 'manifest.webmanifest')
    const content = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(content)

    expect(manifest.name).toBe('ProjectFlow — Narrative Graph Editor')
    expect(manifest.short_name).toBe('ProjectFlow')
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBe('#0f1729')
    expect(manifest.icons).toBeInstanceOf(Array)
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)

    // At least one 192x192 and one 512x512 icon
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })
})
