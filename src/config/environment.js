function readPort(value) {
  const port = Number.parseInt(value ?? "3000", 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

export const environment = Object.freeze({
  nodeEnvironment: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "127.0.0.1",
  port: readPort(process.env.PORT),
});