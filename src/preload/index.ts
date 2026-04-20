import { contextBridge, ipcRenderer } from 'electron'

const api = {
  php: {
    run: (options: { code: string; phpBinary?: string; timeout?: number; laravelPath?: string }) =>
      ipcRenderer.invoke('php:run', options),
    detect: () => ipcRenderer.invoke('php:detect')
  },
  laravel: {
    validate: (projectPath: string) => ipcRenderer.invoke('laravel:validate', projectPath)
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory')
  },
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
    getAll: () => ipcRenderer.invoke('store:getAll')
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close:    () => ipcRenderer.send('window:close'),
    onMaximized: (callback: (maximized: boolean) => void) => {
      ipcRenderer.on('window:maximized', (_event, maximized) => callback(maximized))
    },
    removeMaximizedListener: () => {
      ipcRenderer.removeAllListeners('window:maximized')
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)
