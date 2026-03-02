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

export async function saveToFile(content: string, filename: string): Promise<void> {
  if (supportsFileSystemAccess()) {
    await saveWithFileSystemAccess(content, filename)
  } else {
    saveWithDownload(content, filename)
  }
}

export async function loadFromFile(): Promise<string | null> {
  if (supportsFileSystemAccess()) {
    return loadWithFileSystemAccess()
  }
  return loadWithFileInput()
}

async function saveWithFileSystemAccess(content: string, filename: string): Promise<void> {
  const handle = await getFSWindow().showSaveFilePicker({
    suggestedName: filename,
    types: [{
      description: 'ProjectFlow Campaign',
      accept: { 'application/json': ['.json'] },
    }],
  })
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
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

async function loadWithFileSystemAccess(): Promise<string | null> {
  try {
    const [handle] = await getFSWindow().showOpenFilePicker({
      types: [{
        description: 'ProjectFlow Campaign',
        accept: { 'application/json': ['.json'] },
      }],
    })
    const file = await handle.getFile()
    return file.text()
  } catch {
    return null
  }
}

function loadWithFileInput(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

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
