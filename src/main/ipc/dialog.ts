import { ipcMain, dialog } from 'electron'

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:openDirectory', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Select Laravel Project',
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
