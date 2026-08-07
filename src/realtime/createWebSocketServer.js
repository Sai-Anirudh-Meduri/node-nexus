import { WebSocketServer, WebSocket } from "ws";
import {
  getMessages,
  saveMessages,
} from "../data/messageStore.js";

export function createWebSocketServer(server) {
  const webSocketServer = new WebSocketServer({
    server,
    path: "/ws",
  });

  webSocketServer.on("connection", (socket) => {
    console.log("WebSocket client connected.");

    socket.send(
      JSON.stringify({
        type: "connection",
        message: "Connected to Node Nexus.",
      }),
    );

    socket.on("message", async (data) => {
      try {
        const content = data.toString().trim();

        if (!content) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Message content is required.",
            }),
          );
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

        for (const client of webSocketServer.clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "message",
                message,
              }),
            );
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);

        socket.send(
          JSON.stringify({
            type: "error",
            message: "Unable to process message.",
          }),
        );
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