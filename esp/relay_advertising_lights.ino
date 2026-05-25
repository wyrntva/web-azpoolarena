#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoOTA.h>
#include <ArduinoJson.h>

// ===== WIFI =====
const char* ssid = "AZ POOLARENA";
const char* password = "66668888";

// ===== IP TĨNH =====
IPAddress staticIP(192, 168, 1, 134);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);

// ===== BACKEND =====
const char* backendHost = "192.168.1.188";
const int backendPort = 8000;
const char* DEVICE_CODE = "DENB01";  // Mã thiết bị - nhập giống trên web
const unsigned long POLL_INTERVAL = 3000; // 3 giây
unsigned long lastPoll = 0;

// ===== RELAY =====
#define RELAY_1 D1
#define RELAY_2 D2
bool relay1State = false;
bool relay2State = false;

// ===== WEB SERVER (vẫn giữ để điều khiển trực tiếp) =====
ESP8266WebServer server(80);

// ===== CORS HEADERS =====
void sendCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ===== RELAY CONTROL =====
void setRelay(int channel, bool on) {
  if (channel == 1 || channel == 0) {
    digitalWrite(RELAY_1, on ? HIGH : LOW);
    relay1State = on;
    Serial.printf("Relay 1: %s\n", on ? "BAT" : "TAT");
  }
  if (channel == 2 || channel == 0) {
    digitalWrite(RELAY_2, on ? HIGH : LOW);
    relay2State = on;
    Serial.printf("Relay 2: %s\n", on ? "BAT" : "TAT");
  }
}

// ===== JSON HELPERS =====
String stateJson(int channel) {
  if (channel == 1) {
    return "{\"success\":true,\"relay\":1,\"state\":\"" + String(relay1State ? "on" : "off") + "\"}";
  } else if (channel == 2) {
    return "{\"success\":true,\"relay\":2,\"state\":\"" + String(relay2State ? "on" : "off") + "\"}";
  } else {
    return "{\"success\":true,\"relay1\":\"" + String(relay1State ? "on" : "off") +
           "\",\"relay2\":\"" + String(relay2State ? "on" : "off") + "\"}";
  }
}

// ===== API: RELAY 1 =====
void handle1On()     { setRelay(1, true);  sendCORS(); server.send(200, "application/json", stateJson(1)); }
void handle1Off()    { setRelay(1, false); sendCORS(); server.send(200, "application/json", stateJson(1)); }
void handle1Toggle() { setRelay(1, !relay1State); sendCORS(); server.send(200, "application/json", stateJson(1)); }
void handle1Status() { sendCORS(); server.send(200, "application/json", stateJson(1)); }

// ===== API: RELAY 2 =====
void handle2On()     { setRelay(2, true);  sendCORS(); server.send(200, "application/json", stateJson(2)); }
void handle2Off()    { setRelay(2, false); sendCORS(); server.send(200, "application/json", stateJson(2)); }
void handle2Toggle() { setRelay(2, !relay2State); sendCORS(); server.send(200, "application/json", stateJson(2)); }
void handle2Status() { sendCORS(); server.send(200, "application/json", stateJson(2)); }

// ===== API: CẢ 2 RELAY =====
void handleAllOn()     { setRelay(0, true);  sendCORS(); server.send(200, "application/json", stateJson(0)); }
void handleAllOff()    { setRelay(0, false); sendCORS(); server.send(200, "application/json", stateJson(0)); }
void handleAllStatus() {
  sendCORS();
  String ip = WiFi.localIP().toString();
  String json = "{\"success\":true,\"ip\":\"" + ip +
    "\",\"relay1\":\"" + String(relay1State ? "on" : "off") +
    "\",\"relay2\":\"" + String(relay2State ? "on" : "off") +
    "\",\"hostname\":\"" + ArduinoOTA.getHostname() + "\"}";
  server.send(200, "application/json", json);
}

