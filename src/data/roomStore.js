import fs from "node:fs/promises";
import path from "node:path";

const filePath = path.resolve("storage/rooms.json");

export async function getRooms() {
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
}

export async function saveRooms(rooms) {
  const data = JSON.stringify(rooms, null, 2);
  await fs.writeFile(filePath, data, "utf8");
}