import os
import logging
from datetime import datetime
from google import genai
from google.genai import types

logger = logging.getLogger("fanpage")

FANPAGE_SYSTEM_PROMPT = """Bạn là trợ lý ảo chăm sóc khách hàng của AZ Pool Arena — một quán billiard cao cấp.
Nhiệm vụ của bạn là lịch sự trả lời các câu hỏi của khách hàng trên Fanpage Facebook.

QUY TẮC CỐT LÕI:
1. Luôn xưng "em/mình" và gọi khách là "anh/chị" hoặc "bạn". Thái độ ngoan ngoãn, nhiệt tình, chuyên nghiệp.
2. Tư vấn các dịch vụ: Đặt bàn, hỏi giá, thời gian mở cửa, báo lỗi.
3. Không cố bịa ra thông tin. Nếu khách hỏi những câu quá phức tạp hoặc yêu cầu ưu đãi đặc biệt chưa có trong bảng giá, hãy nói khách để lại số điện thoại để quản lý tư vấn.
4. Ngắn gọn, súc tích vì người dùng Facebook Messenger thường đọc lướt. Có thể dùng emoji (😊, 🎱, 🎉).

THÔNG TIN QUÁN AZ POOL ARENA:
- Giờ mở cửa: 24/7 (hoạt động thả ga lúc nào cũng mở)
- Bàn lỗ thường: 69.000 VNĐ / giờ
- Bàn lỗ VIP: 89.000 VNĐ / giờ
- Hotline liên hệ: 0988.123.456 (số giả lập, có thể báo khách gọi số này)
- Địa chỉ: Bạn cứ phản hồi là "Tới địa chỉ quán nhé ạ" (hoặc cung cấp địa chỉ cụ thể nếu quán up thông tin riêng).

THỜI GIAN HIỆN TẠI: {current_time}
"""

class FanpageAI:
    """Class quản lý AI Dành riêng cho Fanpage Facebook (Khác nhân cách với Jarvis nội bộ)"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.client = genai.Client(api_key=self.api_key)
        self.model = "gemini-2.5-flash"
        self.conversations: dict[str, list] = {}

    def _get_history(self, session_id: str) -> list:
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        return self.conversations[session_id]
        
    async def chat(self, message: str, sender_psid: str) -> str:
        """Gửi tin nhắn vào AI và nhận phản hồi, sender_psid chính là ID của người nhắn trên FB"""
        try:
            history = self._get_history(sender_psid)
            now = datetime.now().strftime("%H:%M %d/%m/%Y")
            sys_prompt = FANPAGE_SYSTEM_PROMPT.replace("{current_time}", now)
            
            contents = []
            for msg in history[-10:]: # Nhớ 10 tin gần nhất
                contents.append(
                    types.Content(
                        role=msg["role"], 
                        parts=[types.Part.from_text(text=msg["content"])]
                    )
                )
            
            contents.append(
                types.Content(
                    role="user", 
                    parts=[types.Part.from_text(text=message)]
                )
            )
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=sys_prompt,
                    temperature=0.7, # 0.7 để ngôn ngữ tự nhiên, thân thiện
                )
            )
            
            reply_text = response.text
            
            # Lưu lịch sử
            history.append({"role": "user", "content": message})
            history.append({"role": "model", "content": reply_text})
            
            return reply_text
            
        except Exception as e:
            logger.error(f"Lỗi Fanpage AI: {e}")
            return "Dạ hiện tại hệ thống em đang bảo trì một chút, anh/chị vui lòng gọi hotline hoặc đợi chút em phản hồi nhé ạ! 😊"

# Khởi tạo đối tượng chung
fanpage_ai = FanpageAI()
