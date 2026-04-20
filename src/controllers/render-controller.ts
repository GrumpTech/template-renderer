import { Request, Response } from "express";
import mustache from "mustache";
import { Page } from "playwright";
import { PlaywrightBrowserContextFactory } from "../services/playwright-browser-context-factory";
import { PlaywrightPageFactory } from "../services/playwright-page-factory";
import { AsyncObjectPool } from "../services/async-object-pool";
import { PdfCreator } from "../services/pdf-creator";

export class RenderController {
  private pageFactory: PlaywrightPageFactory;
  private pdfCreator: PdfCreator;

  constructor() {
    const browserContextFactory = new PlaywrightBrowserContextFactory();
    this.pageFactory = new PlaywrightPageFactory(browserContextFactory);
    const pagePool = new AsyncObjectPool<Page>(this.pageFactory);
    this.pdfCreator = new PdfCreator(pagePool);
  }

  async initializeAsync() {
    await this.pageFactory.initializeAsync();
  }

  renderHtml(req: Request, res: Response) {
    const input = this.sanatizeInput(req.body);
    const html = mustache.render(input.template, input.data, input.partials);
    res.contentType("text/html");
    res.send(html);
  }

  async renderPdf(req: Request, res: Response) {
    const input = this.sanatizeInput(req.body);
    const html = mustache.render(input.template, input.data, input.partials);
    const pdf = await this.pdfCreator.fromHtmlAsync(html);
    res.contentType("application/pdf");
    res.send(pdf);
  }

  private sanatizeInput(data: any) {
    const template = typeof data.template === "string" ? data.template : "";
    const partials = typeof data.partials === "object" ? data.partials : {};
    for (let key in partials) {
      if (typeof partials[key] !== "string") {
        delete partials[key];
      }
    }
    return { template, data: data.data, partials };
  }
}
