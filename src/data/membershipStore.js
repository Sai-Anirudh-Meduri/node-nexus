import fs from "node:fs/promises";
import path from "node:path";

const filePath = path.resolve("storage/memberships.json");

export async function getMemberships() {
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
}

export async function saveMemberships(memberships) {
  const data = JSON.stringify(memberships, null, 2);
  await fs.writeFile(filePath, data, "utf8");
}