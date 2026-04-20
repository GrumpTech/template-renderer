import { BrowserContext, Page } from "playwright";
import { IAsyncFactory } from "../interfaces/async-factory";
import { Mutex } from "./mutex";
import { PlaywrightBrowserContextFactory } from "./playwright-browser-context-factory";

export class PlaywrightPageFactory implements IAsyncFactory<Page> {
  private context: BrowserContext | null = null;
  private contextCreated = false;
  private readonly initializeMutex = new Mutex();

  constructor(private browserContextFactory: PlaywrightBrowserContextFactory) {}

  public async initializeAsync(): Promise<void> {
    if (this.contextCreated) {
      return;
    }
    await this.initializeMutex.lockAsync();
    let newContext: BrowserContext | null = null;
    if (this.contextCreated) {
      return;
    }
    try {
      newContext = await this.browserContextFactory.createAsync();
    } finally {
      if (newContext != null) {
        this.contextCreated = true;
        this.context = newContext;
      }
      this.initializeMutex.unlock();
    }
  }

  public async createAsync(): Promise<Page> {
    await this.initializeAsync();
    try {
      return await this.createPageAsync();
    } catch (error) {
      console.warn("Failed creating page", error);
      this.contextCreated = false;
      await this.initializeAsync();
      return await this.createPageAsync();
    }
  }

  private async createPageAsync(): Promise<Page> {
    if (this.context == null) {
      throw new Error("Playwright page factory: context is null");
    }
    return await this.context.newPage();
  }
}
