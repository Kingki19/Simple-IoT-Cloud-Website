const apiUrl = "/latest";
const statusEl = document.getElementById("status");
const temperatureEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const soilValueEl = document.getElementById("soilValue");
const updatedAtEl = document.getElementById("updatedAt");
const tempChart = document.getElementById("historyChartTemp");
const humidityChart = document.getElementById("historyChartHum");
const soilChart = document.getElementById("historyChartSoil");

let currentHistory = [];

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function normalizeHistory(history) {
  return history.length
    ? history
    : [{ timestamp: Date.now(), temperature: 0, humidity: 0, soilValue: 0 }];
}

function drawLineChart(canvas, history, valueKey, color) {
  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const values = history.map((item) => item[valueKey] ?? 0);
  const timestamps = history.map((item) => item.timestamp ?? Date.now());
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = values.length > 1 ? chartWidth / (values.length - 1) : 0;

  function getX(index) {
    return padding + stepX * index;
  }

  function getY(value) {
    return padding + chartHeight - ((value - minValue) / range) * chartHeight;
  }

  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = getX(index);
    const y = getY(value);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  values.forEach((value, index) => {
    const x = getX(index);
    const y = getY(value);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(formatTime(timestamps[0]), padding, height - 10);
  ctx.textAlign = "right";
  ctx.fillText(formatTime(timestamps[timestamps.length - 1]), width - padding, height - 10);

  ctx.textAlign = "left";
  ctx.fillText(`${minValue.toFixed(1)}`, padding, padding + 12);
  ctx.textAlign = "right";
  ctx.fillText(`${maxValue.toFixed(1)}`, width - padding, padding + 12);
}

function drawAllCharts(history) {
  const normalizedHistory = normalizeHistory(history);
  drawLineChart(tempChart, normalizedHistory, "temperature", "#38bdf8");
  drawLineChart(humidityChart, normalizedHistory, "humidity", "#facc15");
  drawLineChart(soilChart, normalizedHistory, "soilValue", "#22c55e");
}

async function fetchLatestData() {
  statusEl.textContent = "Fetching latest sensor data...";
  try {
    const response = await fetch(apiUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const temperature = data.temperature != null ? Number(data.temperature) : 0;
    const humidity = data.humidity != null ? Number(data.humidity) : 0;
    const soilValue = data.soilValue != null ? Number(data.soilValue) : 0;

    temperatureEl.textContent = `${temperature.toFixed(1)} °C`;
    humidityEl.textContent = `${humidity.toFixed(1)} %`;
    soilValueEl.textContent = soilValue;
    updatedAtEl.textContent = data.timestamp ?? new Date().toLocaleString();

    const history = Array.isArray(data.history) ? data.history : [];
    currentHistory = history.length ? history : [{
      timestamp: Date.now(),
      temperature: 0,
      humidity: 0,
      soilValue: 0,
    }];
    drawAllCharts(currentHistory);

    statusEl.textContent = "Live data loaded.";
  } catch (error) {
    statusEl.textContent = "Unable to load data. Check your API endpoint.";
    console.error(error);
  }
}

window.addEventListener("resize", () => {
  drawAllCharts(currentHistory);
});

fetchLatestData();
setInterval(fetchLatestData, 5000);
