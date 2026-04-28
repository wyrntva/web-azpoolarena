"""
Jarvis MQTT Controller — Điều khiển thiết bị thông qua MQTT.
Kết nối với broker MQTT và gửi lệnh điều khiển thiết bị từ Jarvis AI.
"""

import os
import json
import logging
import paho.mqtt.client as mqtt

logger = logging.getLogger("jarvis.mqtt")

# MQTT Topics
TOPIC_DEVICE_COMMAND = "azpool/devices/command"
TOPIC_DEVICE_STATUS = "azpool/devices/status"
TOPIC_JARVIS_LOG = "azpool/jarvis/log"


class MQTTController:
    """Điều khiển thiết bị AZ Pool Arena qua MQTT."""
    
    def __init__(self, host: str = None, port: int = None):
        self.host = host or os.environ.get("MQTT_HOST", "192.168.1.188")
        self.port = port or int(os.environ.get("MQTT_PORT", "1883"))
        
        self.client = mqtt.Client(client_id="jarvis-ai-controller", protocol=mqtt.MQTTv5)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.connected = False
        
        # Device status cache
        self.device_status: dict[str, dict] = {}
        
    def connect(self):
        """Kết nối tới MQTT broker."""
        try:
            self.client.connect(self.host, self.port, keepalive=60)
            self.client.loop_start()
            logger.info(f"✓ Đang kết nối MQTT broker: {self.host}:{self.port}")
        except Exception as e:
            logger.error(f"✗ Không thể kết nối MQTT: {e}")
    
    def disconnect(self):
        """Ngắt kết nối MQTT."""
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("Đã ngắt kết nối MQTT.")
    
    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.connected = True
            logger.info("✓ Đã kết nối MQTT broker thành công!")
            # Subscribe to device status updates
            client.subscribe(TOPIC_DEVICE_STATUS + "/#")
        else:
            logger.error(f"✗ Kết nối MQTT thất bại: rc={rc}")
    
    def _on_message(self, client, userdata, msg):
        """Xử lý tin nhắn nhận được từ MQTT."""
        try:
            payload = json.loads(msg.payload.decode())
            topic = msg.topic
            logger.info(f"📨 MQTT [{topic}]: {payload}")
            
            # Cập nhật cache trạng thái thiết bị
            if topic.startswith(TOPIC_DEVICE_STATUS):
                device_key = topic.replace(TOPIC_DEVICE_STATUS + "/", "")
                self.device_status[device_key] = payload
                
        except Exception as e:
            logger.warning(f"Lỗi xử lý MQTT message: {e}")
    
    def execute_command(self, command: dict) -> dict:
        """
        Thực thi lệnh điều khiển thiết bị qua MQTT.
        
        Args:
            command: Dict chứa thông tin lệnh từ Jarvis AI
                {
                    "action": "control_device",
                    "device_type": "table_light",
                    "id": 5,
                    "status": "on"
                }
        
        Returns:
            Dict kết quả thực thi
        """
        try:
            action = command.get("action")
            
            if action == "control_device":
                return self._control_device(command)
            else:
                logger.warning(f"Hành động không được hỗ trợ: {action}")
                return {"success": False, "error": f"Hành động không hỗ trợ: {action}"}
                
        except Exception as e:
            logger.error(f"Lỗi thực thi lệnh: {e}")
            return {"success": False, "error": str(e)}
    
    def _control_device(self, command: dict) -> dict:
        """Gửi lệnh điều khiển thiết bị qua API của Backend (giống như thao tác trên UI)."""
        import requests
        
        device_type = command.get("device_type", "unknown").lower()
        device_id = command.get("id", 0)
        status = command.get("status", "off").lower()
        is_active = (status == "on")
        
        api_url = os.environ.get("API_BASE_URL", "http://192.168.1.188:8000")
        
        try:
            # 1. Fetch danh sách thiết bị từ Backend
            res = requests.get(f"{api_url}/api/switches", timeout=5)
            if res.status_code != 200:
                raise Exception(f"Backend API error: {res.status_code}")
            
            switches = res.json()
            matches = []
            
            for sw in switches:
                sw_name = sw.get("name", "").lower()
                sw_type = sw.get("switch_type", "").lower()
                
                # Bỏ qua những switch sai type
                if device_type == "scoreboard" and sw_type != "scoreboard": continue
                if device_type == "tv" and sw_type != "tv": continue
                if device_type == "light" and sw_type != "light": continue
                if device_type == "ac" and sw_type != "ac": continue
                if device_type == "fan" and sw_type != "fan": continue
                if device_type == "other" and sw_type != "other": continue

                if str(device_id).lower() == "all":
                    matches.append(sw)
                else:
                    # Mapping thông minh hơn một chút để tóm đúng ID
                    if str(device_id) in sw_name.split() or f"bàn {device_id}" in sw_name or f"tv {device_id}" in sw_name:
                        matches.append(sw)

            if not matches:
                return {"success": False, "error": f"Không tìm thấy thiết bị: {device_type} {device_id}"}
                
            # 2. Gửi lệnh cập nhật (PUT) cho các thiết bị khớp
            success_count = 0
            for m in matches:
                put_res = requests.put(
                    f"{api_url}/api/switches/{m['id']}",
                    json={"is_active": is_active},
                    timeout=5
                )
                if put_res.status_code == 200:
                    success_count += 1
                
            if success_count > 0:
                logger.info(f"✓ Đã điều khiển qua Backend ({success_count} thiết bị): {device_type} #{device_id} → {status}")
                return {
                    "success": True, 
                    "device_type": device_type, 
                    "device_id": device_id, 
                    "status": status,
                    "updated_count": success_count
                }
            else:
                return {"success": False, "error": "Lỗi khi gọi lệnh PUT tới Backend."}
                
        except Exception as e:
            logger.error(f"Lỗi nối Backend API: {e}")
            return {"success": False, "error": str(e)}
    
    def get_device_status(self, device_type: str = None) -> dict:
        """Lấy trạng thái thiết bị từ cache."""
        if device_type:
            return {k: v for k, v in self.device_status.items() if device_type in k}
        return self.device_status
