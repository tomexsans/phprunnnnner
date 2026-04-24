<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="isSavedFilesOpen"
        class="fixed inset-0 bg-black/50 z-40"
        @click="closeSavedFiles"
      />
    </Transition>

    <Transition name="panel">
      <div
        v-if="isSavedFilesOpen"
        class="fixed right-0 top-0 h-full w-[380px] z-50 flex flex-col bg-surface border-l border-border shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 class="text-sm font-semibold text-white/80 uppercase tracking-wider">Saved Files</h2>
          <button
            class="w-7 h-7 flex items-center justify-center rounded text-white/40 hover:text-white/80 hover:bg-surface-50 transition-colors"
            @click="closeSavedFiles"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Save current tab -->
        <div class="px-6 py-4 border-b border-border shrink-0">
          <p class="text-xs text-white/30 uppercase tracking-wider mb-3">Save current tab</p>
          <div class="flex gap-2">
            <input
              v-model="saveName"
              class="save-input flex-1"
              :placeholder="activeTab?.title ?? 'Name'"
              spellcheck="false"
              @keydown.enter="handleSave"
            />
            <button class="save-btn" :disabled="saving" @click="handleSave">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
          <p class="mt-2 text-xs text-white/20">Autosave keeps all open tabs across restarts.</p>
        </div>

        <!-- File list -->
        <div class="flex-1 overflow-y-auto scrollbar-thin">
          <div v-if="savedFiles.length === 0" class="flex flex-col items-center justify-center h-48 gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" class="text-white/10">
              <rect x="4" y="2" width="18" height="28" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M22 6h4a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="1.5"/>
              <path d="M9 10h10M9 15h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p class="text-sm text-white/20">No saved files yet</p>
          </div>

          <div v-for="file in savedFiles" :key="file.id" class="file-item group">
            <!-- Rename mode -->
            <template v-if="renamingId === file.id">
              <input
                :ref="el => { if (el) renameInputs[file.id] = el as HTMLInputElement }"
                v-model="renameValue"
                class="rename-input flex-1"
                spellcheck="false"
                @keydown.enter="confirmRename(file.id)"
                @keydown.esc="cancelRename"
              />
              <div class="flex items-center gap-1 shrink-0">
                <button class="action-btn text-accent-green" title="Confirm" @click="confirmRename(file.id)">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 6.5L5 9.5L11 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="action-btn text-white/40" title="Cancel" @click="cancelRename">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </template>

            <!-- Normal mode -->
            <template v-else>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white/80 truncate">{{ file.name }}</p>
                <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span class="text-xs text-white/30">{{ formatDate(file.savedAt) }}</span>
                  <span class="meta-dot">·</span>
                  <span
                    class="meta-badge"
                    :class="connectionType(file) === 'laravel' ? 'badge-laravel' : 'badge-local'"
                  >{{ connectionLabel(file) }}</span>
                  <span v-if="runtimeLabel(file)" class="meta-badge badge-runtime">
                    {{ runtimeLabel(file) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="action-btn text-white/50"
                  title="Rename"
                  @click="startRename(file)"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M9 2l2 2-7 7H2V9l7-7Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button
                  class="action-btn text-accent-purple"
                  title="Open in new tab"
                  @click="handleOpen(file)"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 11L11 2M11 2H5M11 2V8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button
                  class="action-btn text-accent-red"
                  title="Delete"
                  @click="handleDelete(file.id)"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 3.5h9M5 3.5V2.5h3V3.5M4 3.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-border shrink-0">
          <p class="text-xs text-white/20 font-mono">{{ savedFiles.length }} saved file{{ savedFiles.length === 1 ? '' : 's' }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useSettingsStore } from '@/stores/settings'
import type { SavedFile } from '@/types'

const store = useEditorStore()
const { savedFiles, isSavedFilesOpen, activeTab } = storeToRefs(store)
const { closeSavedFiles, saveFile, renameFile, deleteSavedFile, openSavedFile } = store

const settingsStore = useSettingsStore()
const { connections, runtimes } = storeToRefs(settingsStore)

function connectionLabel(file: SavedFile): string {
  const conn = connections.value.find((c) => c.id === (file.connectionId ?? 'local'))
  return conn?.name ?? 'Local PHP'
}

function connectionType(file: SavedFile): 'laravel' | 'local' {
  const conn = connections.value.find((c) => c.id === (file.connectionId ?? 'local'))
  return conn?.type === 'laravel' ? 'laravel' : 'local'
}

function runtimeLabel(file: SavedFile): string | null {
  if (!file.phpBinary) return null
  const rt = runtimes.value.find((r) => r.binary === file.phpBinary)
  return rt?.name ?? file.phpBinary
}

const saveName = ref('')
const saving = ref(false)

const renamingId = ref<string | null>(null)
const renameValue = ref('')
const renameInputs: Record<string, HTMLInputElement> = {}

async function handleSave(): Promise<void> {
  if (!activeTab.value) return
  saving.value = true
  await saveFile(saveName.value || activeTab.value.title)
  saveName.value = ''
  saving.value = false
}

async function handleDelete(id: string): Promise<void> {
  await deleteSavedFile(id)
}

async function handleOpen(file: SavedFile): Promise<void> {
  await openSavedFile(file)
  closeSavedFiles()
}

async function startRename(file: SavedFile): Promise<void> {
  renamingId.value = file.id
  renameValue.value = file.name
  await nextTick()
  renameInputs[file.id]?.select()
}

async function confirmRename(id: string): Promise<void> {
  await renameFile(id, renameValue.value)
  renamingId.value = null
}

function cancelRename(): void {
  renamingId.value = null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.save-input {
  @apply bg-surface-50 border border-border rounded-md px-3 py-1.5 text-sm text-white/80
         font-mono outline-none focus:border-accent-purple/60 transition-colors;
}

.save-btn {
  @apply px-4 py-1.5 rounded-md text-sm font-medium bg-accent-purple text-surface
         hover:bg-accent-purple/80 active:scale-95 transition-all
         disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0;
}

.file-item {
  @apply flex items-center gap-3 px-6 py-3 border-b border-border/50
         hover:bg-surface-50 transition-colors cursor-default;
}

.meta-dot  { @apply text-white/20 text-xs; }
.meta-badge {
  @apply text-[10px] px-1.5 py-px rounded font-mono uppercase tracking-wide leading-tight;
}
.badge-local   { @apply bg-accent-green/10 text-accent-green/70; }
.badge-laravel { @apply bg-accent-red/10 text-accent-red/70; }
.badge-runtime { @apply bg-accent-blue/10 text-accent-blue/70; }

.action-btn {
  @apply w-7 h-7 flex items-center justify-center rounded hover:bg-surface-200 transition-colors;
}

.rename-input {
  @apply bg-surface-200 border border-accent-purple/50 rounded px-2 py-0.5 text-sm text-white/90
         font-mono outline-none w-full;
}

.panel-enter-active, .panel-leave-active { transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1); }
.panel-enter-from, .panel-leave-to { transform: translateX(100%); }
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.22s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
</style>
