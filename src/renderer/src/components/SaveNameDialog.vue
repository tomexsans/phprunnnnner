<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[60] flex items-center justify-center"
        @keydown.esc="cancel"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="cancel" />

        <!-- Dialog -->
        <div class="relative z-10 w-[340px] bg-surface border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-4">
          <div>
            <h3 class="text-sm font-semibold text-white/90">Name your file</h3>
            <p class="text-xs text-white/30 mt-1">Give this file a name before saving.</p>
          </div>

          <input
            ref="inputRef"
            v-model="name"
            class="save-input"
            placeholder="e.g. My Script"
            spellcheck="false"
            @keydown.enter="confirm"
            @keydown.esc="cancel"
          />

          <div class="flex justify-end gap-2">
            <button class="btn-cancel" @click="cancel">Cancel</button>
            <button class="btn-confirm" :disabled="!name.trim()" @click="confirm">Save</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [name: string]
}>()

const name = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.modelValue, async (open) => {
  if (open) {
    name.value = ''
    await nextTick()
    inputRef.value?.focus()
  }
})

function confirm(): void {
  if (!name.value.trim()) return
  emit('confirm', name.value.trim())
  emit('update:modelValue', false)
}

function cancel(): void {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.save-input {
  @apply w-full bg-surface-50 border border-border rounded-md px-3 py-2 text-sm text-white/80
         font-mono outline-none focus:border-accent-purple/60 transition-colors;
}

.btn-cancel {
  @apply px-4 py-1.5 rounded-md text-sm text-white/50 hover:text-white/80
         bg-surface-50 border border-border hover:border-border/80 transition-colors;
}

.btn-confirm {
  @apply px-4 py-1.5 rounded-md text-sm font-medium bg-accent-purple text-surface
         hover:bg-accent-purple/80 active:scale-95 transition-all
         disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100;
}

.dialog-enter-active, .dialog-leave-active { transition: opacity 0.15s ease; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-active .relative, .dialog-leave-active .relative { transition: transform 0.15s ease; }
.dialog-enter-from .relative, .dialog-leave-to .relative { transform: scale(0.95); }
</style>
