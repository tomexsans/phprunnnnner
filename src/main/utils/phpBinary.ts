import { execSync } from 'child_process'

export function detectPhpBinary(): string {
  const candidates = ['php', 'php8.3', 'php8.2', 'php8.1', 'php8.0', 'php7.4']
  for (const bin of candidates) {
    try { execSync(`which ${bin}`, { stdio: 'ignore' }); return bin } catch { /* try next */ }
  }
  return 'php'
}
