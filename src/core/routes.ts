import { RenderController } from "../controllers/render-controller";
import { Express } from "express";

const controller = new RenderController();

export async function initializeControllersAsync() {
  await controller.initializeAsync();
}

export function registerRoutes(app: Express) {
  app.post("/html", async (req, res) => controller.renderHtml(req, res));
  app.post("/pdf", async (req, res) => controller.renderPdf(req, res));
}
