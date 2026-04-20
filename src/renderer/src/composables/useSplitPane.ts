import { ref, onMounted, onBeforeUnmount } from 'vue'

const MIN_EDITOR_WIDTH = 300
const MIN_OUTPUT_WIDTH = 240
const STORAGE_KEY = 'splitPane:outputWidth'

export function useSplitPane(containerRef: Readonly<ReturnType<typeof ref<HTMLElement | null>>>) {
  const outputWidth = ref<number>(loadSavedWidth())
  const isDragging = ref(false)

  function loadSavedWidth(): number {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseInt(saved, 10) : 480
  }

  function onDragStart(e: MouseEvent): void {
    e.preventDefault()
    isDragging.value = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function onDragMove(e: MouseEvent): void {
    if (!isDragging.value || !containerRef.value) return

    const rect = containerRef.value.getBoundingClientRect()
    const totalWidth = rect.width
    const newOutputWidth = rect.right - e.clientX

    const clamped = Math.min(
      Math.max(newOutputWidth, MIN_OUTPUT_WIDTH),
      totalWidth - MIN_EDITOR_WIDTH
    )

    outputWidth.value = clamped
  }

  function onDragEnd(): void {
    if (!isDragging.value) return
    isDragging.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    localStorage.setItem(STORAGE_KEY, String(outputWidth.value))
  }

  onMounted(() => {
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
  })

  return { outputWidth, isDragging, onDragStart }
}
