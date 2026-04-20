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
    <div class="ml-auto flex items-center gap-3">
      <span v-if="phpVersion" class="text-xs text-white/30 font-mono">PHP {{ phpVersion }}</span>

      <!-- Settings gear -->
      <button
        class="icon-btn"
        title="Settings (Ctrl+,)"
        @click="openSettings"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path
            d="M7.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
            stroke="currentColor" stroke-width="1.2"
          />
          <path
            d="M12.2 5.7c.1-.3.2-.7.2-1.1l-1.4-.8a5 5 0 0 0-.5-.9l.4-1.5A5.5 5.5 0 0 0 9 .7L7.8 1.5A5 5 0 0 0 7.5 1.5c-.1 0-.2 0-.3 0L6 .7a5.5 5.5 0 0 0-2 .7l.4 1.5c-.2.3-.4.6-.5.9L2.5 4.6a5.5 5.5 0 0 0 0 2.8l1.4.8c.1.3.3.6.5.9l-.4 1.5a5.5 5.5 0 0 0 2 .7l1.2-.8h.3c.1 0 .2 0 .3 0l1.2.8a5.5 5.5 0 0 0 2-.7l-.4-1.5c.2-.3.4-.6.5-.9l1.4-.8a5.5 5.5 0 0 0-.3-1.7Z"
            stroke="currentColor" stroke-width="1.2"
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
