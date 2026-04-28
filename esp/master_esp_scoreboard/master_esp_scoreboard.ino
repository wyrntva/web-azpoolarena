#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiUdp.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>

// =====================================
// 1. CẤU HÌNH THÔNG SỐ TOÀN CỤC
// =====================================
const char* WIFI_SSID     = "AZ POOLARENA";
const char* WIFI_PASS     = "66668888";

// Cấu trúc IP của Backend Máy Chủ
const char* BACKEND_IP    = "192.168.1.188";
const char* API_URL       = "http://192.168.1.188:8000/api/areas";
const int   MQTT_PORT     = 1883;

// Các cổng LAN UDP 
const int   UDP_PORT      = 5555; 

WiFiClient espClient;
PubSubClient mqttClient(espClient);
WiFiUDP udp;

struct ScoreboardInfo {
  String tableName;
  String ipStr;
  byte   macBytes[6];
  
  bool isValid;            // Data xịn tải từ Server về?
  bool isOnline;           // Điện trên thực tế đang Bật hay Tắt?
  
  unsigned long lastPingMs; 
  unsigned long lastSeenMs; 
};

// Quản lý tối đa 20 máy lạnh / Bảng tỉ số (Tuỳ quy mô quán đổi lên 50)
const int MAX_TABLES = 20; 
ScoreboardInfo scoreboards[MAX_TABLES];

// Quản lý Thiết Bị Không Dây (Cắm Là Chạy) -> Theo dõi trạng thái Mất Điện/Rớt Mạng
struct PnPDevice {
  String type;
  String name;
  bool isNetworkAlive;
  unsigned long lastSeenMs;
};
const int MAX_PNP = 50;
PnPDevice pnpDevices[MAX_PNP];

// =====================================
// 2. CÁC HÀM XỬ LÝ SÓNG MẠNG
// =====================================
void parseMacStr(const char* macStr, byte* macArray) {
  sscanf(macStr, "%x:%x:%x:%x:%x:%x", 
        &macArray[0], &macArray[1], &macArray[2],
        &macArray[3], &macArray[4], &macArray[5]);
}

// ------ Lỗ Tai Lắng Nghe Web Frontend Bấm Nút --------
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Bắt Sóng Kênh Điều Khiển
  if (strcmp(topic, "azpool/master_esp/control") == 0) {
    char jsonMsg[128];
    for (int i = 0; i < length; i++) jsonMsg[i] = (char)payload[i];
    jsonMsg[length] = '\0'; 

    Serial.println("[MQTT THẦN TỐC] <= Server bảo: " + String(jsonMsg));

    StaticJsonDocument<128> doc;
    if (!deserializeJson(doc, jsonMsg)) {
      String type = doc["type"];        // "scoreboard", "tv", "light",...
      String rawTarget = doc["target"]; // "TV Sảnh Chờ"
      String tName = doc["table_name"]; // Scoreboard PC liên kết với "Bàn x"
      String action = doc["action"];    // "ON" hay "OFF"

      if (type == "scoreboard") {
        for (int i = 0; i < MAX_TABLES; i++) {
          if (scoreboards[i].isValid && scoreboards[i].tableName == tName) {
             if (action == "ON") {
                turnOnScoreboard(i);
                scoreboards[i].isOnline = true;
             } else if (action == "OFF") {
                turnOffScoreboard(i);
                scoreboards[i].isOnline = false;
             }
             break;
          }
        }
      } else {
        // Broadcast Control cho TV, Light, Relay rời
        udp.beginPacket("255.255.255.255", 7777);
        if (action == "ON") {
           udp.println("CMD_ON:" + rawTarget);
        } else {
           udp.println("CMD_OFF:" + rawTarget);
        }
        udp.endPacket();
        Serial.println("[PHÁT SÓNG ĐIỀU KHIỂN RỜI] => " + rawTarget + " | Lệnh: " + action);
      }
    }
  }
}

