export function registerSystemRoutes(router) {
  router.get("/", async (_request, response) => {
    response.sendJson(200, {
      name: "Node Nexus",
      message: "Node Nexus server is running.",
    });
  });

  router.get("/api/health", async (_request, response) => {
    response.sendJson(200, {
      status: "healthy",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });
}