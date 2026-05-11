import { watch, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import * as monaco from 'monaco-editor'
import { useSettingsStore } from '@/stores/settings'
import type { CompletionEntry } from '@/types/electron'

const KIND_MAP: Record<string, monaco.languages.CompletionItemKind> = {
  function: monaco.languages.CompletionItemKind.Function,
  method:   monaco.languages.CompletionItemKind.Method,
  class:    monaco.languages.CompletionItemKind.Class,
  constant: monaco.languages.CompletionItemKind.Constant,
  variable: monaco.languages.CompletionItemKind.Variable,
  keyword:  monaco.languages.CompletionItemKind.Keyword,
  facade:   monaco.languages.CompletionItemKind.Module,
}

// Global singleton — registered once, shared across all editor instances
let providerDisposable: monaco.IDisposable | null = null
let instanceCount = 0

function ensureProvider(): void {
  if (providerDisposable) return

  providerDisposable = monaco.languages.registerCompletionItemProvider('php', {
    triggerCharacters: [':', '>', '$', '\\'],
    async provideCompletionItems(model, position) {
      const wordInfo   = model.getWordUntilPosition(position)
      const items: CompletionEntry[] = await window.electronAPI.lsp.complete(wordInfo.word)
      if (!items.length) return { suggestions: [] }

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber:   position.lineNumber,
        startColumn:     wordInfo.startColumn,
        endColumn:       wordInfo.endColumn,
      }

      return {
        suggestions: items.map(item => ({
          label:      item.label,
          kind:       KIND_MAP[item.kind] ?? monaco.languages.CompletionItemKind.Text,
          detail:     item.detail ?? '',
          insertText: item.insertText ?? item.label,
          range,
        })),
      }
    },
  })
}

export function usePhpCompletion(): void {
  const settingsStore = useSettingsStore()
  const { activeConnectionId, connections } = storeToRefs(settingsStore)

  ensureProvider()
  instanceCount++

  const stopWatch = watch(
    activeConnectionId,
    async (newId) => {
      const conn = connections.value.find(c => c.id === newId)
      if (conn?.type === 'laravel' && conn.projectPath) {
        await window.electronAPI.lsp.init(conn.projectPath)
      } else {
        await window.electronAPI.lsp.stop()
      }
    },
    { immediate: true }
  )

  window.electronAPI.lsp.onStatus((_status) => {
    // Reserved for future UI status indicator
  })

  onBeforeUnmount(() => {
    stopWatch()
    window.electronAPI.lsp.offStatus()
    instanceCount--
    if (instanceCount === 0) {
      providerDisposable?.dispose()
      providerDisposable = null
    }
  })
}