// ------ Kết Cấu Chân Mệnh MQTT --------
void setupMQTT() {
  mqttClient.setServer(BACKEND_IP, MQTT_PORT);
  mqttClient.setCallback(mqttCallback); 
  
  while (!mqttClient.connected()) {
    Serial.print("Đang móc MQTT vào Backend...");
    
    // Đặt tên Client tuỳ ý tránh nhảy ID
    if (mqttClient.connect("MasterESP32_CORE_007")) {
      Serial.println(" OK!");
      // 🚨 Mở cửa sổ đón nhận chỉ thị từ Frontend Web
      mqttClient.subscribe("azpool/master_esp/control"); 
    } else {
      Serial.print("Lỗi, state= "); Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

// ------ Khẩu Hình Báo Cáo Cháy/Sập lên Web --------
void reportStatusToBackend(String tableName, bool isOnline) {
  if (!mqttClient.connected()) setupMQTT();

  StaticJsonDocument<128> doc;
  doc["table_name"] = tableName;
  doc["is_active"] = isOnline;
  
  char jsonBuffer[128];
  serializeJson(doc, jsonBuffer);

  mqttClient.publish("azpool/master_esp/report", jsonBuffer);
  Serial.println("[MQTT BÁO LÊN CLOUD] => " + String(jsonBuffer));
}


// =====================================
// 3. DAO ĐỘNG UDP: WAKE-ON-LAN & SHUTDOWN 
// =====================================
void turnOnScoreboard(int index) {
  if (!scoreboards[index].isValid) return;
  
  // Nẹp Thư Chú Thuật WOL Toàn Mạng Bảng Điểm (Tác động vào hệ điều hành PC)
  byte magicPacket[102];
  for(int i = 0; i < 6; i++) magicPacket[i] = 0xFF; 
  for(int i = 1; i <= 16; i++) {
    for(int j = 0; j < 6; j++) {
      magicPacket[i * 6 + j] = scoreboards[index].macBytes[j]; 
    }
  }
  udp.beginPacket("255.255.255.255", 9); 
  udp.write(magicPacket, 102);
  udp.endPacket();

  Serial.println("[WOL BẬT CHIẾN DỊCH PC SCOREBOARD] Mệnh lệnh gửi cho: " + scoreboards[index].tableName);
}

void turnOffScoreboard(int index) {
  if (!scoreboards[index].isValid || scoreboards[index].ipStr == "") return;
  
  // Bắn lệnh Shutdown Unicast vào phần mềm Python Scoreboard trên PC (Cổng 5555)
  udp.beginPacket(scoreboards[index].ipStr.c_str(), UDP_PORT);
  udp.printf("SHUTDOWN_SCOREBOARD");
  udp.endPacket();

  Serial.println("[UDP BẮN NÚT NGUỒN TẮT PC] Bàn: " + scoreboards[index].tableName);
}


// =====================================
// 4. API & TUẦN TRA QUAN TRẮC SỨC KHOẺ
// =====================================
void syncScoreboardDataFromBackend() {
  Serial.println("Đang kết nối Backend để tải dữ liệu Hệ Sinh Thái...");
  HTTPClient http;
  http.begin(API_URL);
  
  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    
    // Tăng khung lên 24KB để tránh LỖI ESP k lôi được từ điển Data của Bàn 1
    DynamicJsonDocument doc(24576); 
    
    DeserializationError error = deserializeJson(doc, http.getString());
    if (error) {
       Serial.print("[LỖI CHẾT NGƯỜI] Ép dữ liệu bị tràn RAM rách bọc: ");
       Serial.println(error.c_str());
       return;
    }
    
    int index = 0;
    for (JsonObject area : doc.as<JsonArray>()) {
      for (JsonObject table : area["tables"].as<JsonArray>()) {
        if(index >= MAX_TABLES) break;
        
        const char* deviceIp = table["device_ip"];
        const char* deviceMac = table["device_mac"];
        
        scoreboards[index].tableName = String(table["name"].as<const char*>());
        scoreboards[index].isOnline = false; // Ngầm định máy đang Chết
        scoreboards[index].lastSeenMs = millis(); // Cho sống tạm lúc bắt đầu để lấy đà
        
        // FIX: Rải đều thời gian Ping, mỗi bàn cách nhau 600ms để WiFi không bị "nghẽn cổ chai" (Buffer Overflow) do phóng 15 kiện hàng cùng 1 miligiây.
        scoreboards[index].lastPingMs = millis() + (index * 600);

        if (deviceIp && deviceMac) {
           scoreboards[index].ipStr = String(deviceIp);
           parseMacStr(deviceMac, scoreboards[index].macBytes);
           scoreboards[index].isValid = true;
           Serial.println(" + Đã Nạp thành công vào não: " + scoreboards[index].tableName);
        } else {
           scoreboards[index].isValid = false;
        }
        index++;
      }
    }
    Serial.println("[ĐỒNG BỘ NẠP DATA] Xong! Hệ thống sẵn sàng trảm.");
  } else {
    Serial.println("[LỖI] Không thể móc API Database!");
  }
  http.end();
}

void loopCheckScoreboardsHealth() {
  unsigned long now = millis();
  
  for (int i = 0; i < MAX_TABLES; i++) {
    if (!scoreboards[i].isValid) continue;

    // A. Cách nhau 5s quăng cái Ping UDP đi rờ máy con
    if (now - scoreboards[i].lastPingMs > 5000) {
      scoreboards[i].lastPingMs = now;
      
      // Ping tivi/PC Scoreboard cũ (Python app chạy cổng 5555)
      udp.beginPacket(scoreboards[i].ipStr.c_str(), UDP_PORT);
      udp.printf("STATUS_CHECK");
      udp.endPacket();

      // Đồng thời Gào tên điểm danh Tivi ESP (Để nó sủa "STATUS_ON" về cổng 5555)
      udp.beginPacket("255.255.255.255", 7777);
      udp.println("STATUS_CHECK:" + scoreboards[i].tableName);
      udp.endPacket();
    }

    // B. Tăng giới hạn chịu đựng lên 35 giây (Cho phép rớt liên tục 6 gói tin UDP do mạng nhiễu) mới được phép Khai Tử!
    if (scoreboards[i].isOnline && (now - scoreboards[i].lastSeenMs > 35000)) {
       scoreboards[i].isOnline = false;
       reportStatusToBackend(scoreboards[i].tableName, false); // Ném qua Web báo đỏ
       Serial.println("[ĐÃ MẤT LIÊN LẠC] Bàn " + scoreboards[i].tableName);
    }
  }

  // C. Theo dõi sức khoẻ Mạng/Nguồn của Thiết bị cắm là chạy (Tivi, Đèn...)
  for (int i = 0; i < MAX_PNP; i++) {
     if (pnpDevices[i].name != "" && pnpDevices[i].isNetworkAlive) {
         if (now - pnpDevices[i].lastSeenMs > 35000) {
             pnpDevices[i].isNetworkAlive = false;
             
             // Báo tử sự cố rớt nguồn/mất wifi lên Web Backend (Ép tivi thành OFF luôn)
             StaticJsonDocument<128> doc;
             doc["name"] = pnpDevices[i].name;
             doc["switch_type"] = pnpDevices[i].type;
             doc["is_active"] = false; 
             
             char buf[128];
             serializeJson(doc, buf);
             if (!mqttClient.connected()) setupMQTT();
             mqttClient.publish("azpool/master_esp/discovery", buf);
             
             Serial.println("[BÁO TỬ LÂM SÀNG] Thiết bị " + pnpDevices[i].name + " mất tín hiệu, ép OFF!");
         }
     }
  }
}

void handleIncomingUDP() {
  int packetSize = udp.parsePacket();
  if (packetSize) {
    char packetBuffer[255];
    int len = udp.read(packetBuffer, 254);
    if (len > 0) packetBuffer[len] = '\0';
    
    String req = String(packetBuffer);
    req.trim();
    String senderIp = udp.remoteIP().toString();

    // 1. Máy con rống lên cầu cứu báo "Tôi vẫn khoẻ"
    if (req.startsWith("STATUS_ON")) {
       for (int i = 0; i < MAX_TABLES; i++) {
         if (scoreboards[i].isValid && scoreboards[i].ipStr == senderIp) {
            scoreboards[i].lastSeenMs = millis(); // Rửa tội
            
            // Nếu Web đang hiện màu Xám mà nó bật lên => Web phải nhảy Màu Xanh
            if (!scoreboards[i].isOnline) {
               scoreboards[i].isOnline = true;
               reportStatusToBackend(scoreboards[i].tableName, true); 
               Serial.println("[SỰ SỐNG] Nhận Ping báo danh từ: " + scoreboards[i].tableName);
            }
         }
       }
    }
    
    // 2. NHẬN DIỆN VÀ CẬP NHẬT TRẠNG THÁI THIẾT BỊ (PLUG AND PLAY)
    if (req.startsWith("DEVICE_STATE:") || req.startsWith("REGISTER_DEVICE:")) {
       int firstColon = req.indexOf(':');
       int secColon = req.indexOf(':', firstColon + 1);
       int thirdColon = req.indexOf(':', secColon + 1);

       if (firstColon != -1 && secColon != -1) {
          String dType = req.substring(firstColon + 1, secColon); // tv, light, v.v..
          String dName = "";
          String dState = "";
          bool isActive = false;

          if (thirdColon != -1) {
             dName = req.substring(secColon + 1, thirdColon);
             dState = req.substring(thirdColon + 1);
             dState.trim();
             if (dState == "ON") isActive = true;
          } else {
             // Dạng cũ của REGISTER_DEVICE ko có trường State cuối
             dName = req.substring(secColon + 1);
          }

          StaticJsonDocument<128> discDoc;
          discDoc["name"] = dName;
          discDoc["switch_type"] = dType;
          if (thirdColon != -1) {
             discDoc["is_active"] = isActive; // Nếu bản tin có trạng thái thực tế
          }
          
          char jsonBuffer[128];
          serializeJson(discDoc, jsonBuffer);
          
          if (!mqttClient.connected()) setupMQTT();
          mqttClient.publish("azpool/master_esp/discovery", jsonBuffer);
          if (thirdColon != -1) {
              Serial.println("[BÁO CÁO CẬP NHẬT] Thiết bị: " + dName + " -> Thực tế đang: " + dState);
          } else {
              Serial.println("[AUTO-DISCOVERY] Đã báo cáo Web thiết bị mới: " + dName);
          }

          // Cập nhật Nhịp Tim (Rửa Tội Mạng Cục Bộ)
          bool fnd = false;
          for (int j = 0; j < MAX_PNP; j++) {
             if (pnpDevices[j].type == dType && pnpDevices[j].name == dName) {
                pnpDevices[j].isNetworkAlive = true;
                pnpDevices[j].lastSeenMs = millis();
                fnd = true; break;
             }
          }
          if (!fnd) {
             for (int j = 0; j < MAX_PNP; j++) {
               if (pnpDevices[j].name == "") {
                  pnpDevices[j].type = dType;
                  pnpDevices[j].name = dName;
                  pnpDevices[j].isNetworkAlive = true;
                  pnpDevices[j].lastSeenMs = millis();
                  break;
               }
             }
          }
       }
    }
  }
}

// =====================================
// 5. MAIN NUCLEUS LOOP
// =====================================
void setup() {
  Serial.begin(115200);
  
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("~"); }
  Serial.println("\n[SẴN SÀNG] Kết Tinh Mạng WiFi: " + WiFi.localIP().toString());
  
  udp.begin(UDP_PORT);
  setupMQTT();
  
  // ==========================
  // CẤU HÌNH NẠP CODE QUA WIFI (OTA)
  // ==========================
  ArduinoOTA.setHostname("AZPool-MasterESP32");
  ArduinoOTA.onStart([]() { Serial.println("Bắt đầu nạp code OTA..."); });
  ArduinoOTA.onEnd([]() { Serial.println("\nNạp OTA Xong!"); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Tiến độ OTA: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Lỗi OTA[%u]: ", error);
  });
  ArduinoOTA.begin();
  
  syncScoreboardDataFromBackend(); 
}

void loop() {
  // Giữ liên lạc nạp code qua mạng
  ArduinoOTA.handle();

  // 1. Nếu ngắt kết nối thì móc vào Web máy chủ lại
  if (!mqttClient.connected()) setupMQTT();
  mqttClient.loop(); // Vòng lặp giữ nhịp tim thần tốc cho Web

  // 2. Xử lý Ping UDP vang về tai
  handleIncomingUDP();

  // 3. Khám sức khỏe các con thiết bị liên tục 
  loopCheckScoreboardsHealth();
}
