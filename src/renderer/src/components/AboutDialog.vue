<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="bg-surface border border-border rounded-2xl shadow-2xl w-[420px] flex flex-col items-center gap-5 p-10">

          <!-- Logo -->
          <img
            v-if="logoSrc"
            :src="logoSrc"
            alt="PHPRunnnnner"
            class="w-52 select-none"
            draggable="false"
          />
          <div v-else class="text-3xl font-bold text-white tracking-tight">PHPRunnnnner</div>

          <!-- Version badge -->
          <span class="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple border border-accent-purple/20">
            v0.1.0
          </span>

          <!-- Description -->
          <p class="text-sm text-white/50 text-center leading-relaxed max-w-xs">
            A free, open-source Tinkerwell-inspired PHP code runner.
            Run and inspect PHP code interactively against your local PHP
            installation or a full Laravel application.
          </p>

          <div class="w-full border-t border-border" />

          <!-- Author -->
          <div class="flex flex-col items-center gap-1">
            <span class="text-xs text-white/30 uppercase tracking-widest">Author</span>
            <a
              href="https://github.com/tomexsans"
              class="text-sm font-semibold text-accent-purple hover:text-accent-purple/80 transition-colors"
              @click.prevent="openGitHub"
            >tomexsans</a>
          </div>

          <!-- Footer row -->
          <div class="flex items-center gap-4 text-xs text-white/25 font-mono">
            <span>MIT License</span>
            <span>·</span>
            <button
              class="hover:text-white/50 transition-colors"
              @click="openRepo"
            >github.com/tomexsans/phprunnnnner</button>
          </div>

          <!-- Close -->
          <button
            class="mt-1 px-6 py-1.5 rounded-lg text-sm bg-surface-50 border border-border text-white/60
                   hover:text-white/90 hover:border-accent-purple/40 transition-colors"
            @click="$emit('update:modelValue', false)"
          >
            Close
          </button>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()

const logoSrc = ref<string | null>(null)

watch(() => props.modelValue, async (open) => {
  if (open && !logoSrc.value) {
    logoSrc.value = await window.electronAPI.app.logoDataUrl()
  }
}, { immediate: true })

function openGitHub(): void {
  window.open('https://github.com/tomexsans')
}

function openRepo(): void {
  window.open('https://github.com/tomexsans/phprunnnnner')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
