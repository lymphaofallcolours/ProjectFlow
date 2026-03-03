#!/usr/bin/env node

/**
 * Generate PWA icons from the source SVG.
 * Usage: node scripts/generate-icons.mjs
 * Requires: sharp (devDependency)
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('Error: sharp is not installed. Run: pnpm add -D sharp')
    process.exit(1)
  }

  const svgPath = resolve(__dirname, 'icon.svg')
  const publicDir = resolve(__dirname, '..', 'public')
  const svgBuffer = readFileSync(svgPath)

  const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ]

  for (const { name, size } of sizes) {
    const outPath = resolve(publicDir, name)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`Generated ${name} (${size}x${size})`)
  }

  console.log('Done!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
