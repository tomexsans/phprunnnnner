<template>
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    class="shrink-0 text-white/30 transition-transform"
    :style="{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }"
    fill="none"
  >
    <path d="M3 2L7 5L3 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
</script>
