window.readyForPdfPuppeteer = false;

class ReadyHandler extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }
  afterRendered(content) {
    window.readyForPdfPuppeteer = true;
  }
}
Paged.registerHandlers(ReadyHandler);
