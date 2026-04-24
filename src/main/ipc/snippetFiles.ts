import { ipcMain, app } from 'electron'
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function snippetsDir(): string {
  const dir = join(app.getPath('userData'), 'snippets')
  ensureDir(dir)
  return dir
}

function tabsDir(): string {
  const dir = join(app.getPath('userData'), 'tabs')
  ensureDir(dir)
  return dir
}

export function registerSnippetFileHandlers(): void {
  ipcMain.handle('files:writeSnippet', (_event, id: string, code: string): string => {
    const filePath = join(snippetsDir(), `${id}.php`)
    writeFileSync(filePath, code, 'utf-8')
    return filePath
  })

  ipcMain.handle('files:writeTab', (_event, id: string, code: string): string => {
    const filePath = join(tabsDir(), `${id}.php`)
    writeFileSync(filePath, code, 'utf-8')
    return filePath
  })

  ipcMain.handle('files:read', (_event, filePath: string): string => {
    try {
      return readFileSync(filePath, 'utf-8')
    } catch {
      return ''
    }
  })

  ipcMain.handle('files:delete', (_event, filePath: string): void => {
    try { unlinkSync(filePath) } catch { /* ignore */ }
  })

  // Deletes a tab file by ID — path is derived from userData so caller doesn't need to know it
  ipcMain.handle('files:deleteTab', (_event, id: string): void => {
    const filePath = join(tabsDir(), `${id}.php`)
    try { unlinkSync(filePath) } catch { /* ignore */ }
  })
}
