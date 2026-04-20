import { Browser, BrowserContext, chromium } from "playwright";
import { IAsyncFactory } from "../interfaces/async-factory";

export class PlaywrightBrowserContextFactory
  implements IAsyncFactory<BrowserContext>
{
  browser?: Browser;

  public async createAsync(): Promise<BrowserContext> {
    this.browser = await chromium.launch();
    return await this.browser.newContext();
  }

  public async clearAsync(): Promise<void> {
    await this.browser?.close();
  }
}
