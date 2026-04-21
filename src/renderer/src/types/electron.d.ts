export interface PhpRunOptions {
  code: string
  phpBinary?: string
  timeout?: number
  laravelPath?: string
}

export interface PhpRunResult {
  output: string
  error: string
  exitCode: number
  executionTime: number
}

export interface LaravelValidateResult {
  valid: boolean
  laravelVersion?: string
  error?: string
}

export interface ElectronAPI {
  php: {
    run: (options: PhpRunOptions) => Promise<PhpRunResult>
    detect: (binary?: string) => Promise<{ binary: string; version: string } | null>
  }
  laravel: {
    validate: (projectPath: string) => Promise<LaravelValidateResult>
  }
  dialog: {
    openDirectory: () => Promise<string | null>
  }
  store: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<boolean>
    getAll: () => Promise<unknown>
  }
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
    onMaximized: (callback: (maximized: boolean) => void) => void
    removeMaximizedListener: () => void
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
