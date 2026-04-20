import assert from "assert";
import { mock } from "sinon";
import { Page } from "playwright";
import { AsyncObjectPool } from "../../src/services/async-object-pool";
import { PdfCreator } from "../../src/services/pdf-creator";

describe("PdfCreator", function () {
  it("fromHtmlAsync", async function () {
    const input = "input";

    const pageStub = {
      reload: () => {},
      setContent: () => {},
      waitForFunction: () => {},
      pdf: () => {},
    } as unknown as Page;
    const pageMock = mock(pageStub);
    pageMock.expects("reload").once();
    pageMock.expects("setContent").once();
    pageMock.expects("waitForFunction").once();
    pageMock.expects("pdf").once().returns([1, 2, 3]);

    const poolStub = {
      getAsync: () => {},
      return: () => {},
    } as unknown as AsyncObjectPool<Page>;
    const poolMock = mock(poolStub);
    poolMock.expects("getAsync").once().resolves(pageStub);
    poolMock.expects("return").once();

    const pdfCreator = new PdfCreator(poolStub);
    const res = await pdfCreator.fromHtmlAsync(input);

    assert.deepEqual(res, [1, 2, 3]);
    pageMock.verify();
    poolMock.verify();
  });
});
