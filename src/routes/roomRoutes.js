import { readJsonBody } from "../http/readJsonBody.js";
import {
  getRooms,
  saveRooms,
} from "../data/roomStore.js";

export function registerRoomRoutes(router) {
  router.get("/api/rooms", async (_request, response) => {
    const rooms = await getRooms();

    response.sendJson(200, {
      rooms,
    });
  });

  router.post("/api/rooms", async (request, response) => {
    const body = await readJsonBody(request);
    const name = body.name?.trim();

    if (!name) {
      response.sendJson(400, {
        error: "Room name is required.",
      });
      return;
    }

    const rooms = await getRooms();

    const existingRoom = rooms.find(
      (room) => room.name.toLowerCase() === name.toLowerCase(),
    );

    if (existingRoom) {
      response.sendJson(409, {
        error: "A room with that name already exists.",
      });
      return;
    }

    const room = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };

    rooms.push(room);
    await saveRooms(rooms);

    response.sendJson(201, {
      room,
    });
  });
}