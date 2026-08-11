import { WebSocketServer, WebSocket } from "ws";
import { getRooms } from "../data/roomStore.js";
import { getUsers } from "../data/userStore.js";
import { getMemberships } from "../data/membershipStore.js";

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

function joinRoom(socket, roomId) {
  if (!socket.rooms) {
    socket.rooms = new Set();
  }

  socket.rooms.add(roomId);
}

function leaveRoom(socket, roomId) {
  socket.rooms?.delete(roomId);
}

function broadcastToRoom(
  webSocketServer,
  roomId,
  type,
  data = {},
  excludedSocket = null,
) {
  for (const client of webSocketServer.clients) {
    if (
      client.readyState === WebSocket.OPEN &&
      client !== excludedSocket &&
      client.rooms?.has(roomId)
    ) {
      sendEvent(client, type, data);
    }
  }
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

  webSocketServer.on("connection", async (socket, request) => {
    const url = new URL(
      request.url ?? "/ws",
      `http://${request.headers.host ?? "localhost"}`,
    );

    const userId = url.searchParams.get("userId")?.trim();

    if (!userId) {
      sendEvent(socket, "error", {
        message: "userId is required.",
      });

      socket.close(1008, "User ID required.");
      return;
    }

    const users = await getUsers();

    const user = users.find(
      (currentUser) => currentUser.id === userId,
    );

    if (!user) {
      sendEvent(socket, "error", {
        message: "User not found.",
      });

      socket.close(1008, "User not found.");
      return;
    }

    socket.user = user;
    socket.rooms = new Set();

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
          const roomId = event.roomId?.trim();

          if (!content) {
            sendEvent(socket, "error", {
              message: "Message content is required.",
            });
            return;
          }

          if (!roomId) {
            sendEvent(socket, "error", {
              message: "roomId is required.",
            });
            return;
          }

          if (!socket.rooms.has(roomId)) {
            sendEvent(socket, "error", {
              message: `You are not a member of room: ${roomId}`,
            });
            return;
          }

          const messages = await getMessages();

          const message = {
            id: crypto.randomUUID(),
            roomId,
            sender: user,
            content,
            createdAt: new Date().toISOString(),
          };

          messages.push(message);

          await saveMessages(messages);

          console.log(`[${roomId}] ${user.name}: ${message.content}`);

          broadcastToRoom(webSocketServer, roomId, "message:created", {
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
          const roomId = event.roomId?.trim();

          if (!roomId || !socket.rooms.has(roomId)) {
            sendEvent(socket, "error", {
              message: "You must join the room before typing.",
            });
            return;
          }

          broadcastToRoom(
            webSocketServer,
            roomId,
            "typing:started",
            {
              roomId,
              user,
            },
            socket,
          );

          return;
        }

        if (event.type === "typing:stop") {
          const roomId = event.roomId?.trim();

          if (!roomId || !socket.rooms.has(roomId)) {
            sendEvent(socket, "error", {
              message: "You must join the room before typing.",
            });
            return;
          }

          broadcastToRoom(
            webSocketServer,
            roomId,
            "typing:stopped",
            {
              roomId,
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

        if (event.type === "room:join") {
          const roomId = event.roomId?.trim();

          if (!roomId) {
            sendEvent(socket, "error", {
              message: "roomId is required.",
            });
            return;
          }

          const rooms = await getRooms();

          const room = rooms.find(
            (currentRoom) => currentRoom.id === roomId,
          );

          if (!room) {
            sendEvent(socket, "error", {
              message: "Room not found.",
            });
            return;
          }

          const memberships = await getMemberships();

          const membership = memberships.find(
            (currentMembership) =>
              currentMembership.userId === user.id &&
              currentMembership.roomId === roomId,
          );

          if (!membership) {
            sendEvent(socket, "error", {
              message: "You are not a member of this room.",
            });
            return;
          }

          joinRoom(socket, roomId);

          sendEvent(socket, "room:joined", {
            room,
            membership,
          });

          broadcastToRoom(
            webSocketServer,
            roomId,
            "room:user_joined",
            {
              room,
              user,
            },
            socket,
          );

          return;
        }

        if (event.type === "room:leave") {
          const roomId = event.roomId?.trim();

          if (!roomId) {
            sendEvent(socket, "error", {
              message: "roomId is required.",
            });
            return;
          }

          leaveRoom(socket, roomId);

          sendEvent(socket, "room:left", {
            roomId,
          });

          broadcastToRoom(webSocketServer, roomId, "room:user_left", {
            roomId,
            user,
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