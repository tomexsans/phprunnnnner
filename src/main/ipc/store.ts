import { ipcMain } from 'electron'
import Store from 'electron-store'

export interface PersistedTab {
  id: string
  title: string
  code: string
}

export interface SavedFile {
  id: string
  name: string
  code: string
  savedAt: string
}

interface StoreSchema {
  snippets: Snippet[]
  connections: Connection[]
  activeConnectionId: string
  settings: AppSettings
  recentFiles: string[]
  tabs: PersistedTab[]
  activeTabId: string
  untitledCounter: number
  savedFiles: SavedFile[]
}

export interface Snippet {
  id: string
  name: string
  code: string
  createdAt: string
  updatedAt: string
}

export interface Connection {
  id: string
  name: string
  type: 'local' | 'ssh' | 'laravel'
  phpBinary?: string
  host?: string
  port?: number
  username?: string
  privateKeyPath?: string
  projectPath?: string
}

export interface AppSettings {
  theme: 'dark' | 'light'
  fontSize: number
  tabSize: number
  wordWrap: boolean
  phpBinary: string
  executionTimeout: number
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  phpBinary: 'php',
  executionTimeout: 30
}

const store = new Store<StoreSchema>({
  defaults: {
    snippets: [],
    connections: [
      {
        id: 'local',
        name: 'Local PHP',
        type: 'local'
      }
    ],
    activeConnectionId: 'local',
    settings: defaultSettings,
    recentFiles: [],
    tabs: [],
    activeTabId: '',
    untitledCounter: 2,
    savedFiles: []
  }
})

export function registerStoreHandlers(): void {
  ipcMain.handle('store:get', (_event, key: keyof StoreSchema) => {
    return store.get(key)
  })

  ipcMain.handle('store:set', (_event, key: keyof StoreSchema, value: unknown) => {
    store.set(key, value as StoreSchema[typeof key])
    return true
  })

  ipcMain.handle('store:getAll', () => {
    return store.store
  })
}
