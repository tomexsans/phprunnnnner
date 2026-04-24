// --- Dump value types (produced by PHP preamble, consumed by DumpNode) ---

export type DumpValue =
  | { type: 'null' }
  | { type: 'bool';       value: boolean }
  | { type: 'int';        value: number }
  | { type: 'float';      value: number }
  | { type: 'string';     length: number; value: string; truncated?: boolean }
  | { type: 'array';      length: number; items: DumpArrayItem[]; truncated?: boolean }
  | { type: 'collection'; class: string; total: number; count: number; items: DumpArrayItem[]; truncated?: boolean }
  | { type: 'object';     class: string; properties: DumpProperty[]; truncated?: boolean }
  | { type: 'resource';   kind: string }
  | { type: 'circular';   class: string }
  | { type: 'depth' }
  | { type: 'unknown';    value: string }

export interface DumpArrayItem {
  key: string | number
  value: DumpValue
}

export interface DumpProperty {
  key: string
  visibility: 'public' | 'protected' | 'private'
  static: boolean
  value: DumpValue
}

// A parsed chunk of PHP stdout
export type OutputSegment =
  | { kind: 'text'; content: string }
  | { kind: 'dump'; value: DumpValue }

// --- Editor / app types ---

export interface EditorTab {
  id: string
  title: string
  code: string
  isDirty: boolean
  filePath?: string
}

export interface PhpRunResult {
  output: string
  error: string
  exitCode: number
  executionTime: number
}

export interface Snippet {
  id: string
  name: string
  code: string
  createdAt: string
  updatedAt: string
}

export interface Connection {
  id: string
  name: string
  type: 'local' | 'ssh' | 'laravel'
  phpBinary?: string
  host?: string
  port?: number
  username?: string
  privateKeyPath?: string
  projectPath?: string
}

export interface SavedFile {
  id: string
  name: string
  filePath: string
  savedAt: string
}

export interface AppSettings {
  theme: 'dark' | 'light'
  fontSize: number
  tabSize: number
  wordWrap: boolean
  phpBinary: string
  executionTimeout: number
}
