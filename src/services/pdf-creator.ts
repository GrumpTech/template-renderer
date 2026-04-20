import { Page } from "playwright";
import { AsyncObjectPool } from "./async-object-pool";

export class PdfCreator {
  constructor(private pagePool: AsyncObjectPool<Page>) {}

  public async fromHtmlAsync(data: string) {
    const page = await this.pagePool.getAsync();

    await page.setContent(data);

    // allow page to run javascript before creating pdf
    await page.waitForFunction("window.readyForPdf !== false");

    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      },
    });
    await page.reload();
    this.pagePool.return(page);
    return pdf;
  }
}
