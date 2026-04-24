<template>
  <div ref="containerEl" class="w-full h-full" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

const containerEl = ref<HTMLElement | null>(null)

let term: Terminal | null = null
let fitAddon: FitAddon | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  term = new Terminal({
    cursorBlink: true,
    fontFamily: 'JetBrains Mono, Fira Code, Cascadia Code, monospace',
    fontSize: 13,
    lineHeight: 1.2,
    theme: {
      background:          '#1e1e2e',
      foreground:          '#cdd6f4',
      cursor:              '#f5e0dc',
      selectionBackground: '#585b70',
      black:               '#45475a',
      red:                 '#f38ba8',
      green:               '#a6e3a1',
      yellow:              '#f9e2af',
      blue:                '#89b4fa',
      magenta:             '#cba6f7',
      cyan:                '#89dceb',
      white:               '#bac2de',
      brightBlack:         '#585b70',
      brightRed:           '#f38ba8',
      brightGreen:         '#a6e3a1',
      brightYellow:        '#f9e2af',
      brightBlue:          '#89b4fa',
      brightMagenta:       '#cba6f7',
      brightCyan:          '#89dceb',
      brightWhite:         '#a6adc8',
    }
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(containerEl.value!)
  fitAddon.fit()

  await window.electronAPI.terminal.create(term.cols, term.rows)

  term.onData((data) => {
    window.electronAPI.terminal.input(data)
  })

  window.electronAPI.terminal.onData((data) => {
    term?.write(data)
  })

  window.electronAPI.terminal.onExit(() => {
    term?.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n')
  })

  resizeObserver = new ResizeObserver(() => {
    fitAddon?.fit()
    if (term) window.electronAPI.terminal.resize(term.cols, term.rows)
  })
  resizeObserver.observe(containerEl.value!)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.electronAPI.terminal.offAll()
  window.electronAPI.terminal.destroy()
  term?.dispose()
})
</script>
