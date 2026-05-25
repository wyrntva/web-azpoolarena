/**
 * TTS Server - Phát giọng nói trực tiếp qua loa hệ thống
 * 
 * Sử dụng: python3 edge-tts → tạo MP3 → mpv phát qua loa
 * Không phụ thuộc vào browser/Electron audio.
 *
 * Chạy: node scripts/tts-server.mjs
 * Port: 5050
 */

import http from 'node:http'
import { execFile, spawn } from 'node:child_process'
import { readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const PORT = parseInt(process.env.TTS_PORT || '5050', 10)
const DEFAULT_VOICE = 'vi-VN-HoaiMyNeural'

/**
 * Tạo file MP3 bằng edge-tts CLI
 */
function generateTTS(text, voice = DEFAULT_VOICE) {
    return new Promise((resolve, reject) => {
        const tmpFile = join(tmpdir(), `tts-${randomUUID()}.mp3`)

        execFile('python3', [
            '-m', 'edge_tts',
            '--voice', voice,
            '--text', text,
            '--write-media', tmpFile,
        ], { timeout: 30000 }, (error) => {
            if (error) {
                unlink(tmpFile).catch(() => { })
                reject(error)
                return
            }
            resolve(tmpFile)
        })
    })
}

/**
 * Phát file MP3 qua loa bằng mpv
 */
function playAudio(filePath) {
    return new Promise((resolve) => {
        const player = spawn('mpv', ['--no-video', '--really-quiet', filePath], {
            stdio: 'ignore',
        })
        player.on('close', () => {
            unlink(filePath).catch(() => { })
            resolve()
        })
        player.on('error', () => {
            unlink(filePath).catch(() => { })
            resolve()
        })
    })
}

// Lock để không phát chồng nhau
let isPlaying = false
const playQueue = []

async function processPlayQueue() {
    if (isPlaying) return
    isPlaying = true

    while (playQueue.length > 0) {
        const { text, repeat, voice, resolve: res } = playQueue.shift()
        try {
            const fullText = Array(Math.min(repeat, 5)).fill(text).join(' ... ')
            console.log(`🔊 "${fullText}"`)

            const filePath = await generateTTS(fullText, voice)
            console.log(`   ✅ Phát qua loa...`)
            await playAudio(filePath)
            console.log(`   ✅ Xong`)
            res({ ok: true })
        } catch (err) {
            console.error(`   ❌ Lỗi:`, err.message || err)
            res({ ok: false, error: String(err.message || err) })
        }
    }

    isPlaying = false
}

const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
    }

    // Health check
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok', voice: DEFAULT_VOICE }))
        return
    }

    // TTS endpoint - phát trực tiếp qua loa
    if (req.method === 'POST' && req.url === '/tts') {
        let body = ''
        for await (const chunk of req) body += chunk

        try {
            const data = JSON.parse(body)
            const text = (data.text || '').trim()
            const repeat = Math.min(Math.max(data.repeat || 1, 1), 5)
            const voice = data.voice || DEFAULT_VOICE

            if (!text) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'No text' }))
                return
            }

            // Thêm vào queue và trả response ngay (không chờ phát xong)
            const result = await new Promise((resolve) => {
                playQueue.push({ text, repeat, voice, resolve })
                processPlayQueue()
            })

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(result))
        } catch (err) {
            console.error('[TTS Error]', err)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: String(err) }))
        }
        return
    }

    res.writeHead(404)
    res.end('Not found')
})

server.listen(PORT, () => {
    console.log(`🔊 TTS Server on http://localhost:${PORT}`)
    console.log(`   Voice: ${DEFAULT_VOICE} (giọng nữ tiếng Việt)`)
    console.log(`   Phát audio: mpv (trực tiếp qua loa)`)
    console.log(`   POST /tts  { "text": "...", "repeat": 2 }`)
})
