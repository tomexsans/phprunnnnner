import { ipcMain, WebContents } from 'electron'
import * as pty from 'node-pty'
import { platform } from 'os'
import { app } from 'electron'

const shell = platform() === 'win32' ? 'cmd.exe' : (process.env.SHELL ?? 'bash')

let ptyProcess: pty.IPty | null = null
let sender: WebContents | null = null

export function registerTerminalHandlers(): void {
  ipcMain.handle('terminal:create', (event, cols: number, rows: number) => {
    sender = event.sender

    if (ptyProcess) {
      ptyProcess.kill()
      ptyProcess = null
    }

    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: app.getPath('home'),
      env: process.env as Record<string, string>
    })

    ptyProcess.onData((data) => {
      sender?.send('terminal:data', data)
    })

    ptyProcess.onExit(() => {
      sender?.send('terminal:exit')
      ptyProcess = null
    })
  })

  ipcMain.on('terminal:input', (_event, data: string) => {
    ptyProcess?.write(data)
  })

  ipcMain.handle('terminal:resize', (_event, cols: number, rows: number) => {
    ptyProcess?.resize(cols, rows)
  })

  ipcMain.on('terminal:destroy', () => {
    ptyProcess?.kill()
    ptyProcess = null
    sender = null
  })
}
