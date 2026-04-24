import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:openDirectory', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Select Laravel Project',
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:confirm', async (_event, message: string, detail: string): Promise<boolean> => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const { response } = await dialog.showMessageBox(win, {
      type: 'warning',
      buttons: ['Cancel', 'Run anyway'],
      defaultId: 0,
      cancelId: 0,
      title: 'Potentially dangerous code',
      message,
      detail
    })
    return response === 1
  })

  ipcMain.handle('app:logoDataUrl', (): string | null => {
    const logoPath = join(app.getAppPath(), 'logo.png')
    if (!existsSync(logoPath)) return null
    const data = readFileSync(logoPath)
    return `data:image/png;base64,${data.toString('base64')}`
  })
}
