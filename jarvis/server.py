"""
Jarvis Web Server — FastAPI backend cho giao diện web chat.
Cung cấp REST API và WebSocket real-time cho Jarvis AI.
"""

import os
import uuid
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from jarvis_ai import JarvisAI
from mqtt_controller import MQTTController

# Load .env
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [JARVIS-WEB] %(message)s")
logger = logging.getLogger("jarvis.web")

# ─── Global instances ───
jarvis: JarvisAI = None
mqtt_ctrl: MQTTController = None

# Static files directory
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Khởi tạo và dọn dẹp tài nguyên."""
    global jarvis, mqtt_ctrl
    
    # Startup
    jarvis = JarvisAI()
    mqtt_ctrl = MQTTController()
    mqtt_ctrl.connect()
    logger.info("🤖 Jarvis Web Server đã sẵn sàng!")
    
    yield
    
    # Shutdown
    mqtt_ctrl.disconnect()
    logger.info("Jarvis Web Server đã tắt.")


app = FastAPI(
    title="Jarvis AI — AZ Pool Arena",
    description="Quản gia trí tuệ nhân tạo cho AZ Pool Arena",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routes ───

@app.get("/", response_class=HTMLResponse)
async def home():
    """Serve giao diện chat Jarvis."""
    html_file = STATIC_DIR / "index.html"
    if html_file.exists():
        resp = FileResponse(str(html_file))
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return resp
    return HTMLResponse("<h1>Jarvis AI — Static files not found</h1>")


@app.get("/static/{file_path:path}")
async def serve_static(file_path: str):
    """Serve static files (CSS, JS, images)."""
    full_path = STATIC_DIR / file_path
    # Strip query params (cache busting ?v=2)
    clean_path = file_path.split("?")[0]
    full_path = STATIC_DIR / clean_path
    if full_path.exists() and full_path.is_file():
        resp = FileResponse(str(full_path))
        resp.headers["Cache-Control"] = "no-cache, must-revalidate"
        return resp
    return JSONResponse(status_code=404, content={"error": "File not found"})


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "online",
        "name": "Jarvis AI",
        "version": "1.0.0",
        "mqtt_connected": mqtt_ctrl.connected if mqtt_ctrl else False,
    }


@app.post("/api/chat")
async def chat_endpoint(request: Request):
    """REST API cho chat với Jarvis."""
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})
    
    message = payload.get("message", "").strip()
    session_id = payload.get("session_id", "default")
    
    if not message:
        return {"error": "Tin nhắn không được để trống"}
    
    # Gọi Jarvis AI
    result = await jarvis.chat(message, session_id)
    
    # Thực thi lệnh điều khiển nếu có
    executed_commands = []
    for cmd in result.get("commands", []):
        try:
            exec_result = mqtt_ctrl.execute_command(cmd)
            executed_commands.append(exec_result)
        except Exception as e:
            executed_commands.append({"success": False, "error": str(e)})
    
    result["executed_commands"] = executed_commands
    return result


@app.post("/api/clear-history")
async def clear_history(request: Request):
    """Xóa lịch sử hội thoại."""
    try:
        payload = await request.json()
        session_id = payload.get("session_id", "default")
    except Exception:
        session_id = "default"
    jarvis.clear_history(session_id)
    return {"success": True, "message": "Lịch sử đã được xóa."}


# ─── FACEBOOK MESSENGER WEBHOOK ───
FB_VERIFY_TOKEN = os.environ.get("FB_VERIFY_TOKEN", "azpoolarena")
FB_PAGE_ACCESS_TOKEN = os.environ.get("FB_PAGE_ACCESS_TOKEN", "")

@app.get("/webhook")
async def fb_verify(request: Request):
    """Xác minh Webhook với Facebook."""
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == FB_VERIFY_TOKEN:
            logger.info("✓ FB Webhook Verified!")
            return HTMLResponse(content=challenge, status_code=200)
        else:
            return JSONResponse(content={"error": "Verification failed"}, status_code=403)
    return JSONResponse(status_code=400, content={"error": "Invalid request"})

@app.post("/webhook")
async def fb_message_webhook(request: Request):
    """Nhận tin nhắn từ Facebook Messenger và phản hồi tự động."""
    import httpx
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid format"})

    from fanpage_ai import fanpage_ai

    if body.get("object") == "page":
        for entry in body.get("entry", []):
            webhook_event = entry.get("messaging", [{}])[0]
            sender_psid = webhook_event.get("sender", {}).get("id")
            
            if webhook_event.get("message") and not webhook_event["message"].get("is_echo"):
                msg_text = webhook_event["message"].get("text", "")
                
                if sender_psid and msg_text:
                    logger.info(f"Fanpage nhận tin: {msg_text} từ PSID {sender_psid}")
                    
                    # Gọi AI Trợ lý Fanpage
                    reply_text = await fanpage_ai.chat(msg_text, sender_psid)
                    
                    # Trả lời về Facebook
                    if FB_PAGE_ACCESS_TOKEN:
                        url = f"https://graph.facebook.com/v22.0/me/messages?access_token={FB_PAGE_ACCESS_TOKEN}"
                        payload = {
                            "recipient": {"id": sender_psid},
                            "message": {"text": reply_text}
                        }
                        async with httpx.AsyncClient() as client:
                            await client.post(url, json=payload)
                    else:
                        logger.warning("Chưa có FB_PAGE_ACCESS_TOKEN để nhắn lại FB!")
                    
        return HTMLResponse(content="EVENT_RECEIVED", status_code=200)
    else:
        return JSONResponse(status_code=404, content={"error": "Not Found"})


# ─── WebSocket cho real-time chat ───

class ConnectionManager:
    """Quản lý WebSocket connections."""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client kết nối: {client_id}")
    
    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
        logger.info(f"Client ngắt kết nối: {client_id}")
    
    async def send_message(self, message: dict, client_id: str):
        ws = self.active_connections.get(client_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.warning(f"Lỗi gửi WS message: {e}")


ws_manager = ConnectionManager()


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint cho real-time chat."""
    await ws_manager.connect(websocket, client_id)
    
    # Gửi welcome message
    await ws_manager.send_message({
        "type": "welcome",
        "reply": "Xin chào! Tôi là Jarvis, quản gia AI tại AZ Pool Arena. Tôi có thể giúp gì cho anh/chị?",
        "commands": [],
    }, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            message = data.get("message", "").strip()
            
            if not message:
                continue
            
            # Gửi typing indicator
            await ws_manager.send_message({"type": "typing"}, client_id)
            
            try:
                # Gọi Jarvis AI
                result = await jarvis.chat(message, session_id=client_id)
                
                # Thực thi lệnh điều khiển
                executed_commands = []
                for cmd in result.get("commands", []):
                    try:
                        exec_result = mqtt_ctrl.execute_command(cmd)
                        executed_commands.append(exec_result)
                    except Exception as e:
                        executed_commands.append({"success": False, "error": str(e)})
                
                # Gửi phản hồi
                await ws_manager.send_message({
                    "type": "reply",
                    "reply": result["reply"],
                    "commands": result.get("commands", []),
                    "executed_commands": executed_commands,
                }, client_id)
                
            except Exception as e:
                logger.error(f"Lỗi xử lý tin nhắn: {e}")
                await ws_manager.send_message({
                    "type": "reply",
                    "reply": f"Xin lỗi, hệ thống gặp sự cố tạm thời. Lỗi: {str(e)}",
                    "commands": [],
                    "executed_commands": [],
                }, client_id)
            
    except WebSocketDisconnect:
        ws_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(client_id)
