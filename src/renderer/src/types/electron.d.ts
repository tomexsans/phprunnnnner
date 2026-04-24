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
    confirm: (message: string, detail: string) => Promise<boolean>
  }
  store: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<boolean>
    getAll: () => Promise<unknown>
  }
  terminal: {
    create:  (cols: number, rows: number) => Promise<void>
    input:   (data: string)               => void
    resize:  (cols: number, rows: number) => Promise<void>
    destroy: ()                           => void
    onData:  (cb: (data: string) => void) => void
    onExit:  (cb: () => void)             => void
    offAll:  ()                           => void
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
