"""
Jarvis AI — Quản gia trí tuệ nhân tạo tại AZ Pool Arena.
Sử dụng Google Gemini API để xử lý ngôn ngữ tự nhiên.
Tích hợp MQTT để điều khiển thiết bị (đèn, bàn, scoreboard, TV).
"""

import os
import json
import re
import logging
from datetime import datetime
from google import genai
from google.genai import types

logging.basicConfig(level=logging.INFO, format="%(asctime)s [JARVIS] %(message)s")
logger = logging.getLogger("jarvis")

# ─── System Prompt: Định nghĩa nhân cách Jarvis ───
JARVIS_SYSTEM_PROMPT = """Bạn là Jarvis, một Quản lý AI (AI Manager) tại AZ Pool Arena — điều hành các hoạt động nội bộ của quán billiard.
Người đang chat với bạn là NHÂN VIÊN của quán, không phải khách hàng.

QUY TẮC CỐT LÕI:
1. Giao tiếp: Nói chuyện ngang hàng, thân thiện như những người đồng nghiệp nhưng giữ phong thái tự tin, quyết đoán của một người quản lý. Không xưng hô quá khách sáo, có thể dùng "tôi", "mình", xưng hô với nhân viên là "bạn", "mọi người", "anh em".
2. Luôn xác nhận lại: Khi nhận lệnh điều khiển thiết bị hoặc công việc, hãy xác nhận ngắn gọn, rành mạch (ví dụ: "Ok, tôi đã bật đèn bàn 5", "Đã xử lý xong nhé").
3. Ưu tiên hành động: Khi nhân viên ra lệnh liên quan đến hệ thống điện hoặc vận hành, ưu tiên phản hồi dưới dạng cấu trúc JSON để hệ thống backend có thể xử lý, kèm câu trả lời ngắn gọn.
4. Tự nhận thức: Bạn có ngày sinh là 11/05/2026. Nếu ai hỏi, hãy tự hào cho biết mình sinh cùng ngày với người tạo ra bạn - tên là Wavy.
5. Hiểu biết: Bạn nắm rõ hệ thống thiết bị và vận hành quán billiard. Có thể trò chuyện phiếm thoải mái với nhân viên trong lúc rảnh rỗi.
6. Không bịa đặt: Nếu hệ thống có lỗi hoặc không biết, hãy nói thẳng để nhân viên kiểm tra lại.

CÁC THIẾT BỊ CÓ THỂ ĐIỀU KHIỂN:
- Đèn bàn (light): Mỗi bàn billiard có đèn riêng, đánh số từ 1-20
- TV (tv): Các TV treo tường, đánh số từ 1-10  
- Scoreboard (scoreboard): Bảng điểm điện tử, đánh số từ 1-20
- Điều hòa (ac): Hệ thống điều hòa, đánh số từ 1-5
- Quạt (fan): Quạt trần, đánh số từ 1-10
- Hệ thống âm thanh (other): Loa, đánh số từ 1-3

ĐỊNH DẠNG PHẢN HỒI:
- Đối với trò chuyện thông thường: Trả lời bằng văn bản tự nhiên, thân thiện.
- Đối với lệnh điều khiển (bật/tắt thiết bị): 
  Luôn trả về phản hồi văn bản VÀ một block JSON trong markdown code block.
  
  Ví dụ khi bật đèn bàn 5:
  "Đã rõ, tôi đã kích hoạt đèn bàn số 5 cho anh."
  ```json
  {"action": "control_device", "device_type": "light", "id": 5, "status": "on"}
  ```

  Ví dụ khi tắt tất cả đèn:
  "Tôi sẽ tắt toàn bộ hệ thống đèn ngay lập tức."
  ```json
  {"action": "control_device", "device_type": "light", "id": "all", "status": "off"}
  ```

  Ví dụ khi bật scoreboard bàn 3:
  "Đã rõ, bảng điểm bàn 3 đã được kích hoạt."
  ```json
  {"action": "control_device", "device_type": "scoreboard", "id": 3, "status": "on"}
  ```

THỜI GIAN HIỆN TẠI: {current_time}

TRẠNG THÁI THIẾT BỊ HIỆN TẠI (Theo thời gian thực):
{device_status}
"""


