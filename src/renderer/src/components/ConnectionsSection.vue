<template>
  <section class="px-6 py-5 border-b border-border">
    <h3 class="section-title">Connections</h3>

    <!-- Connection list -->
    <div class="space-y-1.5 mb-4">
      <div
        v-for="conn in connections"
        :key="conn.id"
        class="conn-row"
        :class="{ 'conn-row--active': conn.id === activeConnectionId }"
        @click="activeConnectionId = conn.id"
      >
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span
            class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="conn.type === 'laravel' ? 'bg-accent-red' : 'bg-accent-green'"
          />
          <div class="flex flex-col min-w-0">
            <span class="text-sm text-white/80 truncate">{{ conn.name }}</span>
            <span v-if="conn.projectPath" class="text-xs text-white/30 truncate font-mono">
              {{ conn.projectPath }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <span class="type-badge" :class="conn.type === 'laravel' ? 'badge-laravel' : 'badge-local'">
            {{ conn.type }}
          </span>
          <button
            v-if="conn.id !== 'local'"
            class="icon-action text-accent-red/60 hover:text-accent-red"
            title="Remove connection"
            @click.stop="removeConnection(conn.id)"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Add form -->
    <div v-if="showForm" class="rounded-lg border border-border bg-surface p-4 space-y-3 mb-3">
      <p class="text-xs font-semibold text-white/40 uppercase tracking-wider">New Laravel Connection</p>

      <!-- Name -->
      <div>
        <label class="field-label">Name</label>
        <input v-model="form.name" class="field-input" placeholder="My Laravel App" />
      </div>

      <!-- Project path -->
      <div>
        <label class="field-label">Project path</label>
        <div class="flex gap-2">
          <input v-model="form.path" class="field-input flex-1" placeholder="/home/user/my-app" />
          <button class="btn-sm" @click="browse">Browse</button>
        </div>
      </div>

      <!-- Validation result -->
      <div v-if="validation" class="text-xs font-mono px-3 py-2 rounded" :class="validationClass">
        {{ validation.message }}
      </div>

      <!-- Actions -->
      <div class="flex gap-2 pt-1">
        <button class="btn-sm" :disabled="!form.path || validating" @click="validate">
          {{ validating ? 'Checking…' : 'Validate' }}
        </button>
        <button
          class="btn-primary"
          :disabled="!validation?.ok || !form.name"
          @click="addConnection"
        >
          Add
        </button>
        <button class="btn-sm ml-auto" @click="cancelForm">Cancel</button>
      </div>
    </div>

    <!-- Add button -->
    <button v-if="!showForm" class="add-btn" @click="openForm">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M5.5 1V10M1 5.5H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Add Laravel Project
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { v4 as uuidv4 } from 'uuid'

const store = useSettingsStore()
const { connections, activeConnectionId } = storeToRefs(store)

// ── Form state ────────────────────────────────────────────────
const showForm = ref(false)
const validating = ref(false)
const form = ref({ name: '', path: '' })
const validation = ref<{ ok: boolean; message: string } | null>(null)

const validationClass = computed(() =>
  validation.value?.ok
    ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
    : 'bg-accent-red/10 text-accent-red border border-accent-red/20'
)

function openForm(): void {
  form.value = { name: '', path: '' }
  validation.value = null
  showForm.value = true
}

function cancelForm(): void {
  showForm.value = false
  validation.value = null
}

async function browse(): Promise<void> {
  const dir = await window.electronAPI.dialog.openDirectory()
  if (dir) {
    form.value.path = dir
    validation.value = null
    // Auto-validate when a path is picked via the picker
    await validate()
  }
}

async function validate(): Promise<void> {
  if (!form.value.path) return
  validating.value = true
  validation.value = null

  const result = await window.electronAPI.laravel.validate(form.value.path)
  validating.value = false

  if (result.valid) {
    const version = result.laravelVersion ? ` (Laravel ${result.laravelVersion})` : ''
    validation.value = { ok: true, message: `Valid Laravel project${version}` }
    // Auto-fill name from directory name if blank
    if (!form.value.name) {
      form.value.name = form.value.path.split('/').filter(Boolean).pop() ?? ''
    }
  } else {
    validation.value = { ok: false, message: result.error ?? 'Not a valid Laravel project' }
  }
}

function addConnection(): void {
  connections.value.push({
    id: uuidv4(),
    name: form.value.name,
    type: 'laravel',
    projectPath: form.value.path
  })
  showForm.value = false
}

function removeConnection(id: string): void {
  const idx = connections.value.findIndex((c) => c.id === id)
  if (idx === -1) return
  connections.value.splice(idx, 1)
  if (activeConnectionId.value === id) {
    activeConnectionId.value = 'local'
  }
}
</script>

<style scoped>
.section-title {
  @apply text-xs font-semibold uppercase tracking-wider text-white/30 mb-4;
}

.conn-row {
  @apply flex items-center justify-between gap-3 px-3 py-2 rounded-lg
         border border-transparent cursor-pointer
         hover:bg-surface-50 transition-colors;
}
.conn-row--active {
  @apply border-accent-purple/30 bg-accent-purple/5;
}

.type-badge {
  @apply text-[10px] px-1.5 py-px rounded font-mono uppercase tracking-wide;
}
.badge-local   { @apply bg-accent-green/15 text-accent-green; }
.badge-laravel { @apply bg-accent-red/15 text-accent-red; }

.icon-action {
  @apply w-5 h-5 flex items-center justify-center rounded transition-colors;
}

.field-label {
  @apply block text-xs text-white/40 mb-1;
}
.field-input {
  @apply w-full bg-surface-50 border border-border rounded-md px-3 py-1.5
         text-sm text-white/80 font-mono outline-none
         focus:border-accent-purple/60 transition-colors;
}

.btn-sm {
  @apply px-3 py-1.5 rounded-md text-xs bg-surface-50 border border-border
         text-white/60 hover:text-white/90 hover:border-accent-purple/40
         transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0;
}
.btn-primary {
  @apply px-3 py-1.5 rounded-md text-xs bg-accent-purple text-surface
         font-medium hover:bg-accent-purple/80 transition-colors
         disabled:opacity-40 disabled:cursor-not-allowed;
}

.add-btn {
  @apply flex items-center gap-2 text-sm text-white/40 hover:text-accent-purple
         transition-colors;
}
</style>
