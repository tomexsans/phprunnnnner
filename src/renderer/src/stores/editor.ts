import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { EditorTab, PhpRunResult } from '@/types'

const DEFAULT_CODE = `<?php\n\n// Start typing your PHP code here\necho "Hello from TinkerwellClone!";\n`

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

    tabs.value.splice(idx, 1)

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

  function setRunning(value: boolean): void {
    isRunning.value = value
  }

  function setResult(result: PhpRunResult | null): void {
    lastResult.value = result
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
    setRunning,
    setResult
  }
})
