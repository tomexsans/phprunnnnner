<template>
  <div class="flex flex-col h-screen bg-surface text-white overflow-hidden">
    <TitleBar />
    <TabBar />
    <Toolbar @run="handleRun" @toggle-terminal="toggleTerminal" />
    <SettingsPanel />
    <SavedFilesPanel />
    <SaveNameDialog v-model="saveDialogOpen" @confirm="onSaveNameConfirmed" />

    <!-- Content area: editor+output stacked above terminal -->
    <div class="flex flex-col flex-1 overflow-hidden">

      <!-- Editor + Output (horizontal split) -->
      <div ref="workspaceRef" class="flex flex-1 overflow-hidden min-h-0">
        <!-- Editor pane -->
        <div class="flex-1 overflow-hidden min-w-0">
          <MonacoEditor
            v-if="activeTab"
            :key="activeTab.id"
            v-model="activeTab.code"
            :font-size="settings.fontSize"
            :tab-size="settings.tabSize"
            :word-wrap="settings.wordWrap"
            @update:model-value="onCodeChange"
            @run="handleRun"
            @save="handleSave"
          />
        </div>

        <!-- Horizontal drag handle -->
        <div
          class="split-handle"
          :class="{ 'split-handle--active': isDragging }"
          @mousedown="onDragStart"
        />

        <!-- Output pane -->
        <div
          class="shrink-0 overflow-hidden"
          :style="{ width: outputWidth + 'px' }"
        >
          <OutputPanel />
        </div>
      </div>

      <!-- Terminal panel -->
      <div
        v-if="isTerminalOpen"
        class="flex flex-col shrink-0 border-t border-border"
        :style="{ height: terminalHeight + 'px' }"
      >
        <!-- Resize handle (drag up/down) -->
        <div
          class="terminal-resize-handle"
          :class="{ 'terminal-resize-handle--active': isTerminalDragging }"
          @mousedown="onTerminalDragStart"
        />

        <!-- Terminal header -->
        <div class="flex items-center justify-between px-3 py-1 bg-surface-50 border-b border-border shrink-0">
          <span class="text-xs text-white/40 font-mono uppercase tracking-wider">Terminal</span>
          <button
            class="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-surface-200 transition-colors"
            title="Close terminal"
            @click="toggleTerminal"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- xterm.js -->
        <div class="flex-1 overflow-hidden">
          <TerminalPanel />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SaveNameDialog from '@/components/SaveNameDialog.vue'
import { storeToRefs } from 'pinia'
import TitleBar from '@/components/TitleBar.vue'
import TabBar from '@/components/TabBar.vue'
import Toolbar from '@/components/Toolbar.vue'
import MonacoEditor from '@/components/MonacoEditor.vue'
import OutputPanel from '@/components/OutputPanel.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import SavedFilesPanel from '@/components/SavedFilesPanel.vue'
import TerminalPanel from '@/components/TerminalPanel.vue'
import { useEditorStore } from '@/stores/editor'
import { useSettingsStore } from '@/stores/settings'
import { useSplitPane } from '@/composables/useSplitPane'

// ── Terminal panel state ───────────────────────────────────────────────────
const isTerminalOpen      = ref(false)
const terminalHeight      = ref(240)
const isTerminalDragging  = ref(false)
let   terminalDragStartY  = 0
let   terminalDragStartH  = 0

function toggleTerminal(): void {
  isTerminalOpen.value = !isTerminalOpen.value
}

function onTerminalDragStart(e: MouseEvent): void {
  e.preventDefault()
  isTerminalDragging.value = true
  terminalDragStartY = e.clientY
  terminalDragStartH = terminalHeight.value
  document.body.style.cursor    = 'row-resize'
  document.body.style.userSelect = 'none'
}

function onTerminalDragMove(e: MouseEvent): void {
  if (!isTerminalDragging.value) return
  const delta = terminalDragStartY - e.clientY   // drag up → taller
  terminalHeight.value = Math.max(100, Math.min(600, terminalDragStartH + delta))
}

