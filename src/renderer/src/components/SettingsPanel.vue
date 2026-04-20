<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="isSettingsOpen"
        class="fixed inset-0 bg-black/50 z-40"
        @click="closeSettings"
      />
    </Transition>

    <!-- Panel -->
    <Transition name="panel">
      <div
        v-if="isSettingsOpen"
        class="fixed right-0 top-0 h-full w-[380px] z-50 flex flex-col bg-surface border-l border-border shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 class="text-sm font-semibold text-white/80 uppercase tracking-wider">Settings</h2>
          <button
            class="w-7 h-7 flex items-center justify-center rounded text-white/40 hover:text-white/80 hover:bg-surface-50 transition-colors"
            @click="closeSettings"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto scrollbar-thin">

          <!-- ── Editor ───────────────────────────── -->
          <section class="px-6 py-5 border-b border-border">
            <h3 class="section-title">Editor</h3>

            <div class="setting-row">
              <label class="setting-label">Font size</label>
              <div class="flex items-center gap-2">
                <button class="step-btn" :disabled="settings.fontSize <= 10" @click="settings.fontSize--">−</button>
                <span class="w-8 text-center font-mono text-sm text-white/80">{{ settings.fontSize }}</span>
                <button class="step-btn" :disabled="settings.fontSize >= 28" @click="settings.fontSize++">+</button>
              </div>
            </div>

            <div class="setting-row">
              <label class="setting-label">Tab size</label>
              <div class="flex rounded-md overflow-hidden border border-border">
                <button
                  v-for="n in [2, 4, 8]"
                  :key="n"
                  class="segmented-btn"
                  :class="{ 'segmented-btn--active': settings.tabSize === n }"
                  @click="settings.tabSize = n"
                >{{ n }}</button>
              </div>
            </div>

            <div class="setting-row">
              <label class="setting-label">Word wrap</label>
              <button
                class="toggle"
                :class="{ 'toggle--on': settings.wordWrap }"
                @click="settings.wordWrap = !settings.wordWrap"
              >
                <span class="toggle-thumb" />
              </button>
            </div>
          </section>

          <!-- ── PHP Runtime ──────────────────────── -->
          <section class="px-6 py-5 border-b border-border">
            <h3 class="section-title">PHP Runtime</h3>

            <div class="setting-col">
              <label class="setting-label">PHP binary</label>
              <div class="flex gap-2 mt-1.5">
                <input
                  v-model="settings.phpBinary"
                  class="input flex-1"
                  placeholder="php"
                  spellcheck="false"
                />
                <button class="btn-secondary" :disabled="detecting" @click="handleDetect">
                  {{ detecting ? 'Detecting…' : 'Detect' }}
                </button>
              </div>
              <p v-if="phpVersion" class="mt-1.5 text-xs text-accent-green font-mono">
                PHP {{ phpVersion }}
              </p>
              <p v-if="detectError" class="mt-1.5 text-xs text-accent-red font-mono">
                {{ detectError }}
              </p>
            </div>

            <div class="setting-row mt-4">
              <label class="setting-label">
                Timeout
                <span class="text-white/30 font-normal">(seconds)</span>
              </label>
              <div class="flex items-center gap-2">
                <button class="step-btn" :disabled="settings.executionTimeout <= 5" @click="settings.executionTimeout -= 5">−</button>
                <span class="w-8 text-center font-mono text-sm text-white/80">{{ settings.executionTimeout }}</span>
                <button class="step-btn" :disabled="settings.executionTimeout >= 120" @click="settings.executionTimeout += 5">+</button>
              </div>
            </div>
          </section>

          <!-- ── Connections ────────────────────────── -->
          <ConnectionsSection />

          <!-- ── Keyboard shortcuts ──────────────── -->
          <section class="px-6 py-5">
            <h3 class="section-title">Shortcuts</h3>
            <div class="space-y-2">
              <div v-for="s in shortcuts" :key="s.label" class="flex items-center justify-between">
                <span class="text-sm text-white/50">{{ s.label }}</span>
                <div class="flex gap-1">
                  <kbd v-for="k in s.keys" :key="k" class="kbd">{{ k }}</kbd>
                </div>
              </div>
            </div>
          </section>

        </div>

        <!-- Footer: Save button -->
        <div class="px-6 py-4 border-t border-border shrink-0 flex flex-col gap-2">
          <p v-if="saveError" class="text-xs text-accent-red font-mono">{{ saveError }}</p>
          <div class="flex items-center justify-between">
            <p class="text-xs text-white/20 font-mono">TinkerwellClone v0.1.0</p>
            <button class="save-btn" :disabled="saving" @click="handleSave">
              <template v-if="saved">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5L5.5 10L11 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Saved
              </template>
              <template v-else>
                {{ saving ? 'Saving…' : 'Save settings' }}
              </template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import ConnectionsSection from './ConnectionsSection.vue'

