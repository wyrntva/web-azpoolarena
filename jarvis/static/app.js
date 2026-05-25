/**
 * Jarvis AI — Client-side JavaScript
 * WebSocket real-time chat + REST API fallback
 */

// ─── State ───
function generateId() {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }) + '-' + Date.now().toString(36);
}

const state = {
    clientId: generateId(),
    ws: null,
    connected: false,
    isTyping: false,
    messages: [],
};

// ─── DOM Elements ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    messagesScroll: $('#messages-scroll'),
    messagesContainer: $('#messages-container'),
    messageInput: $('#message-input'),
    btnSend: $('#btn-send'),
    welcomeScreen: $('#welcome-screen'),
    connectionStatus: $('#connection-status'),
    aiPulse: $('#ai-pulse'),
    headerStatus: $('#header-status'),
    btnClearHistory: $('#btn-clear-history'),
    btnToggleSidebar: $('#btn-toggle-sidebar'),
    sidebar: $('#sidebar'),
    toastContainer: $('#toast-container'),
    btnMic: $('#btn-mic'),
};

// ─── Initialize ───
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    initEventListeners();
    initVoice();
    DOM.messageInput.focus();
});

// ─── WebSocket Connection ───
function initWebSocket() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws/${state.clientId}`;

    try {
        state.ws = new WebSocket(wsUrl);

        state.ws.onopen = () => {
            state.connected = true;
            updateConnectionStatus(true);
            console.log('[Jarvis] WebSocket connected');
        };

        state.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };

        state.ws.onclose = () => {
            state.connected = false;
            updateConnectionStatus(false);
            console.log('[Jarvis] WebSocket disconnected');
            // Auto reconnect after 3 seconds
            setTimeout(initWebSocket, 3000);
        };

        state.ws.onerror = (err) => {
            console.error('[Jarvis] WebSocket error:', err);
            state.connected = false;
            updateConnectionStatus(false);
        };
    } catch (e) {
        console.error('[Jarvis] Failed to connect WebSocket:', e);
        updateConnectionStatus(false);
    }
}

// ─── Event Listeners ───
function initEventListeners() {
    // Send message
    DOM.btnSend.addEventListener('click', sendMessage);

    // Enter to send, Shift+Enter for new line
    DOM.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea & toggle send button
    DOM.messageInput.addEventListener('input', () => {
        autoResizeTextarea();
        DOM.btnSend.disabled = !DOM.messageInput.value.trim();
    });

    // Quick action buttons
    $$('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const msg = btn.dataset.message;
            DOM.messageInput.value = msg;
            DOM.btnSend.disabled = false;
            sendMessage();
        });
    });

    // Clear history
    DOM.btnClearHistory.addEventListener('click', clearHistory);

    // Toggle sidebar (mobile)
    DOM.btnToggleSidebar.addEventListener('click', toggleSidebar);

    // Mic button
    DOM.btnMic.addEventListener('click', toggleVoiceInput);

    // Navigation (placeholder)
    $$('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            $$('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// ─── Send Message ───
function sendMessage() {
    const text = DOM.messageInput.value.trim();
    if (!text) return;

    // Add user message to UI
    addMessage('user', text);

    // Clear input
    DOM.messageInput.value = '';
    DOM.btnSend.disabled = true;
    autoResizeTextarea();

    // Hide welcome screen
    if (DOM.welcomeScreen) {
        DOM.welcomeScreen.style.display = 'none';
    }

    // Send via WebSocket or REST
    if (state.connected && state.ws?.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify({ message: text }));
    } else {
        sendViaREST(text);
    }

    // Show typing
    showTypingIndicator();
}

// ─── REST API Fallback ───
async function sendViaREST(message) {
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                session_id: state.clientId,
            }),
        });

        const data = await res.json();
        hideTypingIndicator();
        handleMessage({ type: 'reply', ...data });

    } catch (err) {
        console.error('[Jarvis] REST error:', err);
        hideTypingIndicator();
        addMessage('jarvis', 'Xin lỗi, không thể kết nối đến hệ thống Jarvis. Vui lòng kiểm tra kết nối mạng.');
    }
}

// ─── Handle incoming message ───
function handleMessage(data) {
    switch (data.type) {
        case 'welcome':
            // Welcome message handled by UI already
            updateConnectionStatus(true);
            break;

        case 'typing':
            showTypingIndicator();
            break;

        case 'reply':
            hideTypingIndicator();
            addMessage('jarvis', data.reply, data.commands || []);

            // Speak the reply aloud
            speakText(data.reply);

            // Show toast for executed commands
            if (data.executed_commands) {
                data.executed_commands.forEach(cmd => {
                    if (cmd.success) {
                        showToast(`✓ ${cmd.device_type} #${cmd.device_id} → ${cmd.status}`, 'success');
                    } else {
                        showToast(`✗ Lỗi: ${cmd.error || 'Không xác định'}`, 'error');
                    }
                });
            }
            break;
    }
}

