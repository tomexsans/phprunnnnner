import { ipcMain, IpcMainInvokeEvent, app } from 'electron'
import { spawn, execSync } from 'child_process'
import { writeFileSync, unlinkSync, mkdtempSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export interface PhpRunOptions {
  code: string
  phpBinary?: string
  timeout?: number
  laravelPath?: string   // if set → bootstrap Laravel before running
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

// Sentinel bytes: STX/ETX — won't appear in normal PHP output
const DUMP_START = '\x02TDUMP\x03'
const DUMP_END   = '\x02ENDDUMP\x03'

// Hard limits — prevents stdout explosion from large collections
const MAX_ITEMS = 150   // array / collection items
const MAX_PROPS = 50    // object properties
const MAX_STR   = 1000  // string characters

// Helper function bodies only — no opening <?php tag.
// Defined BEFORE vendor/autoload.php so our version wins over Laravel's
// (which also uses if (!function_exists) guards).
const DUMP_HELPERS = `
if (!function_exists('__tinker_serialize')) {
    define('__TINKER_MAX_ITEMS', ${MAX_ITEMS});
    define('__TINKER_MAX_PROPS', ${MAX_PROPS});
    define('__TINKER_MAX_STR',   ${MAX_STR});

    function __tinker_serialize($value, array &$seen = [], int $depth = 0): array {
        if ($depth > 20) return ['type' => 'depth'];

        if (is_null($value))  return ['type' => 'null'];
        if (is_bool($value))  return ['type' => 'bool',  'value' => $value];
        if (is_int($value))   return ['type' => 'int',   'value' => $value];
        if (is_float($value)) return ['type' => 'float', 'value' => $value];

        if (is_string($value)) {
            $len = strlen($value);
            return [
                'type'      => 'string',
                'length'    => $len,
                'value'     => $len > __TINKER_MAX_STR ? substr($value, 0, __TINKER_MAX_STR) : $value,
                'truncated' => $len > __TINKER_MAX_STR,
            ];
        }

        if (is_array($value)) {
            $total = count($value);
            $items = [];
            $i = 0;
            foreach ($value as $k => $v) {
                if ($i >= __TINKER_MAX_ITEMS) break;
                $items[] = ['key' => $k, 'value' => __tinker_serialize($v, $seen, $depth + 1)];
                $i++;
            }
            return [
                'type'      => 'array',
                'length'    => $total,
                'items'     => $items,
                'truncated' => $total > __TINKER_MAX_ITEMS,
            ];
        }

        if (is_object($value)) {
            $id = spl_object_id($value);
            if (in_array($id, $seen, true)) return ['type' => 'circular', 'class' => get_class($value)];
            $seen[] = $id;
            $class  = get_class($value);

            // Countable + Traversable = Collection-like (Laravel Collection, ArrayObject, etc.)
            // Serialize as an indexed list instead of reflecting on internal properties
            if ($value instanceof Countable && $value instanceof Traversable) {
                $total = count($value);
                $items = [];
                $i = 0;
                foreach ($value as $k => $v) {
                    if ($i >= __TINKER_MAX_ITEMS) break;
                    $items[] = ['key' => $k, 'value' => __tinker_serialize($v, $seen, $depth + 1)];
                    $i++;
                }
                $seen = array_values(array_filter($seen, fn($x) => $x !== $id));
                return [
                    'type'      => 'collection',
                    'class'     => $class,
                    'total'     => $total,
                    'count'     => count($items),
                    'items'     => $items,
                    'truncated' => $total > __TINKER_MAX_ITEMS,
                ];
            }

            $props     = [];
            $propCount = 0;
            $truncatedProps = false;
            try {
                $ref      = new ReflectionObject($value);
                $allProps = $ref->getProperties();
                $truncatedProps = count($allProps) > __TINKER_MAX_PROPS;
                foreach (array_slice($allProps, 0, __TINKER_MAX_PROPS) as $prop) {
                    $prop->setAccessible(true);
                    try { $pv = $prop->getValue($value); } catch (Throwable $e) { $pv = null; }
                    $props[] = [
                        'key'        => $prop->getName(),
                        'visibility' => $prop->isPublic() ? 'public' : ($prop->isProtected() ? 'protected' : 'private'),
                        'static'     => $prop->isStatic(),
                        'value'      => __tinker_serialize($pv, $seen, $depth + 1),
                    ];
                }
            } catch (Throwable $e) {}

            $seen = array_values(array_filter($seen, fn($x) => $x !== $id));
            return [
                'type'       => 'object',
                'class'      => $class,
                'properties' => $props,
                'truncated'  => $truncatedProps,
            ];
        }

        if (is_resource($value)) return ['type' => 'resource', 'kind' => get_resource_type($value)];
        return ['type' => 'unknown', 'value' => (string)$value];
    }
}
if (!function_exists('dump')) {
    function dump(mixed ...$vars): void {
        foreach ($vars as $var) {
            $seen = [];
            echo "${DUMP_START}" . json_encode(__tinker_serialize($var, $seen)) . "${DUMP_END}";
        }
    }
}
if (!function_exists('dd')) {
    function dd(mixed ...$vars): never {
        dump(...$vars);
        exit(0);
    }
}
`

function buildLocalScript(code: string): string {
  const body = stripOpeningTag(code)
  return `<?php\n${DUMP_HELPERS}\n${body}`
}

function buildLaravelScript(code: string, projectPath: string): string {
  const safePath = JSON.stringify(projectPath)
  const body     = stripOpeningTag(code)

  return `<?php
${DUMP_HELPERS}

// ── Laravel bootstrap ──────────────────────────────────────────
$__tinker_base = ${safePath};
if (!is_dir($__tinker_base)) {
    fwrite(STDERR, "Laravel project path not found: " . $__tinker_base . "\\n");
    exit(1);
}
chdir($__tinker_base);
define('LARAVEL_START', microtime(true));

require $__tinker_base . '/vendor/autoload.php';

$__tinker_app = require $__tinker_base . '/bootstrap/app.php';
$__tinker_kernel = $__tinker_app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$__tinker_kernel->bootstrap();
// ── End bootstrap ──────────────────────────────────────────────

${body}
`
}

function stripOpeningTag(code: string): string {
  const trimmed = code.trim()
  if (trimmed.startsWith('<?php'))  return trimmed.slice(5)
  if (trimmed.startsWith('<?='))    return `\necho ${trimmed.slice(3)};`
  return trimmed
}

function detectPhpBinary(): string {
  const candidates = ['php', 'php8.3', 'php8.2', 'php8.1', 'php8.0', 'php7.4']
  for (const bin of candidates) {
    try { execSync(`which ${bin}`, { stdio: 'ignore' }); return bin } catch { /* try next */ }
  }
  return 'php'
}

function runScript(
  script: string,
  phpBinary: string,
  timeout: number
): Promise<PhpRunResult> {
  const start = Date.now()

  return new Promise((resolve) => {
    const tmpDir  = mkdtempSync(join(tmpdir(), 'tinker-'))
    const tmpFile = join(tmpDir, 'tinker.php')

    try {
      writeFileSync(tmpFile, script, 'utf-8')
    } catch (err) {
      resolve({ output: '', error: `Failed to write temp file: ${err}`, exitCode: 1, executionTime: 0 })
      return
    }

    let output = '', error = '', timedOut = false

    const proc = spawn(phpBinary, [tmpFile], {
      cwd: PHP_WORK_DIR,
      env: { ...process.env, COLUMNS: '200' }
    })

    const timer = setTimeout(() => {
      timedOut = true
      proc.kill('SIGKILL')
    }, timeout)

    proc.stdout.on('data', (chunk: Buffer) => { output += chunk.toString() })
    proc.stderr.on('data', (chunk: Buffer) => { error  += chunk.toString() })

    proc.on('close', (code) => {
      clearTimeout(timer)
      try { unlinkSync(tmpFile) } catch { /* ignore */ }
      resolve({
        output,
        error: timedOut ? `Execution timed out after ${timeout / 1000}s` : error,
        exitCode: code ?? 1,
        executionTime: Date.now() - start
      })
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      resolve({
        output: '',
        error: `Failed to spawn PHP: ${err.message}. Make sure PHP is installed and in your PATH.`,
        exitCode: 1,
        executionTime: Date.now() - start
      })
    })
  })
}

const PHP_WORK_DIR = join(app.getPath('home'), 'PHPRunnnnner')

export function registerPhpRunnerHandlers(): void {
  mkdirSync(PHP_WORK_DIR, { recursive: true })

  ipcMain.handle('php:run', async (_event: IpcMainInvokeEvent, options: PhpRunOptions): Promise<PhpRunResult> => {
    const phpBinary = options.phpBinary || detectPhpBinary()
    const timeout   = options.timeout   || 30000
    const script    = options.laravelPath
      ? buildLaravelScript(options.code, options.laravelPath)
      : buildLocalScript(options.code)

    return runScript(script, phpBinary, timeout)
  })

  ipcMain.handle('php:detect', async (_event, binary?: string): Promise<{ binary: string; version: string } | null> => {
    try {
      const resolved = binary || detectPhpBinary()
      const version  = execSync(`${resolved} -r "echo PHP_VERSION;"`, { encoding: 'utf-8' }).trim()
      return { binary: resolved, version }
    } catch { return null }
  })

  ipcMain.handle('laravel:validate', async (_event, projectPath: string): Promise<LaravelValidateResult> => {
    const required = [
      join(projectPath, 'artisan'),
      join(projectPath, 'vendor', 'autoload.php'),
      join(projectPath, 'bootstrap', 'app.php'),
    ]

    for (const f of required) {
      if (!existsSync(f)) {
        return { valid: false, error: `Not a Laravel project — missing: ${f}` }
      }
    }

    let laravelVersion: string | undefined
    try {
      const composer = JSON.parse(readFileSync(join(projectPath, 'composer.json'), 'utf-8'))
      laravelVersion = (
        composer?.require?.['laravel/framework'] ??
        composer?.require?.['illuminate/support']
      )?.replace(/[^0-9.]/g, '')
    } catch { /* version is optional */ }

    return { valid: true, laravelVersion }
  })
}
