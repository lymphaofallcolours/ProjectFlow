import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const publicDir = resolve(__dirname, '../../public')

// PNG magic bytes: 137 80 78 71 13 10 26 10
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe('PWA icon files (integration)', () => {
  const icons = [
    { name: 'pwa-192x192.png', minSize: 1000 },
    { name: 'pwa-512x512.png', minSize: 5000 },
    { name: 'apple-touch-icon.png', minSize: 1000 },
  ]

  for (const { name, minSize } of icons) {
    it(`${name} exists and is a valid PNG (not placeholder)`, () => {
      const iconPath = resolve(publicDir, name)
      expect(existsSync(iconPath)).toBe(true)

      const stat = statSync(iconPath)
      expect(stat.size).toBeGreaterThan(minSize)

      const buffer = readFileSync(iconPath)
      const header = buffer.subarray(0, 8)
      expect(Buffer.compare(header, PNG_MAGIC)).toBe(0)
    })
  }

  it('icon source SVG exists', () => {
    const svgPath = resolve(__dirname, '../../scripts/icon.svg')
    expect(existsSync(svgPath)).toBe(true)
    const content = readFileSync(svgPath, 'utf-8')
    expect(content).toContain('<svg')
    expect(content).toContain('PROJECTFLOW')
  })
})
