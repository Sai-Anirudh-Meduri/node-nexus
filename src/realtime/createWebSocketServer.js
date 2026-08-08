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

function broadcast(webSocketServer, type, data = {}, excludedSocket = null) {
  for (const client of webSocketServer.clients) {
    if (
      client.readyState === WebSocket.OPEN &&
      client !== excludedSocket
    ) {
      sendEvent(client, type, data);
    }
  }
}

function getOnlineUsers(webSocketServer) {
  return [...webSocketServer.clients]
    .filter((client) => client.readyState === WebSocket.OPEN && client.user)
    .map((client) => client.user);
}

export function createWebSocketServer(server) {
  const webSocketServer = new WebSocketServer({
    server,
    path: "/ws",
  });

  webSocketServer.on("connection", (socket, request) => {
    const url = new URL(
      request.url ?? "/ws",
      `http://${request.headers.host ?? "localhost"}`,
    );

    const name = url.searchParams.get("name")?.trim();

    if (!name) {
      sendEvent(socket, "error", {
        message: "A user name is required.",
      });

      socket.close(1008, "User name required.");
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      name,
    };

    socket.user = user;

    console.log(`${user.name} connected.`);

    sendEvent(socket, "connection:ready", {
      message: "Connected to Node Nexus.",
      user,
      onlineUsers: getOnlineUsers(webSocketServer),
    });

    broadcast(
      webSocketServer,
      "presence:online",
      {
        user,
      },
      socket,
    );

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
            sender: user,
            content,
            createdAt: new Date().toISOString(),
          };

          messages.push(message);

          await saveMessages(messages);

          console.log(`${user.name}: ${message.content}`);

          broadcast(webSocketServer, "message:created", {
            message,
          });

          return;
        }

        if (event.type === "presence:list") {
          sendEvent(socket, "presence:list", {
            users: getOnlineUsers(webSocketServer),
          });
          return;
        }

        if (event.type === "typing:start") {
          broadcast(
            webSocketServer,
            "typing:started",
            {
              user,
            },
            socket,
          );

          return;
        }

        if (event.type === "typing:stop") {
          broadcast(
            webSocketServer,
            "typing:stopped",
            {
              user,
            },
            socket,
          );

          return;
        }

        if (event.type === "message:read") {
          const messageId = event.messageId?.trim();

          if (!messageId) {
            sendEvent(socket, "error", {
              message: "messageId is required.",
            });
            return;
          }

          broadcast(
            webSocketServer,
            "message:read",
            {
              messageId,
              user,
              readAt: new Date().toISOString(),
            },
            socket,
          );

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
      console.log(`${user.name} disconnected.`);

      broadcast(webSocketServer, "presence:offline", {
        user,
      });
    });

    socket.on("error", (error) => {
      console.error(`WebSocket error for ${user.name}:`, error);
    });
  });

  return webSocketServer;
}