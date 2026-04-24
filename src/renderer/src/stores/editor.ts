import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { EditorTab, PhpRunResult, SavedFile } from '@/types'

const DEFAULT_CODE = `<?php\n\n// Start typing your PHP code here\necho "Hello from PHPRunnnnner!";\n`

export const useEditorStore = defineStore('editor', () => {
  const tabs = ref<EditorTab[]>([
    {
      id: uuidv4(),
      title: 'Untitled 1',
      code: DEFAULT_CODE,
      isDirty: false
    }
  ])
  const activeTabId = ref<string>(tabs.value[0].id)
  const isRunning = ref(false)
  const lastResult = ref<PhpRunResult | null>(null)
  const untitledCounter = ref(2)
  const savedFiles = ref<SavedFile[]>([])
  const isSavedFilesOpen = ref(false)
  let _persistenceReady = false

  const activeTab = computed(() =>
    tabs.value.find((t) => t.id === activeTabId.value) ?? null
  )

  function addTab(): void {
    const tab: EditorTab = {
      id: uuidv4(),
      title: `Untitled ${untitledCounter.value++}`,
      code: DEFAULT_CODE,
      isDirty: false
    }
    tabs.value.push(tab)
    activeTabId.value = tab.id
  }

  function closeTab(id: string): void {
    const idx = tabs.value.findIndex((t) => t.id === id)
    if (idx === -1) return

    const tab = tabs.value[idx]
    const isLastTab = tabs.value.length === 1
    const isUntitled = /^Untitled\s*\d*$/i.test(tab.title.trim())
    if (isLastTab && isUntitled) return

    tabs.value.splice(idx, 1)

    // Clean up the tab's code file (fire and forget)
    window.electronAPI.files.deleteTab(id)

    if (tabs.value.length === 0) {
      addTab()
      return
    }

    if (activeTabId.value === id) {
      activeTabId.value = tabs.value[Math.max(0, idx - 1)].id
    }
  }

  function setActiveTab(id: string): void {
    activeTabId.value = id
  }

  function updateTabCode(id: string, code: string): void {
    const tab = tabs.value.find((t) => t.id === id)
    if (tab) {
      tab.code = code
      tab.isDirty = true
    }
  }

  function renameTab(id: string, title: string): void {
    const tab = tabs.value.find((t) => t.id === id)
    if (tab) tab.title = title
  }

  function setRunning(value: boolean): void {
    isRunning.value = value
  }

  function setResult(result: PhpRunResult | null): void {
    lastResult.value = result
  }

  async function saveTabs(): Promise<void> {
    const persisted = await Promise.all(
      tabs.value.map(async ({ id, title, code }) => {
        const filePath = await window.electronAPI.files.writeTab(id, code)
        return { id, title, filePath }
      })
    )
    await window.electronAPI.store.set('tabs', persisted)
    await window.electronAPI.store.set('activeTabId', activeTabId.value)
    await window.electronAPI.store.set('untitledCounter', untitledCounter.value)
  }

  function openSavedFiles():  void { isSavedFilesOpen.value = true  }
  function closeSavedFiles(): void { isSavedFilesOpen.value = false }

  async function saveFile(name: string): Promise<void> {
    if (!activeTab.value) return
    const cleanName = name.trim() || activeTab.value.title
    const code = activeTab.value.code
    const existing = savedFiles.value.find((f) => f.name === cleanName)
    if (existing) {
      await window.electronAPI.files.writeSnippet(existing.id, code)
      existing.savedAt = new Date().toISOString()
    } else {
      const id = uuidv4()
      const filePath = await window.electronAPI.files.writeSnippet(id, code)
      savedFiles.value.unshift({ id, name: cleanName, filePath, savedAt: new Date().toISOString() })
    }
    activeTab.value.isDirty = false
    await window.electronAPI.store.set('savedFiles', JSON.parse(JSON.stringify(savedFiles.value)))
  }

  async function renameFile(id: string, newName: string): Promise<void> {
    const file = savedFiles.value.find((f) => f.id === id)
    if (file && newName.trim()) {
      file.name = newName.trim()
      await window.electronAPI.store.set('savedFiles', JSON.parse(JSON.stringify(savedFiles.value)))
    }
  }

  async function deleteSavedFile(id: string): Promise<void> {
    const file = savedFiles.value.find((f) => f.id === id)
    if (file) await window.electronAPI.files.delete(file.filePath)
    savedFiles.value = savedFiles.value.filter((f) => f.id !== id)
    await window.electronAPI.store.set('savedFiles', JSON.parse(JSON.stringify(savedFiles.value)))
  }

  async function openSavedFile(file: SavedFile): Promise<void> {
    const code = await window.electronAPI.files.read(file.filePath)
    const tab: EditorTab = {
      id: uuidv4(),
      title: file.name,
      code,
      isDirty: false
    }
    tabs.value.push(tab)
    activeTabId.value = tab.id
  }

  async function loadTabs(): Promise<void> {
    // RawTab covers both the new format (filePath) and the old format (code) for migration
    type RawTab = { id: string; title: string; filePath?: string; code?: string }
    const saved      = await window.electronAPI.store.get('tabs')        as RawTab[] | undefined
    const savedActiveId = await window.electronAPI.store.get('activeTabId')  as string | undefined
    const savedCounter  = await window.electronAPI.store.get('untitledCounter') as number | undefined

    if (saved && saved.length > 0) {
      const loaded = await Promise.all(
        saved.map(async (t) => {
          let code = ''
          if (t.filePath) {
            code = await window.electronAPI.files.read(t.filePath)
          } else if (t.code) {
            // Migration: old format stored code inline in the JSON
            code = t.code
          }
          return { id: t.id, title: t.title, code, isDirty: false }
        })
      )
      tabs.value = loaded
      activeTabId.value = loaded.find((t) => t.id === savedActiveId) ? savedActiveId! : loaded[0].id
      if (savedCounter) untitledCounter.value = savedCounter
    }

    // RawSavedFile covers both formats too
    type RawSavedFile = { id: string; name: string; savedAt: string; filePath?: string; code?: string }
    const storedFiles = await window.electronAPI.store.get('savedFiles') as RawSavedFile[] | undefined
    if (storedFiles) {
      // Migrate any old entries that have inline code instead of a filePath
      const migrated = await Promise.all(
        storedFiles.map(async (f) => {
          if (f.filePath) return f as SavedFile
          // Write the inline code to disk and update the record
          const filePath = await window.electronAPI.files.writeSnippet(f.id, f.code ?? '')
          return { id: f.id, name: f.name, filePath, savedAt: f.savedAt } satisfies SavedFile
        })
      )
      savedFiles.value = migrated
      // Persist migrated records so the old inline code is gone from the JSON
      await window.electronAPI.store.set('savedFiles', JSON.parse(JSON.stringify(migrated)))
    }

    _persistenceReady = true

    watch(
      [tabs, activeTabId],
      () => { if (_persistenceReady) saveTabs() },
      { deep: true }
    )
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    isRunning,
    lastResult,
    addTab,
    closeTab,
    setActiveTab,
    updateTabCode,
    renameTab,
    setRunning,
    setResult,
    saveTabs,
    loadTabs,
    savedFiles,
    isSavedFilesOpen,
    openSavedFiles,
    closeSavedFiles,
    saveFile,
    renameFile,
    deleteSavedFile,
    openSavedFile
  }
})