const store = useSettingsStore()
const { settings, phpVersion, isSettingsOpen } = storeToRefs(store)
const { closeSettings } = store

const detecting   = ref(false)
const detectError = ref<string | null>(null)
const saving      = ref(false)
const saved       = ref(false)
const saveError   = ref<string | null>(null)

async function handleDetect(): Promise<void> {
  detecting.value = true
  detectError.value = null
  const result = await window.electronAPI.php.detect()
  detecting.value = false
  if (result) {
    settings.value.phpBinary = result.binary
    phpVersion.value = result.version
  } else {
    detectError.value = 'No PHP binary found in PATH.'
  }
}

async function handleSave(): Promise<void> {
  saving.value = true
  saveError.value = null
  try {
    await store.save()
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (err) {
    saveError.value = String(err)
  } finally {
    saving.value = false
  }
}

const shortcuts = [
  { label: 'Run code',  keys: ['Ctrl', 'Enter'] },
  { label: 'New tab',   keys: ['Ctrl', 'T'] },
  { label: 'Close tab', keys: ['Ctrl', 'W'] },
  { label: 'Settings',  keys: ['Ctrl', ','] },
]
</script>

<style scoped>
.section-title { @apply text-xs font-semibold uppercase tracking-wider text-white/30 mb-4; }
.setting-row   { @apply flex items-center justify-between py-2; }
.setting-col   { @apply flex flex-col py-2; }
.setting-label { @apply text-sm text-white/70; }

.step-btn {
  @apply w-7 h-7 flex items-center justify-center rounded bg-surface-50 border border-border
         text-white/60 hover:text-white hover:border-accent-purple/50 transition-colors text-base
         disabled:opacity-30 disabled:cursor-not-allowed;
}

.segmented-btn { @apply px-3 py-1 text-sm text-white/50 hover:text-white/80 bg-surface-50 transition-colors; }
.segmented-btn--active { @apply bg-accent-purple/20 text-accent-purple; }

.toggle { @apply relative w-10 h-5 rounded-full bg-surface-200 border border-border transition-colors cursor-pointer; }
.toggle--on { @apply bg-accent-purple/30 border-accent-purple/50; }
.toggle-thumb { @apply absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white/40 transition-transform; }
.toggle--on .toggle-thumb { @apply translate-x-5 bg-accent-purple; }

.input {
  @apply bg-surface-50 border border-border rounded-md px-3 py-1.5 text-sm text-white/80
         font-mono outline-none focus:border-accent-purple/60 transition-colors;
}

.btn-secondary {
  @apply px-3 py-1.5 rounded-md text-sm bg-surface-50 border border-border
         text-white/60 hover:text-white/90 hover:border-accent-purple/50 transition-colors
         disabled:opacity-40 disabled:cursor-not-allowed shrink-0;
}

.save-btn {
  @apply flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium
         bg-accent-purple text-surface transition-all
         hover:bg-accent-purple/80 active:scale-95
         disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100;
}

.kbd { @apply text-xs bg-surface-50 border border-border px-1.5 py-0.5 rounded font-mono text-white/50; }

.panel-enter-active, .panel-leave-active { transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1); }
.panel-enter-from, .panel-leave-to { transform: translateX(100%); }
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.22s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
</style>
