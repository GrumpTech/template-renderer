import assert from "assert";
import { mock } from "sinon";
import { BrowserContext, Page } from "playwright";
import { PlaywrightBrowserContextFactory } from "../../src/services/playwright-browser-context-factory";
import { PlaywrightPageFactory } from "../../src/services/playwright-page-factory";
import { Mutex } from "../../src/services/mutex";

describe("PlaywrightPageFactory", function () {
  it("initializeAsync", async function () {
    const browserContextFactoryStub = getBrowserContextFactoryStub();
    const browserContextFactoryMock = mock(browserContextFactoryStub);
    browserContextFactoryMock.expects("createAsync").once();
    const factory = GetPageFactory(browserContextFactoryStub);

    await factory.initializeAsync();
    browserContextFactoryMock.verify();

    await factory.initializeAsync();
    browserContextFactoryMock.verify();
  });

  it("initializeAsync_AfterException", async function () {
    const browserContextFactoryStub = getBrowserContextFactoryStub();
    const browserContextFactoryMock = mock(browserContextFactoryStub);
    browserContextFactoryMock.expects("createAsync").twice().resolves(null);
    const factory = GetPageFactory(browserContextFactoryStub);

    await factory.initializeAsync();
    await factory.initializeAsync();

    browserContextFactoryMock.verify();
  });

  it("createAsync", async function () {
    const factory = GetPageFactory();

    const res = await factory.createAsync();

    assert.equal(typeof res, "object");
    assert.notEqual(res, null);
  });
  
  it("createAsync_Concurrent", async function () {
    let createAsyncCount = 0;
    const waitMutex = new Mutex();
    await waitMutex.lockAsync();

    const browserContextFactoryStub = getBrowserContextFactoryStub();
    const oldCreateAsync = browserContextFactoryStub.createAsync;
    browserContextFactoryStub.createAsync = async function() {
      createAsyncCount++;
      await waitMutex.lockAsync();
      waitMutex.unlock();
      return await oldCreateAsync();
    }
    const factory = GetPageFactory(browserContextFactoryStub);

    const promise = factory.initializeAsync();
    const promise2 = factory.initializeAsync();
    await Promise.all([
      promise,
      promise2,
      new Promise<void>((resolve) => {
        waitMutex.unlock();
        resolve();
      })
    ]);

    assert.equal(createAsyncCount, 1);
  });
/*
  it("createAsync_Exception", async function () {
    const browserContextFactoryStub = getBrowserContextFactoryStub();
    const browserContextFactoryMock = mock(browserContextFactoryStub);
    browserContextFactoryMock.expects("createAsync").twice().resolves(null);
    const factory = GetPageFactory(browserContextFactoryStub);

    let errorMessage = "";
    try {
      await factory.createAsync();
    } catch (error) {
      errorMessage = error.message;
      return;
    }
    assert.equal(errorMessage, "Playwright page factory: context is null");
    browserContextFactoryMock.verify();
  });*/

  function GetPageFactory(
    browserContextFactory: PlaywrightBrowserContextFactory | null = null,
  ) {
    browserContextFactory ??= getBrowserContextFactoryStub();
    return new PlaywrightPageFactory(browserContextFactory);
  }

  function getBrowserContextFactoryStub(): PlaywrightBrowserContextFactory {
    return {
      createAsync: async () => {
        return {
          newPage: () => {
            return {} as Page;
          },
        } as unknown as BrowserContext;
      },
      clearAsync: async () => {},
    };
  }
});