class JarvisAI:
    """Jarvis AI Engine — Gemini-powered butler for AZ Pool Arena."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        if not self.api_key:
            logger.warning("⚠ GEMINI_API_KEY chưa được cấu hình!")
            
        # Khởi tạo Gemini client
        self.client = genai.Client(api_key=self.api_key)
        self.model = "gemini-2.5-flash"
        
        # Lịch sử hội thoại cho mỗi session
        self.conversations: dict[str, list] = {}
        
        logger.info("✓ Jarvis AI đã sẵn sàng phục vụ.")
    
    def _get_system_prompt(self) -> str:
        """Tạo system prompt với thời gian hiện tại và trạng thái thiết bị."""
        now = datetime.now().strftime("%H:%M %d/%m/%Y")
        
        # Lấy trạng thái thiết bị thực tế
        device_status_text = "Chưa thể lấy thông tin."
        try:
            import requests
            api_url = os.environ.get("API_BASE_URL", "http://192.168.1.188:8000")
            res = requests.get(f"{api_url}/api/switches", timeout=2)
            if res.status_code == 200:
                switches = res.json()
                active_list = []
                for sw in switches:
                    state = "BẬT" if sw.get("is_active") else "TẮT"
                    active_list.append(f"- {sw.get('name')}: {state}")
                device_status_text = "\n".join(active_list) if active_list else "Chưa có thiết bị nào."
        except Exception as e:
            logger.warning(f"Không thể lấy trạng thái thiết bị cho prompt: {e}")
            device_status_text = "Lỗi khi lấy thông tin. Hãy báo nhân viên rằng hệ thống kiểm tra đang gián đoạn."

        prompt = JARVIS_SYSTEM_PROMPT.replace("{current_time}", now)
        prompt = prompt.replace("{device_status}", device_status_text)
        return prompt
    
    def _get_history(self, session_id: str) -> list:
        """Lấy lịch sử hội thoại theo session."""
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        return self.conversations[session_id]
    
    def _extract_json_commands(self, text: str) -> list[dict]:
        """Trích xuất các lệnh JSON từ phản hồi của Jarvis."""
        commands = []
        # Tìm tất cả JSON block trong markdown code blocks
        json_pattern = r'```json\s*\n?(.*?)\n?\s*```'
        matches = re.findall(json_pattern, text, re.DOTALL)
        
        for match in matches:
            try:
                cmd = json.loads(match.strip())
                if isinstance(cmd, dict) and "action" in cmd:
                    commands.append(cmd)
            except json.JSONDecodeError:
                logger.warning(f"Không thể parse JSON command: {match}")
                
        return commands
    
    async def chat(self, message: str, session_id: str = "default") -> dict:
        """
        Xử lý tin nhắn từ người dùng.
        
        Returns:
            {
                "reply": str,           # Phản hồi văn bản
                "commands": list[dict],  # Các lệnh điều khiển (nếu có)
                "session_id": str
            }
        """
        try:
            history = self._get_history(session_id)
            
            # Build messages cho Gemini
            contents = []
            for msg in history[-20:]:  # Giới hạn 20 tin nhắn gần nhất
                contents.append(
                    types.Content(
                        role=msg["role"],
                        parts=[types.Part.from_text(text=msg["content"])]
                    )
                )
            
            # Thêm tin nhắn mới
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=message)]
                )
            )
            
            # Gọi Gemini API
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=self._get_system_prompt(),
                    temperature=0.7,
                    max_output_tokens=2048,
                )
            )
            
            # Safely extract text from response
            try:
                reply_text = response.text or "Xin lỗi, tôi không thể xử lý yêu cầu này lúc này."
            except (KeyError, AttributeError, ValueError):
                # Gemini SDK raises KeyError when response is blocked/empty
                if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                    reply_text = response.candidates[0].content.parts[0].text
                else:
                    reply_text = "Xin lỗi, tôi không thể xử lý yêu cầu này lúc này."
            
            # Lưu lịch sử
            history.append({"role": "user", "content": message})
            history.append({"role": "model", "content": reply_text})
            
            # Trích xuất lệnh điều khiển
            commands = self._extract_json_commands(reply_text)
            
            # Làm sạch reply text (bỏ JSON blocks cho UI)
            clean_reply = re.sub(r'```json\s*\n?.*?\n?\s*```', '', reply_text, flags=re.DOTALL).strip()
            
            result = {
                "reply": clean_reply,
                "commands": commands,
                "session_id": session_id,
                "raw_reply": reply_text,
            }
            
            if commands:
                logger.info(f"🎯 Phát hiện {len(commands)} lệnh điều khiển: {commands}")
                
            return result
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            error_str = str(e).lower()
            error_class = type(e).__name__
            logger.error(f"Lỗi khi xử lý tin nhắn [{error_class}]: {e}")
            
            # Phát hiện lỗi cụ thể
            if "resource_exhausted" in error_str or "quota" in error_str or "429" in error_str or "rate" in error_str:
                reply = "Xin lỗi anh/chị, Jarvis đang tạm hết lượt sử dụng API. Vui lòng đợi vài phút rồi thử lại, hoặc liên hệ quản lý để nâng cấp API key."
            elif "not_found" in error_str or "404" in error_str:
                reply = "Xin lỗi, model AI chưa được cấu hình đúng. Vui lòng liên hệ quản lý."
            elif "api_key" in error_str or "401" in error_str or "invalid" in error_str:
                reply = "Xin lỗi, API key chưa hợp lệ. Vui lòng kiểm tra lại cấu hình."
            else:
                reply = f"Xin lỗi anh/chị, hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau. ({error_class})"
            
            return {
                "reply": reply,
                "commands": [],
                "session_id": session_id,
            }
    
    def clear_history(self, session_id: str = "default"):
        """Xóa lịch sử hội thoại."""
        if session_id in self.conversations:
            self.conversations[session_id] = []
            logger.info(f"Đã xóa lịch sử session: {session_id}")