function onTerminalDragEnd(): void {
  if (!isTerminalDragging.value) return
  isTerminalDragging.value = false
  document.body.style.cursor    = ''
  document.body.style.userSelect = ''
}

const editorStore = useEditorStore()
const { activeTab } = storeToRefs(editorStore)

const settingsStore = useSettingsStore()
const { connections, activeConnectionId } = storeToRefs(settingsStore)
const { settings } = storeToRefs(settingsStore)

const workspaceRef = ref<HTMLElement | null>(null)
const { outputWidth, isDragging, onDragStart } = useSplitPane(workspaceRef)

const saveDialogOpen = ref(false)

function isUntitled(title: string): boolean {
  return /^Untitled\s*\d*$/i.test(title.trim())
}

function onCodeChange(code: string): void {
  if (activeTab.value) {
    editorStore.updateTabCode(activeTab.value.id, code)
  }
}

async function handleSave(): Promise<void> {
  if (!activeTab.value) return
  if (isUntitled(activeTab.value.title)) {
    saveDialogOpen.value = true
  } else {
    await editorStore.saveFile(activeTab.value.title)
  }
}

async function onSaveNameConfirmed(name: string): Promise<void> {
  if (!activeTab.value) return
  editorStore.renameTab(activeTab.value.id, name)
  await editorStore.saveFile(name)
}

const SHELL_RE = /\b(exec|shell_exec|system|passthru|popen|proc_open|pcntl_exec)\s*\(|`/

async function handleRun(): Promise<void> {
  if (!activeTab.value || editorStore.isRunning) return

  const tab  = activeTab.value
  const code = tab.code

  if (SHELL_RE.test(code)) {
    const ok = await window.electronAPI.dialog.confirm(
      'This code contains shell execution functions.',
      'exec(), shell_exec(), system(), passthru(), popen(), proc_open(), pcntl_exec(), or backtick operators can run arbitrary system commands with your user permissions.\n\nContinue?'
    )
    if (!ok) return
  }

  // Resolve connection: tab override → global active → first connection
  const connId     = tab.connectionId ?? activeConnectionId.value
  const connection = connections.value.find((c) => c.id === connId) ?? settingsStore.activeConnection()

  // Resolve binary: tab override → connection binary → global default
  const phpBinary   = tab.phpBinary || connection.phpBinary || settingsStore.settings.phpBinary
  const timeout     = settingsStore.settings.executionTimeout * 1000
  const laravelPath = connection.type === 'laravel' ? connection.projectPath : undefined

  editorStore.setRunning(true)
  editorStore.setResult(null)

  try {
    const result = await window.electronAPI.php.run({ code, phpBinary, timeout, laravelPath })
    editorStore.setResult(result)
  } catch (err) {
    editorStore.setResult({
      output: '',
      error: String(err),
      exitCode: 1,
      executionTime: 0
    })
  } finally {
    editorStore.setRunning(false)
  }
}

function onGlobalKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '`') {
    e.preventDefault()
    toggleTerminal()
  }
}

onMounted(async () => {
  await settingsStore.load()
  await settingsStore.detectPhp()
  await editorStore.loadTabs()
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('mousemove', onTerminalDragMove)
  window.addEventListener('mouseup', onTerminalDragEnd)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('mousemove', onTerminalDragMove)
  window.removeEventListener('mouseup', onTerminalDragEnd)
})
</script>

<style scoped>
.split-handle {
  @apply w-1 shrink-0 bg-border cursor-col-resize transition-colors hover:bg-accent-purple/60;
}
.split-handle--active {
  @apply bg-accent-purple/80;
}

.terminal-resize-handle {
  @apply h-1 shrink-0 bg-border cursor-row-resize transition-colors hover:bg-accent-purple/60;
}
.terminal-resize-handle--active {
  @apply bg-accent-purple/80;
}
</style>
