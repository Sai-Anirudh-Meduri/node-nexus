import fs from "node:fs/promises";
import path from "node:path";

const filePath = path.resolve("storage/messages.json");

export async function getMessages() {
  const data = await fs.readFile(filePath, "utf8");

  return JSON.parse(data);
}

export async function saveMessages(messages) {
  const data = JSON.stringify(messages, null, 2);

  await fs.writeFile(filePath, data, "utf8");
}