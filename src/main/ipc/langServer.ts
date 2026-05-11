import { ipcMain, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { detectPhpBinary } from '../utils/phpBinary'

export interface CompletionEntry {
  label: string
  kind: string
  detail?: string
  insertText?: string
}

interface CacheState {
  projectPath: string
  items: CompletionEntry[]
  status: 'loading' | 'ready' | 'error'
}

let currentCache: CacheState | null = null
let scanProcess: ReturnType<typeof spawn> | null = null

const STATIC_BASELINE: CompletionEntry[] = [
  // Facades
  { label: 'App',          kind: 'facade', detail: 'Illuminate\\Foundation\\Application' },
  { label: 'Arr',          kind: 'facade', detail: 'Illuminate\\Support\\Arr' },
  { label: 'Auth',         kind: 'facade', detail: 'Illuminate\\Auth\\AuthManager' },
  { label: 'Cache',        kind: 'facade', detail: 'Illuminate\\Cache\\CacheManager' },
  { label: 'Config',       kind: 'facade', detail: 'Illuminate\\Config\\Repository' },
  { label: 'Cookie',       kind: 'facade', detail: 'Illuminate\\Cookie\\CookieJar' },
  { label: 'Crypt',        kind: 'facade', detail: 'Illuminate\\Encryption\\Encrypter' },
  { label: 'DB',           kind: 'facade', detail: 'Illuminate\\Database\\DatabaseManager' },
  { label: 'Event',        kind: 'facade', detail: 'Illuminate\\Events\\Dispatcher' },
  { label: 'File',         kind: 'facade', detail: 'Illuminate\\Filesystem\\Filesystem' },
  { label: 'Gate',         kind: 'facade', detail: 'Illuminate\\Auth\\Access\\Gate' },
  { label: 'Hash',         kind: 'facade', detail: 'Illuminate\\Hashing\\HashManager' },
  { label: 'Http',         kind: 'facade', detail: 'Illuminate\\Http\\Client\\Factory' },
  { label: 'Lang',         kind: 'facade', detail: 'Illuminate\\Translation\\Translator' },
  { label: 'Log',          kind: 'facade', detail: 'Illuminate\\Log\\LogManager' },
  { label: 'Mail',         kind: 'facade', detail: 'Illuminate\\Mail\\Mailer' },
  { label: 'Notification', kind: 'facade', detail: 'Illuminate\\Notifications\\ChannelManager' },
  { label: 'Password',     kind: 'facade', detail: 'Illuminate\\Auth\\Passwords\\PasswordBrokerManager' },
  { label: 'Queue',        kind: 'facade', detail: 'Illuminate\\Queue\\QueueManager' },
  { label: 'Redirect',     kind: 'facade', detail: 'Illuminate\\Routing\\Redirector' },
  { label: 'Request',      kind: 'facade', detail: 'Illuminate\\Http\\Request' },
  { label: 'Response',     kind: 'facade', detail: 'Illuminate\\Routing\\ResponseFactory' },
  { label: 'Route',        kind: 'facade', detail: 'Illuminate\\Routing\\Router' },
  { label: 'Schema',       kind: 'facade', detail: 'Illuminate\\Database\\Schema\\Builder' },
  { label: 'Session',      kind: 'facade', detail: 'Illuminate\\Session\\SessionManager' },
  { label: 'Storage',      kind: 'facade', detail: 'Illuminate\\Filesystem\\FilesystemManager' },
  { label: 'Str',          kind: 'facade', detail: 'Illuminate\\Support\\Str' },
  { label: 'URL',          kind: 'facade', detail: 'Illuminate\\Routing\\UrlGenerator' },
  { label: 'Validator',    kind: 'facade', detail: 'Illuminate\\Validation\\Factory' },
  { label: 'View',         kind: 'facade', detail: 'Illuminate\\View\\Factory' },
  { label: 'Carbon',       kind: 'class',  detail: 'Carbon\\Carbon' },
  // Helpers
  { label: 'abort',          kind: 'function', detail: 'Laravel helper', insertText: 'abort(' },
  { label: 'abort_if',       kind: 'function', detail: 'Laravel helper', insertText: 'abort_if(' },
  { label: 'abort_unless',   kind: 'function', detail: 'Laravel helper', insertText: 'abort_unless(' },
  { label: 'app',            kind: 'function', detail: 'Laravel helper', insertText: 'app(' },
  { label: 'auth',           kind: 'function', detail: 'Laravel helper', insertText: 'auth(' },
  { label: 'back',           kind: 'function', detail: 'Laravel helper', insertText: 'back(' },
  { label: 'bcrypt',         kind: 'function', detail: 'Laravel helper', insertText: 'bcrypt(' },
  { label: 'blank',          kind: 'function', detail: 'Laravel helper', insertText: 'blank(' },
  { label: 'cache',          kind: 'function', detail: 'Laravel helper', insertText: 'cache(' },
  { label: 'collect',        kind: 'function', detail: 'Laravel helper', insertText: 'collect(' },
  { label: 'config',         kind: 'function', detail: 'Laravel helper', insertText: 'config(' },
  { label: 'csrf_token',     kind: 'function', detail: 'Laravel helper', insertText: 'csrf_token(' },
  { label: 'dd',             kind: 'function', detail: 'Laravel helper', insertText: 'dd(' },
  { label: 'decrypt',        kind: 'function', detail: 'Laravel helper', insertText: 'decrypt(' },
  { label: 'dispatch',       kind: 'function', detail: 'Laravel helper', insertText: 'dispatch(' },
  { label: 'dump',           kind: 'function', detail: 'Laravel helper', insertText: 'dump(' },
  { label: 'encrypt',        kind: 'function', detail: 'Laravel helper', insertText: 'encrypt(' },
  { label: 'env',            kind: 'function', detail: 'Laravel helper', insertText: 'env(' },
  { label: 'event',          kind: 'function', detail: 'Laravel helper', insertText: 'event(' },
  { label: 'filled',         kind: 'function', detail: 'Laravel helper', insertText: 'filled(' },
  { label: 'info',           kind: 'function', detail: 'Laravel helper', insertText: 'info(' },
  { label: 'logger',         kind: 'function', detail: 'Laravel helper', insertText: 'logger(' },
  { label: 'now',            kind: 'function', detail: 'Laravel helper', insertText: 'now(' },
  { label: 'old',            kind: 'function', detail: 'Laravel helper', insertText: 'old(' },
  { label: 'optional',       kind: 'function', detail: 'Laravel helper', insertText: 'optional(' },
  { label: 'redirect',       kind: 'function', detail: 'Laravel helper', insertText: 'redirect(' },
  { label: 'report',         kind: 'function', detail: 'Laravel helper', insertText: 'report(' },
  { label: 'request',        kind: 'function', detail: 'Laravel helper', insertText: 'request(' },
  { label: 'rescue',         kind: 'function', detail: 'Laravel helper', insertText: 'rescue(' },
  { label: 'resolve',        kind: 'function', detail: 'Laravel helper', insertText: 'resolve(' },
  { label: 'response',       kind: 'function', detail: 'Laravel helper', insertText: 'response(' },
  { label: 'retry',          kind: 'function', detail: 'Laravel helper', insertText: 'retry(' },
  { label: 'route',          kind: 'function', detail: 'Laravel helper', insertText: 'route(' },
  { label: 'session',        kind: 'function', detail: 'Laravel helper', insertText: 'session(' },
  { label: 'tap',            kind: 'function', detail: 'Laravel helper', insertText: 'tap(' },
  { label: 'throw_if',       kind: 'function', detail: 'Laravel helper', insertText: 'throw_if(' },
  { label: 'throw_unless',   kind: 'function', detail: 'Laravel helper', insertText: 'throw_unless(' },
  { label: 'today',          kind: 'function', detail: 'Laravel helper', insertText: 'today(' },
  { label: 'url',            kind: 'function', detail: 'Laravel helper', insertText: 'url(' },
  { label: 'validator',      kind: 'function', detail: 'Laravel helper', insertText: 'validator(' },
  { label: 'value',          kind: 'function', detail: 'Laravel helper', insertText: 'value(' },
  { label: 'view',           kind: 'function', detail: 'Laravel helper', insertText: 'view(' },
  { label: 'with',           kind: 'function', detail: 'Laravel helper', insertText: 'with(' },
]

function broadcastStatus(status: 'loading' | 'ready' | 'error' | 'idle'): void {
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('lsp:status', status))
}

