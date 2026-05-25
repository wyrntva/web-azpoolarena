#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>

// ==========================================
// CẤU HÌNH WIFI & TÊN BÀN (THAY ĐỔI Ở ĐÂY)
// ==========================================
const char* ssid     = "AZ POOLARENA";
const char* password = "66668888";

String myTableName   = "TV 1";  // Tên bàn chính xác để đối chiếu với Master

// ==========================================
// THIẾT LẬP MẮT PHÁT HỒNG NGOẠI (IR D2 / GPIO 4)
// ==========================================
const uint16_t kIrLed = 4;
IRsend irsend(kIrLed);

uint16_t rawData[67] = {
  4514, 4484,  570, 534,  570, 1668,  568, 1668,  568, 1666,  
  570, 538,  566, 536,  568, 534,  570, 536,  568, 536,  
  570, 1666,  568, 1668,  568, 1668,  568, 536,  570, 534,  
  568, 536,  568, 536,  570, 536,  568, 536,  568, 1614,  
  622, 1668,  568, 536,  570, 536,  568, 536,  568, 536,  
  568, 1668,  568, 1668,  568, 536,  568, 538,  566, 1668,  
  566, 1670,  566, 1534,  702, 1668,  568
};

// ==========================================
// CẢM BIẾN DÒNG CHẢY ACS712
// ==========================================
const int ACS_PIN = A0;
float mVperAmp = 185; // NẾU DÙNG ACS712 5A thì 185mV, loại 20A thì sửa lại 100mV, loại 30A là 66mV
const float WATT_THRESHOLD = 100.0; // Ngưỡng để quyết định Tivi Đang Bật (Lái xuống 100W để tránh sai số nhỏ)

// ==========================================
// CẤU HÌNH MẠNG LƯỚI LAN (UDP)
// ==========================================
WiFiUDP udp;
const int UDP_LISTEN_PORT = 7777; 
const int MASTER_REPLY_PORT = 5555;

// Hàm tính công suất Tiêu thụ (Watt) xấp xỉ từ Cảm biến ACS712 (Chống rung/Nhiễu)
float getPowerWatt() {
  float maxValue = 0;
  float minValue = 1024;
  uint32_t start_time = millis();

  // Đọc liên tục trong 100ms (lấy khoảng 5 chu kỳ điện lưới 50Hz)
  while((millis() - start_time) < 100) {
      float readValue = analogRead(ACS_PIN);
      if (readValue > maxValue) maxValue = readValue;
      if (readValue < minValue) minValue = readValue;
  }
  
  // Tính Vpp (Hiệu điện thế đỉnh-đỉnh đo được trên chân A0 NodeMCU, chuẩn 3.3V/1023)
  float voltage_max = (maxValue / 1023.0) * 3.3;
  float voltage_min = (minValue / 1023.0) * 3.3;
  float Vpp = voltage_max - voltage_min;
  
  // Rút gọn công thức Vrms và Irms
  float Vrms = Vpp / 2.828; 
  float Irms = (Vrms * 1000.0) / mVperAmp;

  // Lọc nhiễu điện (Dưới 0.1A coi như bằng 0)
  if (Irms < 0.1) Irms = 0; 
  
  // Watt tiêu thụ (Giả định điện lưới Việt Nam 220V pha chuẩn)
  float watt = Irms * 220.0;

  // IN RA SERIAL ĐỂ DEBUG TỪNG THÔNG SỐ (TRÁNH BỊ LỆCH TI TỈ LẦN)
  Serial.print("Đo điện: MaxADC="); Serial.print(maxValue);
  Serial.print(" MinADC="); Serial.print(minValue);
  Serial.print(" -> Vpp="); Serial.print(Vpp, 3);
  Serial.print("v -> Irms="); Serial.print(Irms, 3);
  Serial.print("A -> WATT="); Serial.println(watt, 1);
  
  return watt;
}

// Bắn tia hồng ngoại để Toggle Tivi
void sendIRPowerToggle() {
   Serial.println(">>> ĐANG PHÁT TIA HỒNG NGOẠI BẬT/TẮT...");
   irsend.sendRaw(rawData, 67, 38);
}


