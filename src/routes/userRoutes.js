import { readJsonBody } from "../http/readJsonBody.js";
import {
  getUsers,
  saveUsers,
} from "../data/userStore.js";

export function registerUserRoutes(router) {
  router.get("/api/users", async (_request, response) => {
    const users = await getUsers();

    response.sendJson(200, {
      users,
    });
  });

  router.post("/api/users", async (request, response) => {
    const body = await readJsonBody(request);
    const name = body.name?.trim();

    if (!name) {
      response.sendJson(400, {
        error: "User name is required.",
      });
      return;
    }

    const users = await getUsers();

    const existingUser = users.find(
      (user) => user.name.toLowerCase() === name.toLowerCase(),
    );

    if (existingUser) {
      response.sendJson(409, {
        error: "A user with that name already exists.",
      });
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };

    users.push(user);

    await saveUsers(users);

    response.sendJson(201, {
      user,
    });
  });
}