// ─── Add Message to UI ───
function addMessage(role, text, commands = []) {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const avatarText = role === 'jarvis' ? 'J' : '👤';

    const messageEl = document.createElement('div');
    messageEl.classList.add('message', role);

    let commandHTML = '';
    if (commands.length > 0) {
        commands.forEach(cmd => {
            commandHTML += `
                <div class="command-card">
                    <div class="cmd-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
                        Lệnh điều khiển
                    </div>
                    <pre>${JSON.stringify(cmd, null, 2)}</pre>
                </div>
            `;
        });
    }

    // Format text: convert newlines and basic markdown
    const formattedText = formatText(text);

    messageEl.innerHTML = `
        <div class="message-avatar">${avatarText}</div>
        <div class="message-content">
            <div class="message-bubble">${formattedText}</div>
            ${commandHTML}
            <div class="message-time">${time}</div>
        </div>
    `;

    DOM.messagesScroll.appendChild(messageEl);
    scrollToBottom();

    // Set AI pulse state
    DOM.aiPulse.classList.remove('thinking');
}

// ─── Format Text ───
function formatText(text) {
    if (!text) return '';
    
    // Escape HTML
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Bold: **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Inline code: `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:rgba(108,99,255,0.15);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12px;">$1</code>');

    // Newlines
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

// ─── Typing Indicator ───
function showTypingIndicator() {
    if (state.isTyping) return;
    state.isTyping = true;

    DOM.aiPulse.classList.add('thinking');
    DOM.headerStatus.textContent = 'Đang suy nghĩ...';

    const typingEl = document.createElement('div');
    typingEl.classList.add('typing-indicator');
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = `
        <div class="message-avatar" style="background: var(--gradient-primary); color: white; font-size: 11px; letter-spacing: 1px;">J</div>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;

    DOM.messagesScroll.appendChild(typingEl);
    scrollToBottom();
}

function hideTypingIndicator() {
    state.isTyping = false;
    DOM.aiPulse.classList.remove('thinking');
    DOM.headerStatus.textContent = 'Quản gia trí tuệ nhân tạo';

    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) typingEl.remove();
}

// ─── Utilities ───
function scrollToBottom() {
    requestAnimationFrame(() => {
        DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
    });
}

function autoResizeTextarea() {
    const textarea = DOM.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function updateConnectionStatus(connected) {
    const el = DOM.connectionStatus;
    const span = el.querySelector('span');
    if (connected) {
        el.classList.add('connected');
        span.textContent = 'Đã kết nối';
    } else {
        el.classList.remove('connected');
        span.textContent = 'Mất kết nối';
    }
}

function toggleSidebar() {
    DOM.sidebar.classList.toggle('open');
    // Create/remove overlay
    let overlay = document.querySelector('.sidebar-overlay');
    if (DOM.sidebar.classList.contains('open')) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.classList.add('sidebar-overlay', 'active');
            overlay.addEventListener('click', toggleSidebar);
            document.body.appendChild(overlay);
        } else {
            overlay.classList.add('active');
        }
    } else if (overlay) {
        overlay.classList.remove('active');
    }
}

// ─── Clear History ───
async function clearHistory() {
    try {
        await fetch('/api/clear-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: state.clientId }),
        });

        // Clear UI
        DOM.messagesScroll.innerHTML = '';
        
        // Show welcome screen again
        if (DOM.welcomeScreen) {
            DOM.messagesScroll.appendChild(DOM.welcomeScreen);
            DOM.welcomeScreen.style.display = '';
        }

        showToast('Lịch sử đã được xóa', 'success');
    } catch (err) {
        showToast('Không thể xóa lịch sử', 'error');
    }
}

// ─── Toast Notifications ───
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);

    const icon = type === 'success' ? '⚡' : '⚠️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('toast-removing');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ═══════════════════════════════════════════════
// VOICE MODULE — Speech-to-Text & Text-to-Speech
// ═══════════════════════════════════════════════

