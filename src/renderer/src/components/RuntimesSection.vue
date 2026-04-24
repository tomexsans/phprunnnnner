<template>
  <div v-if="runtimes.length > 0" class="mt-3 space-y-1">
    <p class="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-2">Saved runtimes</p>
    <div
      v-for="rt in runtimes"
      :key="rt.id"
      class="runtime-row"
      :class="{ 'runtime-row--active': settings.phpBinary === rt.binary }"
      @click="activate(rt)"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span
          class="w-1.5 h-1.5 rounded-full shrink-0 transition-colors"
          :class="settings.phpBinary === rt.binary ? 'bg-accent-green' : 'bg-white/20'"
        />
        <div class="flex flex-col min-w-0">
          <span class="text-sm text-white/80 truncate">{{ rt.name }}</span>
          <span class="text-xs text-white/30 truncate font-mono">{{ rt.binary }}</span>
        </div>
      </div>
      <button
        class="icon-action text-white/20 hover:text-accent-red"
        title="Remove runtime"
        @click.stop="removeRuntime(rt.id)"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import type { PhpRuntime } from '@/types'

const store = useSettingsStore()
const { settings, runtimes } = storeToRefs(store)
const { removeRuntime } = store

function activate(rt: PhpRuntime): void {
  store.activateRuntime(rt)
}
</script>

<style scoped>
.runtime-row {
  @apply flex items-center justify-between gap-3 px-3 py-2 rounded-lg
         border border-transparent cursor-pointer
         hover:bg-surface-50 transition-colors;
}
.runtime-row--active {
  @apply border-accent-green/25 bg-accent-green/5;
}
.icon-action {
  @apply w-5 h-5 flex items-center justify-center rounded transition-colors;
}
</style>
