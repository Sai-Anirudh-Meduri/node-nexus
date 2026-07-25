import http from "node:http";

function sendJson(response, statusCode, data) {
  const body = JSON.stringify(data);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });

  response.end(body);
}

export function createServer() {
  return http.createServer((request, response) => {
    const method = request.method;

    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );

    if (method === "GET" && url.pathname === "/") {
      sendJson(response, 200, {
        name: "Node Nexus",
        message: "Node Nexus server is running.",
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        status: "healthy",
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    sendJson(response, 404, {
      error: "Route not found",
      method,
      path: url.pathname,
    });
  });
}