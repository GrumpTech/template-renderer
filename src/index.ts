import express from "express";
import { logger, logHandler } from "./core/logger";
import { tokenHandler } from "./core/authorization";
import { initializeControllersAsync, registerRoutes } from "./core/routes";

const app = express();
app.use(express.text({ limit: "8mb" }));
app.use(express.json({ limit: "8mb" }));
app.use(logHandler);
app.use(tokenHandler); // validate bearer token

registerRoutes(app);

app.listen(5000, async () => {
  await initializeControllersAsync();
  logger.info("Server started");
});