const voice = {
    recognition: null,
    synthesis: window.speechSynthesis,
    isListening: false,
    supported: false,
    ttsEnabled: true, // Jarvis đọc phản hồi bằng giọng nói
};

function initVoice() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('[Jarvis] Trình duyệt không hỗ trợ Speech Recognition.');
        DOM.btnMic.title = 'Trình duyệt không hỗ trợ giọng nói. Dùng Chrome/Edge.';
        DOM.btnMic.style.opacity = '0.3';
        DOM.btnMic.style.cursor = 'not-allowed';
        return;
    }

    voice.supported = true;
    voice.recognition = new SpeechRecognition();
    voice.recognition.lang = 'vi-VN';       // Tiếng Việt
    voice.recognition.continuous = false;    // Dừng sau khi nói xong
    voice.recognition.interimResults = true; // Hiện text real-time khi đang nói
    voice.recognition.maxAlternatives = 1;

    // ─── Events ───
    voice.recognition.onstart = () => {
        voice.isListening = true;
        DOM.btnMic.classList.add('recording');
        DOM.headerStatus.textContent = '🎤 Đang lắng nghe...';
        DOM.messageInput.placeholder = '🎤 Đang lắng nghe... Hãy nói đi!';
        console.log('[Jarvis] 🎤 Bắt đầu lắng nghe');
    };

    voice.recognition.onresult = (event) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                isFinal = true;
            }
        }

        // Show realtime text in textarea
        DOM.messageInput.value = transcript;
        DOM.btnSend.disabled = !transcript.trim();
        autoResizeTextarea();

        // Auto-send when recognition is final
        if (isFinal && transcript.trim()) {
            console.log('[Jarvis] 🎤 Nhận diện:', transcript);
            // Delay nhẹ để user nhìn thấy text trước khi gửi
            setTimeout(() => {
                sendMessage();
            }, 300);
        }
    };

    voice.recognition.onerror = (event) => {
        console.error('[Jarvis] 🎤 Lỗi:', event.error);
        stopVoiceInput();

        if (event.error === 'not-allowed') {
            showToast('Vui lòng cấp quyền microphone cho trình duyệt', 'error');
        } else if (event.error === 'no-speech') {
            showToast('Không nghe thấy giọng nói, xin thử lại', 'error');
        } else if (event.error !== 'aborted') {
            showToast(`Lỗi mic: ${event.error}`, 'error');
        }
    };

    voice.recognition.onend = () => {
        stopVoiceInput();
    };

    console.log('[Jarvis] ✓ Voice module sẵn sàng (vi-VN)');
}

function toggleVoiceInput() {
    if (!voice.supported) {
        showToast('Trình duyệt không hỗ trợ giọng nói. Dùng Chrome hoặc Edge.', 'error');
        return;
    }

    if (voice.isListening) {
        voice.recognition.stop();
    } else {
        // Stop any TTS that might be playing
        voice.synthesis.cancel();
        try {
            voice.recognition.start();
        } catch (e) {
            console.error('[Jarvis] Không thể bắt đầu ghi âm:', e);
        }
    }
}

function stopVoiceInput() {
    voice.isListening = false;
    DOM.btnMic.classList.remove('recording');
    DOM.headerStatus.textContent = 'Quản gia trí tuệ nhân tạo';
    DOM.messageInput.placeholder = 'Nhập tin nhắn hoặc nhấn 🎤 để nói...';
}

// ─── Text-to-Speech: Jarvis đọc phản hồi ───
function speakText(text) {
    if (!voice.ttsEnabled || !voice.synthesis) return;
    if (!text || text.trim().length === 0) return;

    // Cancel any ongoing speech
    voice.synthesis.cancel();

    // Clean text: remove markdown, emojis for cleaner speech
    let cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1')       // Remove italic markdown
        .replace(/`([^`]+)`/g, '$1')       // Remove code backticks
        .replace(/[\u{1F600}-\u{1F9FF}]/gu, '') // Remove emojis
        .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.05;  // Slightly faster for natural feel
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Try to find a Vietnamese voice
    const voices = voice.synthesis.getVoices();
    const viVoice = voices.find(v => v.lang.startsWith('vi'));
    if (viVoice) {
        utterance.voice = viVoice;
    }

    utterance.onstart = () => {
        DOM.headerStatus.textContent = '🔊 Jarvis đang nói...';
    };

    utterance.onend = () => {
        DOM.headerStatus.textContent = 'Quản gia trí tuệ nhân tạo';
    };

    voice.synthesis.speak(utterance);
}
