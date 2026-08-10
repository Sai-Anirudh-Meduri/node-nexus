import { environment } from "./config/environment.js";
import { createServer } from "./server/createServer.js";
import { createWebSocketServer } from "./realtime/createWebSocketServer.js";

const server = createServer();
const webSocketServer = createWebSocketServer(server);

server.on("error", (error) => {
  console.error("Server error:", error);
  process.exitCode = 1;
});

server.listen(environment.port, environment.host, () => {
  console.log(`
Node Nexus is running.

Environment: ${environment.nodeEnvironment}
Address:     http://${environment.host}:${environment.port}
Users:       http://${environment.host}:${environment.port}/api/users
Memberships: http://${environment.host}:${environment.port}/api/memberships
Rooms:       http://${environment.host}:${environment.port}/api/rooms
Messages:    http://${environment.host}:${environment.port}/api/messages
Health:      http://${environment.host}:${environment.port}/api/health
  `);
});

function shutDown(signal) {
  console.log(`\nReceived ${signal}. Closing Node Nexus...`);

  webSocketServer.close();
  
  server.close((error) => {
    if (error) {
      console.error("Shutdown error:", error);
      process.exitCode = 1;
      return;
    }

    console.log("Node Nexus stopped successfully.");
  });
}

process.once("SIGINT", () => shutDown("SIGINT"));
process.once("SIGTERM", () => shutDown("SIGTERM"));