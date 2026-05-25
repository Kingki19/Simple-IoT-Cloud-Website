const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Farming Dashboard</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <h1>Smart Farming Dashboard</h1>
    <div id="status" class="status">Loading latest sensor data...</div>
    <div class="cards">
      <div class="card">
        <h2>Temperature</h2>
        <p id="temperature">-- °C</p>
      </div>
      <div class="card">
        <h2>Humidity</h2>
        <p id="humidity">-- %</p>
      </div>
      <div class="card">
        <h2>Soil Value</h2>
        <p id="soilValue">--</p>
      </div>
      <div class="card chart-card">
        <h2>Last 60s sensor graph</h2>
        <canvas id="historyChart"></canvas>
        <div class="chart-legend">
          <span><span class="legend-dot temp"></span>Temperature</span>
          <span><span class="legend-dot humidity"></span>Humidity</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <span>Last updated:</span>
      <span id="updatedAt">--</span>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`;

const css = `body {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 20px;
}

h1 {
  margin-bottom: 16px;
  font-size: 2.1rem;
  color: #f8fafc;
}

.status {
  margin-bottom: 24px;
  padding: 14px 18px;
  border-radius: 16px;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
}

.cards {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.card {
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.12);
  padding: 22px;
}

.card h2 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #94a3b8;
}

.card p {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 700;
  color: #f8fafc;
}

.chart-card {
  grid-column: 1 / -1;
  padding-bottom: 14px;
}

#historyChart {
  width: 100%;
  height: 260px;
  display: block;
  margin-top: 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.85);
}

.chart-legend {
  margin-top: 14px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  color: #cbd5e1;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.legend-dot.temp {
  background: #38bdf8;
}

.legend-dot.humidity {
  background: #facc15;
}

.footer {
  margin-top: 24px;
  color: #94a3b8;
}

.footer span:first-child {
  margin-right: 8px;
}`;

const appJs = `const apiUrl = "/latest";
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
  const minValue = Math.min(...temperatures, ...humidities);
  const maxValue = Math.max(...temperatures, ...humidities);
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

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(formatTime(history[0].timestamp), padding, height - 10);
  ctx.textAlign = "right";
  ctx.fillText(formatTime(history[history.length - 1].timestamp), width - padding, height - 10);

  ctx.textAlign = "left";
  ctx.fillText(minValue.toFixed(1), padding, padding + 12);
  ctx.textAlign = "right";
  ctx.fillText(maxValue.toFixed(1), width - padding, padding + 12);
}

async function fetchLatestData() {
  statusEl.textContent = "Fetching latest sensor data...";
  try {
    const response = await fetch(apiUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(response.status + " " + response.statusText);
    }

    const data = await response.json();
    temperatureEl.textContent = (data.temperature !== undefined ? data.temperature.toFixed(1) : "--") + " °C";
    humidityEl.textContent = (data.humidity !== undefined ? data.humidity.toFixed(1) : "--") + " %";
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
setInterval(fetchLatestData, 5000);`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // API Routes
    if (request.method === "POST" && pathname === "/update") {
      return handleUpdate(request, env);
    }

    if (request.method === "GET" && pathname === "/latest") {
      return handleLatest(env);
    }

    // Static files
    if (pathname === "/" || pathname === "/index.html") {
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (pathname === "/style.css") {
      return new Response(css, {
        status: 200,
        headers: { "Content-Type": "text/css; charset=utf-8" }
      });
    }

    if (pathname === "/app.js") {
      return new Response(appJs, {
        status: 200,
        headers: { "Content-Type": "application/javascript; charset=utf-8" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};

async function handleUpdate(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const payload = {
    temperature: body.temperature,
    humidity: body.humidity,
    soilValue: body.soilValue,
    timestamp: new Date().toISOString()
  };

  const MAX_HISTORY = 12;
  let history = [];
  const historyValue = await env.SENSOR_DATA.get("history");
  if (historyValue) {
    try {
      const parsedHistory = JSON.parse(historyValue);
      if (Array.isArray(parsedHistory)) {
        history = parsedHistory;
      }
    } catch (err) {
      history = [];
    }
  }

  history.push(payload);
  if (history.length > MAX_HISTORY) {
    history = history.slice(-MAX_HISTORY);
  }

  await env.SENSOR_DATA.put("latest", JSON.stringify(payload));
  await env.SENSOR_DATA.put("history", JSON.stringify(history));

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

async function handleLatest(env) {
  const latestValue = await env.SENSOR_DATA.get("latest");
  if (!latestValue) {
    return new Response(JSON.stringify({ error: "No data available" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  let history = [];
  const historyValue = await env.SENSOR_DATA.get("history");
  if (historyValue) {
    try {
      const parsedHistory = JSON.parse(historyValue);
      if (Array.isArray(parsedHistory)) {
        history = parsedHistory;
      }
    } catch (err) {
      history = [];
    }
  }

  const latestData = JSON.parse(latestValue);
  const responsePayload = {
    ...latestData,
    history
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
