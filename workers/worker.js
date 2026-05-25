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

async function fetchLatestData() {
  statusEl.textContent = "Fetching latest sensor data...";
  try {
    const response = await fetch(apiUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(response.status + " " + response.statusText);
    }

    const data = await response.json();
    temperatureEl.textContent = (data.temperature?.toFixed(1) ?? "--") + " °C";
    humidityEl.textContent = (data.humidity?.toFixed(1) ?? "--") + " %";
    soilValueEl.textContent = data.soilValue ?? "--";
    updatedAtEl.textContent = data.timestamp ?? new Date().toLocaleString();
    statusEl.textContent = "Live data loaded.";
  } catch (error) {
    statusEl.textContent = "Unable to load data. Check your API endpoint.";
    console.error(error);
  }
}

fetchLatestData();
setInterval(fetchLatestData, 20000);`;

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

  await env.SENSOR_DATA.put("latest", JSON.stringify(payload));

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

async function handleLatest(env) {
  const value = await env.SENSOR_DATA.get("latest");
  if (!value) {
    return new Response(JSON.stringify({ error: "No data available" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(value, {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
