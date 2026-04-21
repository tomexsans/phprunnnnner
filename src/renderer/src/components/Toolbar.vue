<template>
  <div class="flex items-center gap-3 px-4 py-2 bg-surface-50 border-b border-border">
    <!-- Run button -->
    <button
      class="run-btn"
      :disabled="isRunning"
      title="Run (Ctrl+Enter)"
      @click="run"
    >
      <template v-if="isRunning">
        <svg class="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="2" stroke-dasharray="10 10" />
        </svg>
        <span>Running…</span>
      </template>
      <template v-else>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2L12 7L3 12V2Z" fill="currentColor" />
        </svg>
        <span>Run</span>
      </template>
    </button>

    <div class="w-px h-5 bg-border" />

    <!-- Connection selector -->
    <div class="flex items-center gap-2">
      <div class="w-2 h-2 rounded-full bg-accent-green" />
      <select
        v-model="activeConnectionId"
        class="bg-transparent text-sm text-white/70 border-none outline-none cursor-pointer"
      >
        <option
          v-for="conn in connections"
          :key="conn.id"
          :value="conn.id"
          class="bg-surface-50"
        >
          {{ conn.name }}
        </option>
      </select>
    </div>

    <!-- Spacer -->
    <div class="ml-auto flex items-center gap-2">
      <span v-if="phpVersion" class="text-xs text-white/30 font-mono">PHP {{ phpVersion }}</span>

      <!-- Saved files -->
      <button
        class="icon-btn"
        title="Saved files"
        @click="openSavedFiles"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="1" width="11" height="16" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
          <path d="M16 5v10a1.5 1.5 0 0 1-1.5 1.5H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          <path d="M5 5.5h6M5 8.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Settings gear -->
      <button
        class="icon-btn"
        title="Settings (Ctrl+,)"
        @click="openSettings"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
            stroke="currentColor" stroke-width="1.4"
          />
          <path
            d="M16.2 7.6a6.5 6.5 0 0 0 .3-1.5l-1.8-1a6 6 0 0 0-.7-1.2l.5-2A7 7 0 0 0 12 1l-1.6 1h-.8L8 1a7 7 0 0 0-2.5 1l.5 2a6 6 0 0 0-.7 1.2l-1.8 1a7 7 0 0 0 0 3.6l1.8 1c.2.4.4.8.7 1.2l-.5 2a7 7 0 0 0 2.5 1l1.6-1h.8l1.6 1a7 7 0 0 0 2.5-1l-.5-2c.3-.4.5-.8.7-1.2l1.8-1a7 7 0 0 0-.5-2.2Z"
            stroke="currentColor" stroke-width="1.4"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'

const emit = defineEmits<{ run: [] }>()

const editorStore = useEditorStore()
const { isRunning } = storeToRefs(editorStore)
const { openSavedFiles } = editorStore

const settingsStore = useSettingsStore()
const { connections, activeConnectionId, phpVersion } = storeToRefs(settingsStore)
const { openSettings } = settingsStore

function run(): void {
  emit('run')
}

function onKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key === ',') {
    e.preventDefault()
    openSettings()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.run-btn {
  @apply flex items-center gap-2 px-4 py-1.5 rounded-md font-medium text-sm
         bg-accent-purple text-surface transition-all
         hover:bg-accent-purple/80 active:scale-95
         disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100;
}

.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded text-white/40
         hover:text-white/80 hover:bg-surface-200 transition-colors;
}
</style>
