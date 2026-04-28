/**
 * TTS Utility - Chuyển văn bản thành giọng nói tiếng Việt
 * 
 * Gọi qua Electron IPC → main process → edge-tts + mpv
 * Main process phát audio trực tiếp qua loa, không phụ thuộc browser.
 */

export interface TTSOptions {
    repeat?: number
    voice?: string
}

/**
 * Gửi text đến main process để phát giọng nói qua loa.
 */
export function speak(text: string, options?: TTSOptions): void {
    const { repeat = 1, voice } = options || {}
    const posApi = (window as any).posApi

    if (posApi?.ttsSpeak) {
        console.log(`[TTS] → IPC: "${text}" (repeat: ${repeat})`)
        posApi.ttsSpeak({ text, repeat, voice }).then((result: any) => {
            if (result?.ok) {
                console.log(`[TTS] ✅ Phát xong`)
            } else {
                console.warn(`[TTS] ❌ Lỗi:`, result?.message)
            }
        }).catch((err: any) => {
            console.error(`[TTS] ❌ IPC error:`, err)
        })
    } else {
        console.warn(`[TTS] ⚠ posApi.ttsSpeak không khả dụng (không chạy trong Electron?)`)
    }
}

/**
 * Khởi tạo - kiểm tra TTS sẵn sàng.
 */
export async function initTTS(): Promise<void> {
    const posApi = (window as any).posApi
    if (posApi?.ttsSpeak) {
        console.log('🔊 TTS ready: Electron IPC → edge-tts + mpv')
    } else {
        console.warn('🔊 TTS không khả dụng (cần chạy trong Electron)')
    }
}
