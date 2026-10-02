import http from "http";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { initSockets } from "./sockets";
import { env } from "./config/env";

async function main() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);
  initSockets(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[server] Local Service Finder API running on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
