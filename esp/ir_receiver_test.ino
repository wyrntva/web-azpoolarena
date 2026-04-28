#include <Arduino.h>
#include <IRremoteESP8266.h>
#include <IRrecv.h>
#include <IRutils.h>

const uint16_t kRecvPin = 14;  // D5
IRrecv irrecv(kRecvPin);
decode_results results;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Bat dau doc IR...");
  irrecv.enableIRIn();
}

void loop() {
  if (irrecv.decode(&results)) {
    Serial.println("========== NHAN DUOC ==========");
    // resultToSourceCode sẽ trả về chuỗi code có thể copy trực tiếp vào code phát
    Serial.print(resultToSourceCode(&results));
    Serial.println("===============================");
    irrecv.resume();
  }
}
