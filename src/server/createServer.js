import http from "node:http";

import { Router } from "../router/Router.js";
import { registerSystemRoutes } from "../routes/systemRoutes.js";
import { registerMessageRoutes } from "../routes/messageRoutes.js";

function addResponseHelpers(response) {
  response.sendJson = function sendJson(statusCode, data) {
    const body = JSON.stringify(data);

    response.writeHead(statusCode, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
    });

    response.end(body);
  };
}

export function createServer() {
  const router = new Router();

  registerSystemRoutes(router);
  registerMessageRoutes(router);

  return http.createServer(async (request, response) => {
    addResponseHelpers(response);

    try {
      const routeFound = await router.handle(request, response);

      if (!routeFound) {
        const url = new URL(
          request.url ?? "/",
          `http://${request.headers.host ?? "localhost"}`,
        );

        response.sendJson(404, {
          error: "Route not found",
          method: request.method,
          path: url.pathname,
        });
      }
    } catch (error) {
      console.error("Request error:", error);

      if (!response.headersSent) {
        response.sendJson(error.statusCode ?? 500, {
          error:
            error.statusCode !== undefined
              ? error.message
              : "Internal server error",
        });
      } else {
        response.end();
      }
    }
  });
}