function buildReflectScript(projectPath: string): string {
  const safePath = JSON.stringify(projectPath)
  return `<?php
error_reporting(0);
ini_set('display_errors', '0');
$project = ${safePath};
if (!is_dir($project)) { echo json_encode([]); exit(0); }
$symbols = [];
try {
    chdir($project);
    define('LARAVEL_START', microtime(true));
    require $project . '/vendor/autoload.php';
    $app = require $project . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
    $kernel->bootstrap();
    try {
        $aliases = config('app.aliases', []);
        foreach ($aliases as $alias => $concrete) {
            $symbols[] = ['label' => $alias, 'kind' => 'facade', 'detail' => $concrete];
            try {
                $rf = new ReflectionClass($concrete);
                foreach ($rf->getMethods(ReflectionMethod::IS_PUBLIC | ReflectionMethod::IS_STATIC) as $m) {
                    $name = $m->getName();
                    if ($name[0] === '_') continue;
                    $symbols[] = ['label' => $alias . '::' . $name, 'kind' => 'method', 'detail' => $alias, 'insertText' => $name];
                }
            } catch (Throwable $e) {}
        }
    } catch (Throwable $e) {}
} catch (Throwable $e) {}
foreach (get_defined_functions()['user'] as $fn) {
    $symbols[] = ['label' => $fn, 'kind' => 'function', 'detail' => 'function'];
}
foreach (get_defined_functions()['internal'] as $fn) {
    $symbols[] = ['label' => $fn, 'kind' => 'function', 'detail' => 'PHP'];
}
foreach (glob($project . '/app/Models/*.php') ?: [] as $file) {
    $src = @file_get_contents($file);
    if ($src && preg_match('/class\\s+(\\w+)/', $src, $m)) {
        $symbols[] = ['label' => $m[1], 'kind' => 'class', 'detail' => 'Model'];
    }
}
echo json_encode($symbols);
`
}

