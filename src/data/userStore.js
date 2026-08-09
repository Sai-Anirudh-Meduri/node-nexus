import fs from "node:fs/promises";
import path from "node:path";

const filePath = path.resolve("storage/users.json");

export async function getUsers() {
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
}

export async function saveUsers(users) {
  const data = JSON.stringify(users, null, 2);
  await fs.writeFile(filePath, data, "utf8");
}