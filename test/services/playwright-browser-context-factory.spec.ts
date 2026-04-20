import assert from "assert";
import { PlaywrightBrowserContextFactory } from "../../src/services/playwright-browser-context-factory";

describe("Playwright browser context factory", function () {
  it("createAsync", async function () {
    const factory = new PlaywrightBrowserContextFactory();

    const res = await factory.createAsync();

    assert.notEqual(res, null);
    await factory.clearAsync();
  });
});
