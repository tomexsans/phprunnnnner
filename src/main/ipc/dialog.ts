import { ipcMain, dialog, BrowserWindow } from 'electron'

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
}
