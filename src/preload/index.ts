import { contextBridge, ipcRenderer } from 'electron'

const api = {
  php: {
    run: (options: { code: string; phpBinary?: string; timeout?: number; laravelPath?: string }) =>
      ipcRenderer.invoke('php:run', options),
    detect: (binary?: string) => ipcRenderer.invoke('php:detect', binary)
  },
  laravel: {
    validate: (projectPath: string) => ipcRenderer.invoke('laravel:validate', projectPath)
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    confirm: (message: string, detail: string) => ipcRenderer.invoke('dialog:confirm', message, detail)
  },
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
    getAll: () => ipcRenderer.invoke('store:getAll')
  },
  terminal: {
    create:  (cols: number, rows: number) => ipcRenderer.invoke('terminal:create', cols, rows),
    input:   (data: string)               => ipcRenderer.send('terminal:input', data),
    resize:  (cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', cols, rows),
    destroy: ()                           => ipcRenderer.send('terminal:destroy'),
    onData:  (cb: (data: string) => void) => ipcRenderer.on('terminal:data', (_e, data) => cb(data)),
    onExit:  (cb: () => void)             => ipcRenderer.on('terminal:exit', () => cb()),
    offAll:  ()                           => {
      ipcRenderer.removeAllListeners('terminal:data')
      ipcRenderer.removeAllListeners('terminal:exit')
    }
  },
  files: {
    writeSnippet: (id: string, code: string) => ipcRenderer.invoke('files:writeSnippet', id, code),
    writeTab:     (id: string, code: string) => ipcRenderer.invoke('files:writeTab', id, code),
    read:         (filePath: string)         => ipcRenderer.invoke('files:read', filePath),
    delete:       (filePath: string)         => ipcRenderer.invoke('files:delete', filePath),
    deleteTab:    (id: string)               => ipcRenderer.invoke('files:deleteTab', id),
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