export function registerLangServerHandlers(): void {
  ipcMain.handle('lsp:init', async (_event, projectPath: string): Promise<{ ok: boolean; error?: string }> => {
    // Already ready for this exact path — skip re-scan
    if (currentCache?.projectPath === projectPath && currentCache?.status === 'ready') {
      return { ok: true }
    }

    if (scanProcess) {
      scanProcess.kill()
      scanProcess = null
    }

    currentCache = { projectPath, items: [...STATIC_BASELINE], status: 'loading' }
    broadcastStatus('loading')

    const tmpDir  = mkdtempSync(join(tmpdir(), 'tinker-lsp-'))
    const tmpFile = join(tmpDir, 'reflect.php')
    writeFileSync(tmpFile, buildReflectScript(projectPath), 'utf-8')

    const phpBin = detectPhpBinary()

    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      let stdout = ''
      let stderr = ''

      scanProcess = spawn(phpBin, [tmpFile], { cwd: projectPath })

      scanProcess.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
      scanProcess.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

      scanProcess.on('close', (code) => {
        try { unlinkSync(tmpFile) } catch { /* ignore */ }
        scanProcess = null

        if (code === 0 && stdout.trim()) {
          try {
            const reflected = JSON.parse(stdout) as CompletionEntry[]
            const baselineLabels = new Set(reflected.map(r => r.label.toLowerCase()))
            const deduped = STATIC_BASELINE.filter(b => !baselineLabels.has(b.label.toLowerCase()))
            currentCache = { projectPath, items: [...deduped, ...reflected], status: 'ready' }
            broadcastStatus('ready')
            resolve({ ok: true })
          } catch {
            currentCache = { projectPath, items: [...STATIC_BASELINE], status: 'error' }
            broadcastStatus('error')
            resolve({ ok: false, error: 'JSON parse failed' })
          }
        } else {
          currentCache = { projectPath, items: [...STATIC_BASELINE], status: 'error' }
          broadcastStatus('error')
          resolve({ ok: false, error: stderr || `Process exited with code ${code}` })
        }
      })

      scanProcess.on('error', (err) => {
        try { unlinkSync(tmpFile) } catch { /* ignore */ }
        scanProcess = null
        currentCache = { projectPath, items: [...STATIC_BASELINE], status: 'error' }
        broadcastStatus('error')
        resolve({ ok: false, error: err.message })
      })
    })
  })

  ipcMain.handle('lsp:stop', async (): Promise<void> => {
    if (scanProcess) {
      scanProcess.kill()
      scanProcess = null
    }
    currentCache = null
    broadcastStatus('idle')
  })

  ipcMain.handle('lsp:complete', async (_event, prefix: string): Promise<CompletionEntry[]> => {
    if (!currentCache) return []
    const items = currentCache.items
    if (!prefix) return items.slice(0, 50)
    const lower = prefix.toLowerCase()
    return items.filter(item => item.label.toLowerCase().includes(lower)).slice(0, 100)
  })
}