void setup() {
  Serial.begin(115200);
  irsend.begin();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("\nĐang kết nối WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nĐã vào mạng LAN! IP: " + WiFi.localIP().toString());

  // === CÀI ĐẶT OTA SUPORT CHO PHÉP NẠP CODE QUA MẠNG KHÔNG CẦN CẮM CÁP ===
  ArduinoOTA.setHostname(("ESP8266_Tivi_" + myTableName).c_str());
  ArduinoOTA.onStart([]() { Serial.println("OTA Bắt đầu..."); });
  ArduinoOTA.onEnd([]() { Serial.println("\nOTA Xong!"); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("OTA: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) { Serial.printf("Lỗi OTA[%u]\n", error); });
  ArduinoOTA.begin();

  // Bắt đầu há miệng chờ hứng lệnh UDP
  udp.begin(UDP_LISTEN_PORT);
  Serial.println("Đang đợi lệnh UDP ở cổng: " + String(UDP_LISTEN_PORT));
}

unsigned long lastRegisterTime = 0;

void loop() {
  // BẮT BUỘC có dòng này để luôn sẵn sàng nạp code không dây
  ArduinoOTA.handle();

  // Cứ mỗi 10 giây, đo điện, la làng Plug&Play + Trạng thái thực tế
  if (millis() - lastRegisterTime > 10000) {
     lastRegisterTime = millis();
     float w = getPowerWatt();
     bool isTvCurrentlyOn = (w > WATT_THRESHOLD);
     String stateStr = isTvCurrentlyOn ? "ON" : "OFF";
     
     udp.beginPacket("255.255.255.255", MASTER_REPLY_PORT);
     udp.println("DEVICE_STATE:tv:" + myTableName + ":" + stateStr);
     udp.endPacket();
  }

  // Kiểm tra có lệnh UDP không
  int packetSize = udp.parsePacket();
  if (packetSize) {
    char reqBuffer[255];
    int len = udp.read(reqBuffer, 254);
    if(len > 0) reqBuffer[len] = '\0';
    
    String req = String(reqBuffer);
    IPAddress masterIP = udp.remoteIP(); 

    // Chỉ làm việc nếu lệnh này đúng tên Bàn của mình (Bỏ qua nếu ổng gào bàn thằng khác)
    if (req.indexOf(myTableName) != -1) {
       
       // ĐO ĐIỆN NGAY VÀ LUÔN XEM TIVI ĐANG TRONG TRẠNG THÁI GÌ
       float w = getPowerWatt();
       bool isTvCurrentlyOn = (w > WATT_THRESHOLD);
       
       // 1. NHẬN LỆNH BẬT TỪ WEB
       if (req.startsWith("CMD_ON")) {
          if (!isTvCurrentlyOn) {
              Serial.println("Tivi đang TẮT. Phát IR để Bật!");
              sendIRPowerToggle();
              delay(3000); // Chờ 3 giây cho tivi ngậm điện lên màn hình
              
              w = getPowerWatt(); // Đo lại dòng kiểm tra chắc cú
              isTvCurrentlyOn = (w > WATT_THRESHOLD);
          } else {
              Serial.println("Tivi ZIN ĐÃ BẬT RỒI. Triệt tiêu lệnh IR (Tránh làm nó bị lỡ tắt đi).");
          }

          // Phản hồi KẾT QUẢ THỰC TẾ lại cho Master
          String finalState = isTvCurrentlyOn ? "ON" : "OFF";
          udp.beginPacket("255.255.255.255", MASTER_REPLY_PORT);
          udp.println("DEVICE_STATE:tv:" + myTableName + ":" + finalState);
          udp.endPacket();
          Serial.println("-> BÁO CÁO NHANH THỰC TẾ: " + finalState);
       }
       
       // 2. NHẬN LỆNH TẮT TỪ WEB
       else if (req.startsWith("CMD_OFF")) {
          if (isTvCurrentlyOn) {
              Serial.println("Tivi đang BẬT. Phát IR để Tắp hụp!");
              sendIRPowerToggle();
              delay(2000); // Tivi rớt nguồn xuống thường mất 1-2 giây
              
              w = getPowerWatt(); 
              isTvCurrentlyOn = (w > WATT_THRESHOLD);
          } else {
              Serial.println("Tivi ZIN ĐÃ TẮT SẴN RỒI. Tiết kiệm không bắn IR.");
          }

          // Phản hồi KẾT QUẢ THỰC TẾ lại cho Master
          String finalState = isTvCurrentlyOn ? "ON" : "OFF";
          udp.beginPacket("255.255.255.255", MASTER_REPLY_PORT);
          udp.println("DEVICE_STATE:tv:" + myTableName + ":" + finalState);
          udp.endPacket();
          Serial.println("-> BÁO CÁO NHANH THỰC TẾ: " + finalState);
       }
       
       // 3. MASTER ĐIỂM DANH SINH TỒN
       else if (req.startsWith("STATUS_CHECK")) {
          // Bất luận sống chết, khi điểm danh bị gọi tên là phải dạ kèm kết quả chẩn đoán điện
          String finalState = isTvCurrentlyOn ? "ON" : "OFF";
          udp.beginPacket("255.255.255.255", MASTER_REPLY_PORT);
          udp.println("DEVICE_STATE:tv:" + myTableName + ":" + finalState);
          udp.endPacket();
       }
       
    }
  }
}
