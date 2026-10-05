import http from "node:http";
import app    from "./app.js";
import { env }    from "./config/env.js";
import { logger } from "./utils/logger.js";

const server = http.createServer(app);

server.listen(env.PORT, "0.0.0.0", () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, host: "0.0.0.0" },
    "API server started",
  );
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

const SHUTDOWN_TIMEOUT_MS = 10_000;

function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, "Shutdown signal received — draining connections");

  server.close((err) => {
    if (err) {
      logger.error(err, "Error while closing HTTP server");
      process.exit(1);
    }
    logger.info("HTTP server closed — exiting cleanly");
    process.exit(0);
  });

  // Hard-kill if graceful drain takes too long
  setTimeout(() => {
    logger.fatal("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on("SIGTERM", () => { shutdown("SIGTERM"); });
process.on("SIGINT",  () => { shutdown("SIGINT"); });

// Surface unhandled async errors prominently
process.on("uncaughtException", (err) => {
  logger.fatal(err, "Uncaught exception");
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection");
  process.exit(1);
});
