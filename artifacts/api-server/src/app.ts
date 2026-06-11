import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";

import { logger } from "./lib/logger";
import routes from "./routes";

export const app = express();

app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api", routes);

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  req.log.error({ err }, "Unhandled request error");
  res.status(500).json({ error: "Internal server error" });
});
