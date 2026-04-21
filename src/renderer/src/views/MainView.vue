<template>
  <div class="flex flex-col h-screen bg-surface text-white overflow-hidden">
    <TitleBar />
    <TabBar />
    <Toolbar @run="handleRun" />
    <SettingsPanel />
    <SavedFilesPanel />
    <SaveNameDialog v-model="saveDialogOpen" @confirm="onSaveNameConfirmed" />

    <!-- Main workspace -->
    <div ref="workspaceRef" class="flex flex-1 overflow-hidden">
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

      <!-- Drag handle -->
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
import { useEditorStore } from '@/stores/editor'
import { useSettingsStore } from '@/stores/settings'
import { useSplitPane } from '@/composables/useSplitPane'

const editorStore = useEditorStore()
const { activeTab } = storeToRefs(editorStore)

const settingsStore = useSettingsStore()
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

async function handleRun(): Promise<void> {
  if (!activeTab.value || editorStore.isRunning) return

  const code        = activeTab.value.code
  const connection  = settingsStore.activeConnection()
  const phpBinary   = connection.phpBinary || settingsStore.settings.phpBinary
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
}

onMounted(async () => {
  await settingsStore.load()
  await settingsStore.detectPhp()
  await editorStore.loadTabs()
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<style scoped>
.split-handle {
  @apply w-1 shrink-0 bg-border cursor-col-resize transition-colors hover:bg-accent-purple/60;
}

.split-handle--active {
  @apply bg-accent-purple/80;
}
</style>
