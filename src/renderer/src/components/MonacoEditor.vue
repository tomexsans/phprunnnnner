<template>
  <div ref="containerRef" class="w-full h-full" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

const props = defineProps<{
  modelValue: string
  language?: string
  fontSize?: number
  tabSize?: number
  wordWrap?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'run': []
}>()

const containerRef = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

function defineTheme(): void {
  monaco.editor.defineTheme('tinkerwell-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '585b70', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'cba6f7' },
      { token: 'string', foreground: 'a6e3a1' },
      { token: 'number', foreground: 'fab387' },
      { token: 'type', foreground: '89dceb' },
      { token: 'variable', foreground: 'cdd6f4' },
      { token: 'function', foreground: '89b4fa' },
      { token: 'operator', foreground: '89dceb' },
      { token: 'delimiter', foreground: 'cdd6f4' },
      { token: 'tag', foreground: 'f38ba8' },
    ],
    colors: {
      'editor.background':                   '#1e1e2e',
      'editor.foreground':                   '#cdd6f4',
      'editorLineNumber.foreground':         '#45475a',
      'editorLineNumber.activeForeground':   '#89b4fa',
      'editor.selectionBackground':          '#45475a',
      'editor.lineHighlightBackground':      '#313244',
      'editorCursor.foreground':             '#f5c2e7',
      'editor.findMatchBackground':          '#f9e2af40',
      'editorWidget.background':             '#313244',
      'editorWidget.border':                 '#45475a',
      'input.background':                    '#1e1e2e',
      'input.border':                        '#45475a',
      'scrollbar.shadow':                    '#00000000',
      'scrollbarSlider.background':          '#45475a80',
      'scrollbarSlider.hoverBackground':     '#585b70',
    }
  })
}

onMounted(() => {
  if (!containerRef.value) return

  defineTheme()

  editor = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language ?? 'php',
    theme: 'tinkerwell-dark',
    fontSize: props.fontSize ?? 14,
    tabSize: props.tabSize ?? 4,
    wordWrap: props.wordWrap ? 'on' : 'off',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    glyphMargin: false,
    folding: true,
    renderLineHighlight: 'line',
    suggestOnTriggerCharacters: true,
    formatOnPaste: true,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontLigatures: true,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    padding: { top: 16, bottom: 16 },
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true }
  })

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor?.getValue() ?? '')
  })

  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
    () => emit('run')
  )
})

onBeforeUnmount(() => {
  editor?.dispose()
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (editor && editor.getValue() !== newVal) {
      editor.setValue(newVal)
    }
  }
)

watch(() => props.fontSize, (size) => editor?.updateOptions({ fontSize: size }))
watch(() => props.wordWrap, (wrap) => editor?.updateOptions({ wordWrap: wrap ? 'on' : 'off' }))
watch(() => props.tabSize, (size) => {
  editor?.getModel()?.updateOptions({ tabSize: size })
})

defineExpose({ focus: () => editor?.focus() })
</script>
