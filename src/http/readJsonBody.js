export async function readJsonBody(request, maxBytes = 1_000_000) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;

    if (totalBytes > maxBytes) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }

    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const body = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must contain valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}