#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

// =========================
// WIFI / CLOUD CONFIG
// =========================
const char* WIFI_SSID = "iotsimpleforfarming";
const char* WIFI_PASSWORD = "khilya1803";
const char* API_URL = "https://simple-iot-cloud.helmaliaputri622.workers.dev/update";
const unsigned long POST_INTERVAL_MS = 5000;

// =========================
// PIN CONFIG
// =========================
#define DHTPIN 4
#define DHTTYPE DHT22

#define SOIL_PIN 34

// =========================
// OBJECT
// =========================
DHT dht(DHTPIN, DHTTYPE);

// Ganti 0x27 menjadi 0x3F jika LCD tidak tampil
LiquidCrystal_I2C lcd(0x27, 16, 2);
unsigned long lastPostMillis = 0;

void connectWiFi() {
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    Serial.print(".");
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("Wi-Fi connected, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("Wi-Fi connection failed.");
  }
}

void sendSensorData(float temperature, float humidity, int soilValue) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi not connected, skipping cloud update.");
    return;
  }

  HTTPClient http;
  String payload = "{";
  payload += "\"temperature\":" + String(temperature, 1) + ",";
  payload += "\"humidity\":" + String(humidity, 1) + ",";
  payload += "\"soilValue\":" + String(soilValue);
  payload += "}";

  Serial.print("Posting to cloud: ");
  Serial.println(payload);

  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    Serial.print("POST response code: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.print("Response body: ");
    Serial.println(response);
  } else {
    Serial.print("HTTP POST failed: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

void setup() {

  // =========================
  // SERIAL MONITOR
  // =========================
  Serial.begin(115200);

  // =========================
  // DHT22
  // =========================
  dht.begin();

  // =========================
  // LCD
  // =========================
  lcd.init();
  lcd.backlight();

  // =========================
  // START MESSAGE
  // =========================
  lcd.setCursor(0, 0);
  lcd.print("SMART FARMING");

  lcd.setCursor(0, 1);
  lcd.print("ESP32 READY");

  Serial.println("================================");
  Serial.println("ESP32 SMART FARMING TEST");
  Serial.println("DHT22 + SOIL + LCD + WIFI");
  Serial.println("================================");

  connectWiFi();
  delay(3000);

  lcd.clear();
}

void loop() {

  // =========================
  // READ DHT22
  // =========================
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // =========================
  // READ SOIL SENSOR
  // =========================
  int soilValue = analogRead(SOIL_PIN);

  // =========================
  // CHECK DHT ERROR
  // =========================
  if (isnan(temperature) || isnan(humidity)) {

    Serial.println("DHT22 ERROR!");

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("DHT22 ERROR");

    delay(2000);
    return;
  }

  // =========================
  // SERIAL OUTPUT
  // =========================
  Serial.println("========== SENSOR DATA ==========");

  Serial.print("Temperature : ");
  Serial.print(temperature);
  Serial.println(" C");

  Serial.print("Humidity    : ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Soil Value  : ");
  Serial.println(soilValue);

  Serial.println("=================================");
  Serial.println();

  // =========================
  // LCD DISPLAY
  // =========================
  lcd.clear();

  // Baris 1
  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.print(temperature, 1);
  lcd.print("C ");

  lcd.print("H:");
  lcd.print(humidity, 0);
  lcd.print("%");

  // Baris 2
  lcd.setCursor(0, 1);
  lcd.print("Soil:");
  lcd.print(soilValue);

  if (millis() - lastPostMillis >= POST_INTERVAL_MS) {
    sendSensorData(temperature, humidity, soilValue);
    lastPostMillis = millis();
  }

  // =========================
  // DELAY
  // =========================
  delay(2000);
}