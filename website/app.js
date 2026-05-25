const apiUrl = "https://simple_iot_farming_worker.helmaliaputri622.workers.dev/latest";
const statusEl = document.getElementById("status");
const temperatureEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const soilValueEl = document.getElementById("soilValue");
const updatedAtEl = document.getElementById("updatedAt");

async function fetchLatestData() {
  statusEl.textContent = "Fetching latest sensor data...";
  try {
    const response = await fetch(apiUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    temperatureEl.textContent = `${data.temperature?.toFixed(1) ?? "--"} °C`;
    humidityEl.textContent = `${data.humidity?.toFixed(1) ?? "--"} %`;
    soilValueEl.textContent = data.soilValue ?? "--";
    updatedAtEl.textContent = data.timestamp ?? new Date().toLocaleString();
    statusEl.textContent = "Live data loaded.";
  } catch (error) {
    statusEl.textContent = "Unable to load data. Check your API endpoint.";
    console.error(error);
  }
}

fetchLatestData();
setInterval(fetchLatestData, 20000);
