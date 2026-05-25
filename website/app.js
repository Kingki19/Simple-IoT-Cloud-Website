const apiUrl = "/latest";
const statusEl = document.getElementById("status");
const temperatureEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const soilValueEl = document.getElementById("soilValue");
const updatedAtEl = document.getElementById("updatedAt");
const historyChart = document.getElementById("historyChart");

let currentHistory = [];

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function drawHistoryChart(history) {
  const ctx = historyChart.getContext("2d");
  const width = historyChart.clientWidth;
  const height = historyChart.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  historyChart.width = width * dpr;
  historyChart.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (!history.length) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Inter, system-ui, sans-serif";
    ctx.fillText("Waiting for sensor history...", 16, 34);
    return;
  }

  const temperatures = history.map((item) => item.temperature);
  const humidities = history.map((item) => item.humidity);
  const soilValues = history.map((item) => item.soilValue);
  const minValue = Math.min(...temperatures, ...humidities, ...soilValues);
  const maxValue = Math.max(...temperatures, ...humidities, ...soilValues);
  const range = maxValue - minValue || 1;

  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = history.length > 1 ? chartWidth / (history.length - 1) : 0;

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

  function drawLine(values, color) {
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
  }

  drawLine(temperatures, "#38bdf8");
  drawLine(humidities, "#facc15");
  drawLine(soilValues, "#22c55e");

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(formatTime(history[0].timestamp), padding, height - 10);
  ctx.textAlign = "right";
  ctx.fillText(formatTime(history[history.length - 1].timestamp), width - padding, height - 10);

  ctx.textAlign = "left";
  ctx.fillText(`${minValue.toFixed(1)}`, padding, padding + 12);
  ctx.textAlign = "right";
  ctx.fillText(`${maxValue.toFixed(1)}`, width - padding, padding + 12);
}

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

    currentHistory = Array.isArray(data.history) ? data.history : [];
    drawHistoryChart(currentHistory);

    statusEl.textContent = "Live data loaded.";
  } catch (error) {
    statusEl.textContent = "Unable to load data. Check your API endpoint.";
    console.error(error);
  }
}

window.addEventListener("resize", () => {
  drawHistoryChart(currentHistory);
});

fetchLatestData();
setInterval(fetchLatestData, 5000);
