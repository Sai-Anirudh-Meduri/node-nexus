import { readJsonBody } from "../http/readJsonBody.js";

const messages = [];

export function registerMessageRoutes(router) {
  router.get("/api/messages", async (_request, response) => {
    response.sendJson(200, {
      messages,
    });
  });

  router.post("/api/messages", async (request, response) => {
    const body = await readJsonBody(request);

    const content = body.content?.trim();

    if (!content) {
      response.sendJson(400, {
        error: "Message content is required.",
      });
      return;
    }

    const message = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
    };

    messages.push(message);

    response.sendJson(201, {
      message,
    });
  });
}