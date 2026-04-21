<template>
  <header
    class="title-bar flex items-center justify-between h-10 bg-surface-50 border-b border-border px-4 select-none"
    style="-webkit-app-region: drag"
  >
    <!-- App identity -->
    <div class="flex items-center gap-2" style="-webkit-app-region: no-drag">
      <div class="w-4 h-4 rounded-full bg-accent-purple opacity-80" />
      <span class="text-sm font-medium text-white/70">PHPRunnnnner</span>
    </div>

    <!-- PHP version badge -->
    <div v-if="phpVersion" class="text-xs text-white/40 font-mono">
      PHP {{ phpVersion }}
    </div>

    <!-- Window controls (Linux/Windows style) -->
    <div class="flex items-center gap-1" style="-webkit-app-region: no-drag">
      <button
        class="wc-btn hover:bg-surface-200"
        title="Minimize"
        @click="minimize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect y="5.5" width="12" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        class="wc-btn hover:bg-surface-200"
        title="Maximize"
        @click="maximize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="0.5" y="0.5" width="11" height="11" stroke="currentColor" />
        </svg>
      </button>
      <button
        class="wc-btn hover:bg-red-600"
        title="Close"
        @click="close"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const { phpVersion } = storeToRefs(settingsStore)

function minimize(): void {
  window.electronAPI.window.minimize()
}
function maximize(): void {
  window.electronAPI.window.maximize()
}
function close(): void {
  window.electronAPI.window.close()
}
</script>

<style scoped>
.wc-btn {
  @apply w-8 h-8 flex items-center justify-center rounded text-white/50 transition-colors;
}
</style>
