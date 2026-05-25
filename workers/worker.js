export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/update") {
      return handleUpdate(request, env);
    }

    if (request.method === "GET" && url.pathname === "/latest") {
      return handleLatest(env);
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
