#include <Arduino.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>

// Chân GPIO kết nối với chân DAT (hoặc S) của mắt phát hồng ngoại (D2 = GPIO 4)
const uint16_t kIrLed = 4;
IRsend irsend(kIrLed);

// Mảng RawData thu được từ remote thật - Cách này là CHẮC CHẮN hoạt động nhất 
// vì nó phát lại chính xác các khoảng thời gian bật/tắt của đèn IR như remote thật.
uint16_t rawData[67] = {
  4514, 4484,  570, 534,  570, 1668,  568, 1668,  568, 1666,  
  570, 538,  566, 536,  568, 534,  570, 536,  568, 536,  
  570, 1666,  568, 1668,  568, 1668,  568, 536,  570, 534,  
  568, 536,  568, 536,  570, 536,  568, 536,  568, 1614,  
  622, 1668,  568, 536,  570, 536,  568, 536,  568, 536,  
  568, 1668,  568, 1668,  568, 536,  568, 538,  566, 1668,  
  566, 1670,  566, 1534,  702, 1668,  568
};

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(50);
  irsend.begin();

  Serial.println();
  Serial.println("===============================================");
  Serial.println("Đang phát IR bằng phương pháp RAW (Sao chép 1:1)");
  Serial.println("Sẽ phát lại mã thu được từ remote gốc Samsung.");
  Serial.println("===============================================");
}

void loop() {
  Serial.println("Đang phát raw IR: Samsung_0x707030CF...");
  
  // Phát mảng rawData với tần số 38kHz (tần số chuẩn của hầu hết điều khiển)
  irsend.sendRaw(rawData, 67, 38); 

  delay(5000); // 5 giây phát lại một lần
}
