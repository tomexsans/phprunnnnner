<template>
  <div class="flex flex-col h-full bg-surface">
    <!-- Panel header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase tracking-wider text-white/40">Output</span>

        <template v-if="result">
          <span
            class="text-xs px-2 py-0.5 rounded-full font-mono"
            :class="result.exitCode === 0 ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'"
          >
            {{ result.exitCode === 0 ? 'OK' : 'Error' }}
          </span>
          <span class="text-xs text-white/30 font-mono">{{ result.executionTime }}ms</span>
        </template>
      </div>

      <button
        v-if="result"
        class="text-xs text-white/40 hover:text-white/70 transition-colors"
        @click="clear"
      >
        Clear
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-4 text-sm space-y-2 scrollbar-thin">
      <!-- Running -->
      <div v-if="isRunning" class="flex items-center gap-2 text-accent-blue animate-pulse">
        <div class="w-2 h-2 rounded-full bg-accent-blue" />
        <span class="font-mono">Running…</span>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!result"
        class="h-full flex flex-col items-center justify-center text-white/20 gap-2"
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" class="opacity-30">
          <path d="M8 16L16 24L8 32" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M20 32H40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>Press <kbd class="kbd">Ctrl+Enter</kbd> to run</p>
      </div>

      <template v-else>
        <!-- Stdout segments -->
        <template v-if="segments.length">
          <template v-for="(seg, i) in segments" :key="i">
            <!-- Plain text -->
            <pre
              v-if="seg.kind === 'text'"
              class="text-white/90 whitespace-pre-wrap break-words leading-relaxed font-mono text-sm"
            >{{ seg.content }}</pre>

            <!-- Pretty dump -->
            <div v-else class="dump-block">
              <DumpNode :value="seg.value" :depth="0" />
            </div>
          </template>
        </template>

        <!-- Stderr -->
        <div v-if="result.error" class="rounded-lg bg-accent-red/10 border border-accent-red/20 p-4">
          <div class="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 12H1L7 1Z" stroke="#f38ba8" stroke-width="1.2"/>
              <path d="M7 5.5V8" stroke="#f38ba8" stroke-width="1.2" stroke-linecap="round"/>
              <circle cx="7" cy="10" r="0.7" fill="#f38ba8"/>
            </svg>
            <span class="text-xs font-semibold text-accent-red uppercase tracking-wider">Error</span>
          </div>
          <pre class="text-accent-red/90 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">{{ result.error }}</pre>
        </div>

        <!-- No output at all -->
        <div
          v-if="!result.output && !result.error"
          class="text-white/30 italic font-mono"
        >
          (no output)
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { parseOutput } from '@/composables/useOutputParser'
import DumpNode from './DumpNode.vue'

const editorStore = useEditorStore()
const { isRunning, lastResult: result } = storeToRefs(editorStore)

const segments = computed(() =>
  result.value?.output ? parseOutput(result.value.output) : []
)

function clear(): void {
  editorStore.setResult(null)
}
</script>

<style scoped>
kbd.kbd {
  @apply text-xs bg-surface-50 border border-border px-1.5 py-0.5 rounded font-mono text-white/60;
}

.dump-block {
  @apply rounded-lg bg-surface-50 border border-border px-4 py-3 font-mono text-sm leading-relaxed;
}
</style>
