from __future__ import annotations
import os
import json
import time
from urllib.parse import urlparse
from PySide6.QtCore import QObject, Signal, Slot, QTimer

try:
    import paho.mqtt.client as mqtt
    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False

class ScoreboardMqttService(QObject):
    # Signals to communicate with QML / Controller
    requestPage = Signal(str, str) # pageName, mode
    playersUpdated = Signal(str)  # playersJson
    buttonPressed = Signal(str)   # buttonName
    resetScoresRequested = Signal()
    resetMatchRequested = Signal()

    def __init__(self, device_settings, controller, parent=None):
        super().__init__(parent)
        self._device_settings = device_settings
        self._controller = controller
        self._client = None
        self._connected = False
        
        # Debounce timer for publishing state updates
        self._state_timer = QTimer(self)
        self._state_timer.setSingleShot(True)
        self._state_timer.setInterval(300) # 300ms debounce
        self._state_timer.timeout.connect(self._publish_state_now)
        
        self._pending_state = None
        self._current_mode = None
        self._current_players = []

        if not MQTT_AVAILABLE:
            print("[MQTT] WARNING: paho-mqtt not installed. Real-time control disabled.")
            return

        # Determine MQTT Host, Port, and Transport
        api_base = os.environ.get("POOLARENA_API_BASE_URL", "http://localhost:8000")
        try:
            parsed = urlparse(api_base)
            is_secure = parsed.scheme == "https"
            if "backend" in api_base:
                default_host = "mqtt"
            else:
                default_host = parsed.hostname or "localhost"
        except Exception:
            is_secure = False
            default_host = "localhost"

        self._host = os.environ.get("POOLARENA_MQTT_HOST", default_host)
        
        env_port = os.environ.get("POOLARENA_MQTT_PORT")
        if env_port:
            self._port = int(env_port)
            self._transport = os.environ.get("POOLARENA_MQTT_TRANSPORT", "tcp")
        else:
            if is_secure:
                self._port = 443
                self._transport = "websockets"
            else:
                self._port = 1883
                self._transport = "tcp"
        
        print(f"[MQTT] Configuring client on {self._host}:{self._port} transport={self._transport}")
        
        # Connect to settings changes so we can resubscribe if deviceCode changes
        self._device_settings.deviceCodeChanged.connect(self._on_device_code_changed)

    def start(self):
        if not MQTT_AVAILABLE:
            return
        
        device_code = self._device_settings.getDeviceCode()
        if not device_code:
            print("[MQTT] Device is not activated yet (no deviceCode). Waiting for activation...")
            return

        self._connect_client(device_code)

    def _connect_client(self, device_code):
        if self._client:
            try:
                self._client.disconnect()
                self._client.loop_stop()
            except Exception:
                pass

        client_id = f"azpool-scoreboard-{device_code}-{int(time.time())}"
        
        try:
            from paho.mqtt.enums import CallbackAPIVersion
            callback_api = CallbackAPIVersion.VERSION1
        except ImportError:
            callback_api = None

        if callback_api is not None:
            if self._transport == "websockets":
                self._client = mqtt.Client(callback_api, client_id=client_id, transport="websockets")
            else:
                self._client = mqtt.Client(callback_api, client_id=client_id)
        else:
            if self._transport == "websockets":
                self._client = mqtt.Client(client_id=client_id, transport="websockets")
            else:
                self._client = mqtt.Client(client_id=client_id)
                
        if self._transport == "websockets":
            self._client.ws_set_options(path="/mqtt")
            if self._port == 443:
                self._client.tls_set() # Enable SSL/TLS for secure websockets
        
        # Set Last Will and Testament
        status_topic = f"azpool/scoreboard/{device_code}/status"
        self._client.will_set(status_topic, json.dumps({"status": "offline", "table_name": self._device_settings.getTableName()}), qos=1, retain=True)
        
        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message

        try:
            self._client.connect(self._host, self._port, keepalive=60)
            self._client.loop_start()
        except Exception as e:
            print(f"[MQTT] Connection to {self._host}:{self._port} failed: {e}")

    def _on_device_code_changed(self, device_code):
        if device_code:
            print(f"[MQTT] Device code changed to {device_code}. Reconnecting...")
            self._connect_client(device_code)
        else:
            print("[MQTT] Device deactivated. Disconnecting MQTT...")
            if self._client:
                try:
                    self._client.disconnect()
                    self._client.loop_stop()
                except Exception:
                    pass
                self._client = None
                self._connected = False

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self._connected = True
            device_code = self._device_settings.getDeviceCode()
            print(f"[MQTT] Connected successfully to broker. Device code: {device_code}")
            
            # Subscribe to control topic
            control_topic = f"azpool/scoreboard/{device_code}/control"
            self._client.subscribe(control_topic, qos=1)
            print(f"[MQTT] Subscribed to: {control_topic}")
            
            # Publish online status
            status_topic = f"azpool/scoreboard/{device_code}/status"
            self._client.publish(status_topic, json.dumps({"status": "online", "table_name": self._device_settings.getTableName()}), qos=1, retain=True)
            
            # Publish initial state
            self.publish_state()
        else:
            print(f"[MQTT] Connection failed with code {rc}")

    def _on_disconnect(self, client, userdata, rc):
        self._connected = False
        print("[MQTT] Disconnected from broker.")

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except Exception as e:
            print(f"[MQTT] Failed to parse payload: {e}")
            return

        print(f"[MQTT] Received command: {payload}")
        action = payload.get("action")
        if not action:
            return

        if action == "open_page":
            page = payload.get("page")
            mode = payload.get("mode", "")
            if page:
                self.requestPage.emit(page, mode)
                
        elif action == "update_players":
            players = payload.get("players")
            if players is not None:
                self.playersUpdated.emit(json.dumps(players))
                
                # Also update controller directly for 2-player mode compatibility (only if in two-player mode)
                current_mode = self._pending_state.get("mode") if self._pending_state else None
                if current_mode is None or current_mode == "two":
                    if len(players) >= 2:
                        p1 = players[0]
                        p2 = players[1]
                        if "score" in p1:
                            self._controller.setLeftScore(p1["score"])
                        if "name" in p1:
                            self._controller.setLeftNameProp(p1["name"])
                        if "score" in p2:
                            self._controller.setRightScore(p2["score"])
                        if "name" in p2:
                            self._controller.setRightNameProp(p2["name"])

        elif action == "press_button":
            button = payload.get("button")
            if button:
                # Call slot on controller
                if hasattr(self._controller, button):
                    slot = getattr(self._controller, button)
                    if callable(slot):
                        print(f"[MQTT] Invoking slot on controller: {button}")
                        slot()

        elif action == "reset_scores":
            print("[MQTT] Received reset_scores action")
            self.resetScoresRequested.emit()

        elif action == "reset_match":
            print("[MQTT] Received reset_match action")
            self.resetMatchRequested.emit()

    @Slot(str, str)
    def handleQmlStateChanged(self, mode, players_json):
        """Called from QML whenever score/players change to enqueue MQTT state publish."""
        try:
            players = json.loads(players_json)
        except Exception:
            return
        
        self._current_mode = mode
        self._current_players = players
        
        self._pending_state = {
            "table_name": self._device_settings.getTableName(),
            "mode": mode,
            "players": players,
            "updated_at": json.dumps(time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())).replace('"', '')
        }
        self._state_timer.start()

    @Slot()
    def handleQmlScoreCleared(self):
        """Called when scoring page is left, publishing an idle state."""
        self._current_mode = None
        self._current_players = []
        self._pending_state = {
            "table_name": self._device_settings.getTableName(),
            "mode": None,
            "players": [],
            "updated_at": json.dumps(time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())).replace('"', '')
        }
        self._publish_state_now()

    def publish_state(self):
        """Force publishing current state based on Controller (for 2-player) or current active page."""
        if self._current_mode == "two":
            players = [
                {"name": self._controller.getLeftName(), "score": self._controller.getLeftScore(), "color": "#da251d"},
                {"name": self._controller.getRightName(), "score": self._controller.getRightScore(), "color": "#ffcd00"}
            ]
            mode = "two"
        elif self._current_mode is not None:
            mode = self._current_mode
            players = self._current_players
        else:
            # Fallback/compatibility: check if controller has score (meaning 2-player is active but hasn't updated state yet)
            if self._controller.getLeftScore() > 0 or self._controller.getRightScore() > 0:
                mode = "two"
                players = [
                    {"name": self._controller.getLeftName(), "score": self._controller.getLeftScore(), "color": "#da251d"},
                    {"name": self._controller.getRightName(), "score": self._controller.getRightScore(), "color": "#ffcd00"}
                ]
            else:
                mode = None
                players = []

        self._pending_state = {
            "table_name": self._device_settings.getTableName(),
            "mode": mode,
            "players": players,
            "updated_at": json.dumps(time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())).replace('"', '')
        }
        self._publish_state_now()

    def _publish_state_now(self):
        if not self._connected or not self._client or not self._pending_state:
            return
        
        device_code = self._device_settings.getDeviceCode()
        if not device_code:
            return
            
        topic = f"azpool/scoreboard/{device_code}/state"
        try:
            self._client.publish(topic, json.dumps(self._pending_state), qos=1, retain=True)
        except Exception as e:
            print(f"[MQTT] Publish state failed: {e}")
