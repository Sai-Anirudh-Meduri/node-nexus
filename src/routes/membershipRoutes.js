import { readJsonBody } from "../http/readJsonBody.js";
import { getRooms } from "../data/roomStore.js";
import { getUsers } from "../data/userStore.js";
import {
  getMemberships,
  saveMemberships,
} from "../data/membershipStore.js";

export function registerMembershipRoutes(router) {
  router.get("/api/memberships", async (_request, response) => {
    const memberships = await getMemberships();

    response.sendJson(200, {
      memberships,
    });
  });

  router.post("/api/memberships", async (request, response) => {
    const body = await readJsonBody(request);

    const userId = body.userId?.trim();
    const roomId = body.roomId?.trim();

    if (!userId || !roomId) {
      response.sendJson(400, {
        error: "userId and roomId are required.",
      });
      return;
    }

    const users = await getUsers();
    const rooms = await getRooms();

    const userExists = users.some((user) => user.id === userId);
    const roomExists = rooms.some((room) => room.id === roomId);

    if (!userExists) {
      response.sendJson(404, {
        error: "User not found.",
      });
      return;
    }

    if (!roomExists) {
      response.sendJson(404, {
        error: "Room not found.",
      });
      return;
    }

    const memberships = await getMemberships();

    const existingMembership = memberships.find(
      (membership) =>
        membership.userId === userId &&
        membership.roomId === roomId,
    );

    if (existingMembership) {
      response.sendJson(409, {
        error: "User is already a member of this room.",
      });
      return;
    }

    const membership = {
      id: crypto.randomUUID(),
      userId,
      roomId,
      role: "member",
      joinedAt: new Date().toISOString(),
    };

    memberships.push(membership);

    await saveMemberships(memberships);

    response.sendJson(201, {
      membership,
    });
  });
}