void handleOptions() { sendCORS(); server.send(204, "", ""); }
void handleNotFound() { sendCORS(); server.send(404, "application/json", "{\"success\":false,\"error\":\"not found\"}"); }

// ===== POLLING BACKEND =====
void pollBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;

  String url = "http://" + String(backendHost) + ":" + String(backendPort) +
               "/api/switches/esp-status?code=" + String(DEVICE_CODE) +
               "&ip=" + WiFi.localIP().toString();

  http.begin(client, url);
  http.setTimeout(3000);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();

    // Parse JSON: {"relays": [{"channel": 1, "active": true}, {"channel": 2, "active": false}]}
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      JsonArray relays = doc["relays"];
      for (JsonObject relay : relays) {
        int channel = relay["channel"] | 0;
        bool active = relay["active"] | false;

        // Chỉ thay đổi relay nếu trạng thái khác
        if (channel == 1 && active != relay1State) {
          setRelay(1, active);
          Serial.printf("[POLL] Relay 1 -> %s\n", active ? "BAT" : "TAT");
        }
        if (channel == 2 && active != relay2State) {
          setRelay(2, active);
          Serial.printf("[POLL] Relay 2 -> %s\n", active ? "BAT" : "TAT");
        }
      }
    } else {
      Serial.printf("[POLL] JSON error: %s\n", error.c_str());
    }
  } else {
    Serial.printf("[POLL] HTTP error: %d\n", httpCode);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_1, OUTPUT);
  pinMode(RELAY_2, OUTPUT);
  digitalWrite(RELAY_1, LOW); // tắt mặc định
  digitalWrite(RELAY_2, LOW); // tắt mặc định

  // ===== KẾT NỐI WIFI (IP TĨNH) =====
  WiFi.config(staticIP, gateway, subnet, dns);
  WiFi.begin(ssid, password);
  Serial.print("Dang ket noi WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nDa ket noi!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // ===== OTA =====
  ArduinoOTA.setHostname("relay_advertising_lights");
  ArduinoOTA.setPassword("admin");

  ArduinoOTA.onStart([]() { Serial.println("Bat dau update..."); });
  ArduinoOTA.onEnd([]() { Serial.println("\nUpdate xong!"); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Tien do: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) { Serial.printf("Loi[%u]: ", error); });
  ArduinoOTA.begin();
  Serial.println("San sang OTA!");

  // ===== WEB SERVER ROUTES =====
  // Relay 1
  server.on("/1/on",     HTTP_GET, handle1On);
  server.on("/1/off",    HTTP_GET, handle1Off);
  server.on("/1/toggle", HTTP_GET, handle1Toggle);
  server.on("/1/status", HTTP_GET, handle1Status);

  // Relay 2
  server.on("/2/on",     HTTP_GET, handle2On);
  server.on("/2/off",    HTTP_GET, handle2Off);
  server.on("/2/toggle", HTTP_GET, handle2Toggle);
  server.on("/2/status", HTTP_GET, handle2Status);

  // Cả 2
  server.on("/on",     HTTP_GET, handleAllOn);
  server.on("/off",    HTTP_GET, handleAllOff);
  server.on("/status", HTTP_GET, handleAllStatus);

  // CORS
  server.on("/1/on",  HTTP_OPTIONS, handleOptions);
  server.on("/1/off", HTTP_OPTIONS, handleOptions);
  server.on("/2/on",  HTTP_OPTIONS, handleOptions);
  server.on("/2/off", HTTP_OPTIONS, handleOptions);
  server.on("/on",    HTTP_OPTIONS, handleOptions);
  server.on("/off",   HTTP_OPTIONS, handleOptions);
  server.on("/status",HTTP_OPTIONS, handleOptions);

  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("HTTP server port 80");
  Serial.println("Polling backend moi 3 giay...");
}

void loop() {
  ArduinoOTA.handle();
  server.handleClient();

  // === Polling backend mỗi 3 giây ===
  if (millis() - lastPoll >= POLL_INTERVAL) {
    lastPoll = millis();
    pollBackend();
  }
}
