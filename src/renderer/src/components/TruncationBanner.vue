<template>
  <div class="flex items-center gap-2 mt-1 ml-4 pl-3">
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" class="text-accent-yellow/70 shrink-0">
      <path d="M5.5 1L10 10H1L5.5 1Z" stroke="currentColor" stroke-width="1.1"/>
      <path d="M5.5 4.5V6.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
      <circle cx="5.5" cy="8.2" r="0.5" fill="currentColor"/>
    </svg>
    <span class="text-[11px] text-accent-yellow/70 font-mono">
      Showing {{ shown.toLocaleString() }} of {{ total.toLocaleString() }} {{ hint }} — use
      <code class="bg-surface-200 px-1 rounded">.take(10)</code> to limit results
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  shown: number
  total: number
  hint: string
}>()
</script>
