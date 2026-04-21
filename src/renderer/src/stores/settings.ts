import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { AppSettings, Connection } from '@/types'

const defaults: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  phpBinary: 'php',
  executionTimeout: 30
}

export const useSettingsStore = defineStore('settings', () => {
  const settings           = ref<AppSettings>({ ...defaults })
  const connections        = ref<Connection[]>([{ id: 'local', name: 'Local PHP', type: 'local' }])
  const activeConnectionId = ref<string>('local')
  const phpVersion         = ref<string | null>(null)
  const isSettingsOpen     = ref(false)

  function openSettings():  void { isSettingsOpen.value = true  }
  function closeSettings(): void { isSettingsOpen.value = false }

  async function load(): Promise<void> {
    const [storedSettings, storedConnections, storedConnectionId] = await Promise.all([
      window.electronAPI.store.get('settings')           as Promise<AppSettings>,
      window.electronAPI.store.get('connections')        as Promise<Connection[]>,
      window.electronAPI.store.get('activeConnectionId') as Promise<string>
    ])

    if (storedSettings) {
      settings.value = { ...defaults, ...storedSettings }
    }

    if (storedConnections?.length) {
      const hasLocal = storedConnections.some((c) => c.id === 'local')
      connections.value = hasLocal
        ? storedConnections
        : [{ id: 'local', name: 'Local PHP', type: 'local' }, ...storedConnections]
    }

    if (storedConnectionId) {
      const exists = connections.value.some((c) => c.id === storedConnectionId)
      activeConnectionId.value = exists ? storedConnectionId : 'local'
    }
  }

  async function save(): Promise<void> {
    // JSON round-trip strips Vue's reactive Proxy so contextBridge structured-clone works correctly
    const plainSettings    = JSON.parse(JSON.stringify(settings.value))
    const plainConnections = JSON.parse(JSON.stringify(connections.value))

    await Promise.all([
      window.electronAPI.store.set('settings',           plainSettings),
      window.electronAPI.store.set('connections',        plainConnections),
      window.electronAPI.store.set('activeConnectionId', activeConnectionId.value)
    ])
  }

  function effectiveBinary(): string {
    const conn = activeConnection()
    return conn.phpBinary || settings.value.phpBinary
  }

  async function detectPhp(binary?: string): Promise<void> {
    const bin = binary ?? effectiveBinary()
    const result = await window.electronAPI.php.detect(bin)
    if (!result) {
      phpVersion.value = null
      return
    }
    phpVersion.value = result.version
    if (!binary && settings.value.phpBinary === defaults.phpBinary) {
      settings.value.phpBinary = result.binary
    }
  }

  watch(activeConnectionId, () => detectPhp())

  const activeConnection = () =>
    connections.value.find((c) => c.id === activeConnectionId.value) ?? connections.value[0]

  return {
    settings,
    connections,
    activeConnectionId,
    phpVersion,
    isSettingsOpen,
    openSettings,
    closeSettings,
    activeConnection,
    load,
    save,
    detectPhp
  }
})
