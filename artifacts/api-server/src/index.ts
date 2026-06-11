import "dotenv/config";

import express from "express";
import pinoHttp from "pino-http";

import router from "./routes";
import { logger } from "./lib/logger";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", router);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "API server listening");
});
