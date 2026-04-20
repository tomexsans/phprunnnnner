import type { OutputSegment, DumpValue } from '@/types'

const SENTINEL_RE = /\x02TDUMP\x03([\s\S]*?)\x02ENDDUMP\x03/g

export function parseOutput(raw: string): OutputSegment[] {
  const segments: OutputSegment[] = []
  let lastIndex = 0

  for (const match of raw.matchAll(SENTINEL_RE)) {
    // Text before this dump block
    if (match.index! > lastIndex) {
      const content = raw.slice(lastIndex, match.index)
      if (content) segments.push({ kind: 'text', content })
    }

    try {
      const value = JSON.parse(match[1]) as DumpValue
      segments.push({ kind: 'dump', value })
    } catch {
      // Malformed sentinel — treat as plain text
      segments.push({ kind: 'text', content: match[0] })
    }

    lastIndex = match.index! + match[0].length
  }

  // Trailing text after last dump
  if (lastIndex < raw.length) {
    const content = raw.slice(lastIndex)
    if (content) segments.push({ kind: 'text', content })
  }

  return segments
}
