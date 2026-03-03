// File System Access API type declarations (not yet in all TS lib versions)
type FileSystemAccessWindow = Window & {
  showSaveFilePicker: (options?: Record<string, unknown>) => Promise<FileSystemFileHandle>
  showOpenFilePicker: (options?: Record<string, unknown>) => Promise<FileSystemFileHandle[]>
}

function getFSWindow(): FileSystemAccessWindow {
  return window as unknown as FileSystemAccessWindow
}

export function supportsFileSystemAccess(): boolean {
  return 'showSaveFilePicker' in window
}

// Cached file handle for auto-save (avoids picker on subsequent saves)
let cachedFileHandle: FileSystemFileHandle | null = null

export function getCachedFileHandle(): FileSystemFileHandle | null {
  return cachedFileHandle
}

export function clearCachedFileHandle(): void {
  cachedFileHandle = null
}

export async function saveToFile(content: string, filename: string): Promise<void> {
  if (supportsFileSystemAccess()) {
    const handle = await getFSWindow().showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: 'ProjectFlow Campaign',
        accept: { 'application/json': ['.json'] },
      }],
    })
    cachedFileHandle = handle
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
  } else {
    saveWithDownload(content, filename)
  }
}

/**
 * Save silently using cached file handle (no picker).
 * Returns true on success, false if no cached handle or save fails.
 */
export async function saveToFileQuiet(content: string): Promise<boolean> {
  if (!cachedFileHandle) return false
  try {
    const writable = await cachedFileHandle.createWritable()
    await writable.write(content)
    await writable.close()
    return true
  } catch {
    return false
  }
}

export async function loadFromFile(): Promise<string | null> {
  if (supportsFileSystemAccess()) {
    try {
      const [handle] = await getFSWindow().showOpenFilePicker({
        types: [{
          description: 'ProjectFlow Campaign',
          accept: { 'application/json': ['.json'] },
        }],
      })
      cachedFileHandle = handle
      const file = await handle.getFile()
      return file.text()
    } catch {
      return null
    }
  }
  return loadWithFileInput()
}

function saveWithDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function loadWithFileInput(): Promise<string | null> {
  return loadWithFileInputAccept('.json')
}

function loadWithFileInputAccept(accept: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const text = await file.text()
      resolve(text)
    }

    input.oncancel = () => resolve(null)
    input.click()
  })
}

export async function saveSubgraphToFile(content: string, filename: string): Promise<void> {
  if (supportsFileSystemAccess()) {
    const handle = await getFSWindow().showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: 'ProjectFlow Subgraph',
        accept: { 'application/json': ['.pfsg.json', '.json'] },
      }],
    })
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
  } else {
    saveWithDownload(content, filename)
  }
}

export async function loadSubgraphFromFile(): Promise<string | null> {
  if (supportsFileSystemAccess()) {
    try {
      const [handle] = await getFSWindow().showOpenFilePicker({
        types: [{
          description: 'ProjectFlow Subgraph',
          accept: { 'application/json': ['.pfsg.json', '.json'] },
        }],
      })
      const file = await handle.getFile()
      return file.text()
    } catch {
      return null
    }
  }
  return loadWithFileInputAccept('.json,.pfsg.json')
}
