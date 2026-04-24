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
  files: {
    writeSnippet: (id: string, code: string) => Promise<string>
    writeTab:     (id: string, code: string) => Promise<string>
    read:         (filePath: string)         => Promise<string>
    delete:       (filePath: string)         => Promise<void>
    deleteTab:    (id: string)               => Promise<void>
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
