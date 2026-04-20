<template>
  <div class="flex items-end bg-surface border-b border-border overflow-x-auto scrollbar-none">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-item"
      :class="{ 'tab-active': tab.id === activeTabId }"
      @click="setActiveTab(tab.id)"
    >
      <span class="truncate max-w-[140px] text-sm">{{ tab.title }}</span>
      <span v-if="tab.isDirty" class="w-1.5 h-1.5 rounded-full bg-accent-yellow ml-1 shrink-0" />
      <button
        class="tab-close ml-2 shrink-0"
        title="Close tab"
        @click.stop="closeTab(tab.id)"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>

    <!-- New tab button -->
    <button
      class="h-9 px-3 flex items-center text-white/40 hover:text-white/70 hover:bg-surface-50 transition-colors shrink-0"
      title="New tab"
      @click="addTab"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1V13M1 7H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { storeToRefs } from 'pinia'

const editorStore = useEditorStore()
const { tabs, activeTabId } = storeToRefs(editorStore)
const { addTab, closeTab, setActiveTab } = editorStore
</script>

<style scoped>
.tab-item {
  @apply relative flex items-center h-9 px-4 cursor-pointer border-r border-border
         text-white/50 hover:text-white/80 hover:bg-surface-50 transition-colors shrink-0;
}

.tab-active {
  @apply bg-surface-50 text-white border-t-2 border-t-accent-purple;
}

.tab-close {
  @apply flex items-center justify-center w-4 h-4 rounded text-white/30 hover:text-white/80 hover:bg-surface-200 transition-colors;
}
</style>
