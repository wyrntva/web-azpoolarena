import { app, BrowserWindow, shell, ipcMain, session } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Cho phép autoplay audio (TTS thông báo order không cần user click)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')
// NOTE:
// In Windows + Electron, native module `printer` must be built against Electron headers.
// Until we set up proper rebuild (Step 5), we keep printing optional and never crash app.
// TEMPORARILY DISABLED to fix startup crash
const printer: any = null
// const printer = (() => {
//   try {
//     return require('printer')
//   } catch {
//     return null
//   }
// })()

async function createWindow() {
  win = new BrowserWindow({
    title: 'POS Thu Ngân - AZ POOLARENA',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    fullscreen: true, // Chạy full màn hình
    frame: true, // Giữ thanh tiêu đề để có thể thoát fullscreen
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,

      // Disable web security in development to allow localhost API calls
      webSecurity: !VITE_DEV_SERVER_URL,
    },
  })

  // Set CSP to allow API calls (production only - dev mode has webSecurity disabled)
  if (!VITE_DEV_SERVER_URL) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 http://localhost:5050 ws://localhost:* ws://127.0.0.1:*; " +
            "img-src 'self' data: blob: http://localhost:8000 http://127.0.0.1:8000; " +
            "media-src 'self' data: blob:; " +
            "font-src 'self' data:; " +
            "style-src 'self' 'unsafe-inline';"
          ]
        }
      })
    })
  }

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Full screen / kiosk-like behavior for POS
  win.setMenuBarVisibility(false)
  win.maximize()

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update (async)
  update(win).catch(err => console.error('Update init failed:', err))
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

type ReceiptItem = { name: string; qty: number; price: number }
type ReceiptPayload = {
  orderId?: string
  orderIdLocal?: string
  items: ReceiptItem[]
  total: number
  paid: number
  method: string
  createdAt: string
}

function buildEscPos(data: ReceiptPayload) {
  const ESC = '\x1B'
  const GS = '\x1D'
  const newline = '\n'

  const lines: string[] = []
  lines.push(`${ESC}@`) // init
  lines.push(`${ESC}a1`) // center
  lines.push('*** CUA HANG ***')
  lines.push(`Don: ${data.orderId || data.orderIdLocal || 'LOCAL'}`)
  lines.push(data.createdAt)
  lines.push(`${ESC}a0`) // left
  lines.push('--------------------------')
  data.items.forEach((item) => {
    lines.push(item.name)
    lines.push(`  x${item.qty}   ${item.price.toLocaleString()}  = ${(item.qty * item.price).toLocaleString()}`)
  })
  lines.push('--------------------------')
  lines.push(`TONG: ${data.total.toLocaleString()} VND`)
  lines.push(`Da thanh toan: ${data.paid.toLocaleString()} (${data.method})`)
  lines.push('Cam on quy khach!')
  lines.push(`${GS}V\x00`) // cut
  return lines.join(newline)
}

ipcMain.handle('print-receipt', async (_event, data: ReceiptPayload) => {
  if (!printer) return { ok: false, message: 'Printer module not ready (will be fixed in Step 5)' }
  try {
    const payload = buildEscPos(data)
    await new Promise<void>((resolve, reject) => {
      printer.printDirect({
        data: payload,
        type: 'RAW',
        success: () => resolve(),
        error: (err: any) => reject(err),
      })
    })
    return { ok: true }
  } catch (err) {
    console.error('Print error', err)
    return { ok: false, message: err instanceof Error ? err.message : 'Unknown print error' }
  }
})
// ============================================
// TTS - Text-to-Speech using Python edge-tts CLI
// Phát trực tiếp qua loa bằng mpv (không phụ thuộc browser)
// ============================================

import { execFile, spawn } from 'node:child_process'
import { unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'

function ttsGenerateAndPlay(text: string, voice: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(tmpdir(), `tts-${randomUUID()}.mp3`)

    // Bước 1: Tạo file MP3
    execFile('python3', [
      '-m', 'edge_tts',
      '--voice', voice,
      '--rate=-20%',
      '--text', text,
      '--write-media', tmpFile,
    ], { timeout: 30000 }, (error) => {
      if (error) {
        unlink(tmpFile).catch(() => { })
        reject(error)
        return
      }

      // Bước 2: Phát qua loa bằng mpv
      console.log(`[TTS] ▶ Playing...`)
      const player = spawn('mpv', ['--no-video', '--really-quiet', tmpFile], { stdio: 'ignore' })
      player.on('close', () => {
        unlink(tmpFile).catch(() => { })
        console.log(`[TTS] ✅ Done`)
        resolve()
      })
      player.on('error', (err) => {
        unlink(tmpFile).catch(() => { })
        reject(err)
      })
    })
  })
}

ipcMain.handle('tts-speak', async (_event, options: {
  text: string
  repeat?: number
  voice?: string
}) => {
  try {
    const { text, repeat = 1, voice } = options
    if (!text || !text.trim()) return { ok: false, message: 'No text' }

    const parts = Array(Math.min(repeat, 5)).fill(text)
    const fullText = parts.join(' ... ')

    console.log(`[TTS] 🔊 "${fullText}"`)
    await ttsGenerateAndPlay(fullText, voice || 'vi-VN-HoaiMyNeural')

    return { ok: true }
  } catch (err) {
    console.error('[TTS Error]', err)
    return { ok: false, message: err instanceof Error ? err.message : 'TTS error' }
  }
})

