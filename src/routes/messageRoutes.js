import { readJsonBody } from "../http/readJsonBody.js";
import {
  getMessages,
  saveMessages,
} from "../data/messageStore.js";

export function registerMessageRoutes(router) {
  router.get("/api/messages", async (request, response) => {
    const messages = await getMessages();

    const roomId = request.query.roomId?.trim();
    const search = request.query.search?.trim().toLowerCase();

    let filteredMessages = messages;

    if (roomId) {
      filteredMessages = filteredMessages.filter(
        (message) => message.roomId === roomId,
      );
    }

    if (search) {
      filteredMessages = filteredMessages.filter((message) =>
        message.content.toLowerCase().includes(search),
      );
    }

    response.sendJson(200, {
      messages: filteredMessages,
    });
  });

  router.get("/api/messages/:messageId", async (request, response) => {
    const messages = await getMessages();

    const message = messages.find(
      (currentMessage) =>
        currentMessage.id === request.params.messageId,
    );

    if (!message) {
      response.sendJson(404, {
        error: "Message not found.",
      });
      return;
    }

    response.sendJson(200, {
      message,
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

    const messages = await getMessages();

    const message = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
    };

    messages.push(message);

    await saveMessages(messages);

    response.sendJson(201, {
      message,
    });
  });

  router.delete("/api/messages/:messageId", async (request, response) => {
    const messages = await getMessages();

    const messageIndex = messages.findIndex(
      (message) =>
        message.id === request.params.messageId,
    );

    if (messageIndex === -1) {
      response.sendJson(404, {
        error: "Message not found.",
      });
      return;
    }

    const [deletedMessage] = messages.splice(messageIndex, 1);

    await saveMessages(messages);

    response.sendJson(200, {
      message: deletedMessage,
    });
  });
}