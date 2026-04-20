<template>
  <!-- null -->
  <span v-if="value.type === 'null'" class="token-null">null</span>

  <!-- bool -->
  <span v-else-if="value.type === 'bool'" class="token-bool">
    {{ value.value ? 'true' : 'false' }}
  </span>

  <!-- int -->
  <span v-else-if="value.type === 'int'" class="token-number">{{ value.value }}</span>

  <!-- float -->
  <span v-else-if="value.type === 'float'" class="token-number">{{ value.value }}</span>

  <!-- string -->
  <span v-else-if="value.type === 'string'" class="inline-flex items-baseline gap-1.5 flex-wrap">
    <span class="token-string">"{{ value.value }}"</span>
    <span class="token-badge">{{ value.length }}</span>
    <span v-if="value.truncated" class="token-truncated">string truncated at {{ MAX_STR }} chars</span>
  </span>

  <!-- resource -->
  <span v-else-if="value.type === 'resource'" class="token-meta">
    resource({{ value.kind }})
  </span>

  <!-- circular reference -->
  <span v-else-if="value.type === 'circular'" class="token-meta italic">
    *CIRCULAR* {{ value.class }}
  </span>

  <!-- depth limit hit -->
  <span v-else-if="value.type === 'depth'" class="token-truncated">…(depth limit)</span>

  <!-- unknown -->
  <span v-else-if="value.type === 'unknown'" class="token-meta">{{ value.value }}</span>

  <!-- array -->
  <span v-else-if="value.type === 'array'">
    <button class="token-type-btn" @click="toggle">
      <CollapseIcon :open="isOpen" />
      <span class="token-type">array</span>
      <span class="token-badge ml-1">{{ value.length }}</span>
    </button>

    <span v-if="value.length === 0" class="token-meta ml-1">[]</span>

    <template v-else-if="isOpen">
      <div class="dump-children">
        <div v-for="item in value.items" :key="item.key" class="dump-row">
          <span class="token-key">{{ item.key }}</span>
          <span class="token-arrow">=&gt;</span>
          <DumpNode :value="item.value" :depth="depth + 1" />
        </div>
      </div>
      <TruncationBanner v-if="value.truncated" :shown="value.items.length" :total="value.length" hint="array" />
    </template>

    <span v-else class="token-meta ml-1">
      [{{ previewKeys(value.items, 3) }}]
    </span>
  </span>

  <!-- collection (Laravel Collection, ArrayObject, etc.) -->
  <span v-else-if="value.type === 'collection'">
    <button class="token-type-btn" @click="toggle">
      <CollapseIcon :open="isOpen" />
      <span class="token-class">{{ shortClass(value.class) }}</span>
      <span class="token-badge ml-1">{{ value.total }}</span>
    </button>

    <span v-if="value.total === 0" class="token-meta ml-1">[]</span>

    <template v-else-if="isOpen">
      <div class="dump-children">
        <div v-for="item in value.items" :key="item.key" class="dump-row">
          <span class="token-key">{{ item.key }}</span>
          <span class="token-arrow">=&gt;</span>
          <DumpNode :value="item.value" :depth="depth + 1" />
        </div>
      </div>
      <TruncationBanner v-if="value.truncated" :shown="value.count" :total="value.total" hint="collection" />
    </template>

    <span v-else class="token-meta ml-1">
      [{{ previewKeys(value.items, 3) }}]
    </span>
  </span>

  <!-- object -->
  <span v-else-if="value.type === 'object'">
    <button class="token-type-btn" @click="toggle">
      <CollapseIcon :open="isOpen" />
      <span class="token-class">{{ shortClass(value.class) }}</span>
      <span class="token-badge ml-1">{{ value.properties.length }}</span>
    </button>

    <span v-if="value.properties.length === 0" class="token-meta ml-1">{}</span>

    <template v-else-if="isOpen">
      <div class="dump-children">
        <div v-for="prop in value.properties" :key="prop.key" class="dump-row">
          <span class="token-visibility">{{ visChar(prop.visibility) }}</span>
          <span v-if="prop.static" class="token-meta mr-1">static</span>
          <span class="token-key">{{ prop.key }}</span>
          <span class="token-arrow">:</span>
          <DumpNode :value="prop.value" :depth="depth + 1" />
        </div>
      </div>
      <TruncationBanner v-if="value.truncated" :shown="value.properties.length" :total="value.properties.length" hint="properties" />
    </template>

    <span v-else class="token-meta ml-1">
      { {{ previewProps(value.properties, 3) }} }
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DumpValue, DumpArrayItem, DumpProperty } from '@/types'
import CollapseIcon from './CollapseIcon.vue'
import TruncationBanner from './TruncationBanner.vue'

const MAX_STR = 1000

const props = defineProps<{
  value: DumpValue
  depth?: number
}>()

const collapsible = props.value.type === 'array' || props.value.type === 'object' || props.value.type === 'collection'
const itemCount = collapsible
  ? props.value.type === 'array'      ? props.value.length
  : props.value.type === 'collection' ? props.value.total
  : props.value.properties.length
  : 0

const isOpen = ref(collapsible && itemCount > 0 && itemCount <= 20 && (props.depth ?? 0) < 3)

function toggle(): void { isOpen.value = !isOpen.value }

function visChar(vis: 'public' | 'protected' | 'private'): string {
  return vis === 'public' ? '+' : vis === 'protected' ? '#' : '-'
}

function shortClass(fqn: string): string {
  return fqn.split('\\').pop() ?? fqn
}

function previewKeys(items: DumpArrayItem[], max: number): string {
  const shown = items.slice(0, max).map((i) => JSON.stringify(i.key)).join(', ')
  return items.length > max ? `${shown}, …` : shown
}

function previewProps(prps: DumpProperty[], max: number): string {
  const shown = prps.slice(0, max).map((p) => p.key).join(', ')
  return prps.length > max ? `${shown}, …` : shown
}
</script>

<style scoped>
.token-null       { @apply text-white/40 font-mono; }
.token-bool       { @apply text-accent-purple font-mono; }
.token-number     { @apply text-accent-orange font-mono; }
.token-string     { @apply text-accent-green font-mono; }
.token-badge      { @apply text-[10px] px-1 py-px rounded bg-surface-200 text-white/40 font-mono leading-none; }
.token-meta       { @apply text-white/30 font-mono text-sm; }
.token-type       { @apply text-accent-cyan font-mono text-sm; }
.token-class      { @apply text-accent-blue font-mono text-sm font-medium; }
.token-key        { @apply text-accent-yellow font-mono text-sm; }
.token-arrow      { @apply text-white/30 font-mono text-sm mx-1.5; }
.token-visibility { @apply text-white/30 font-mono text-xs mr-1 select-none; }
.token-truncated  { @apply text-[10px] text-accent-yellow/70 font-mono italic; }

.token-type-btn {
  @apply inline-flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer;
}

.dump-children {
  @apply ml-4 mt-0.5 border-l border-border/50 pl-3 flex flex-col gap-0.5;
}

.dump-row {
  @apply flex items-baseline flex-wrap gap-0;
}
</style>
