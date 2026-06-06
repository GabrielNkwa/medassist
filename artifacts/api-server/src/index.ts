import { existsSync } from "node:fs";
import path from "node:path";
import net from "node:net";

const dotenvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env"),
  path.resolve(process.cwd(), "..", "..", ".env"),
];
const dotenvPath = dotenvPaths.find((configPath) => existsSync(configPath));

if (dotenvPath) {
  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: dotenvPath });
  } catch (error) {
    // dotenv is optional; if it is not installed or not needed, continue.
  }
}

const { default: app } = await import("./app");
const { logger } = await import("./lib/logger");

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function isPortAvailable(portNumber) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.once("connect", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", (error) => {
      socket.destroy();
      resolve(error.code === "ECONNREFUSED" || error.code === "EADDRNOTAVAIL");
    });

    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(true);
    });

    socket.connect(portNumber, "127.0.0.1");
  });
}

if (!(await isPortAvailable(port))) {
  logger.error(
    { port },
    "Port already in use. Another api-server instance may already be running.",
  );
  process.exit(1);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
