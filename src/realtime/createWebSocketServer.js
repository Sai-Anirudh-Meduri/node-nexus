import { WebSocketServer, WebSocket } from "ws";

import {
  getMessages,
  saveMessages,
} from "../data/messageStore.js";

function sendEvent(socket, type, data = {}) {
  socket.send(
    JSON.stringify({
      type,
      ...data,
    }),
  );
}

function broadcast(webSocketServer, type, data = {}) {
  for (const client of webSocketServer.clients) {
    if (client.readyState === WebSocket.OPEN) {
      sendEvent(client, type, data);
    }
  }
}

export function createWebSocketServer(server) {
  const webSocketServer = new WebSocketServer({
    server,
    path: "/ws",
  });

  webSocketServer.on("connection", (socket) => {
    console.log("WebSocket client connected.");

    sendEvent(socket, "connection:ready", {
      message: "Connected to Node Nexus.",
    });

    socket.on("message", async (data) => {
      try {
        const event = JSON.parse(data.toString());

        if (event.type === "message:create") {
          const content = event.content?.trim();

          if (!content) {
            sendEvent(socket, "error", {
              message: "Message content is required.",
            });
            return;
          }

          const messages = await getMessages();

          const message = {
            id: crypto.randomUUID(),
            content,
            createdAt: new Date().toISOString(),
          };

          messages.push(message);

          await saveMessages(messages);

          console.log("WebSocket message saved:", message.content);

          broadcast(webSocketServer, "message:created", {
            message,
          });

          return;
        }

        sendEvent(socket, "error", {
          message: `Unknown event type: ${event.type}`,
        });
      } catch (error) {
        console.error("WebSocket message error:", error);

        sendEvent(socket, "error", {
          message: "WebSocket data must contain valid JSON.",
        });
      }
    });

    socket.on("close", () => {
      console.log("WebSocket client disconnected.");
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return webSocketServer;
}