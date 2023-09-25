const express = require("express");
const puppeteer = require("puppeteer");
const mustache = require("mustache");
const fs = require("fs");
const os = require("os");
const jwt = require("jsonwebtoken");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  defaultMeta: { machineName: os.hostname() },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

const app = express();
app.use(express.text({ limit: "8mb" }));
app.use(express.json({ limit: "8mb" }));
app.use(logHandler);
app.use(tokenHandler); // validate Bearer token

const validateToken = createTokenValidationFunction(
  "keys/jwt-public.key",
  "template",
);

app.post("/html", async (req, res) => {
  const input = sanatizeInput(req.body);
  const html = mustache.render(input.template, input.data, input.partials);
  res.contentType("text/html");
  res.send(html);
});

app.post("/pdf", async (req, res) => {
  const input = sanatizeInput(req.body);
  const html = mustache.render(input.template, input.data, input.partials);
  const pdf = await createPdf(html);
  res.contentType("application/pdf");
  res.send(pdf);
});

app.listen(5000, () => {
  logger.info("Server started");
});

async function createPdf(data) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(data);

  // allow page to run javascript before creating pdf
  await page.waitForFunction("window.readyForPdfPuppeteer !== false");

  const pdf = await page.pdf({
    format: "a4",
    printBackGround: true,
    preferCSSPageSize: true,
    margin: {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
  });
  await browser.close();
  return pdf;
}

function sanatizeInput(data) {
  const template = typeof data.template === "string" ? data.template : "";
  const partials = typeof data.partials === "object" ? data.partials : {};
  for (var key in partials) {
    if (typeof partials[key] !== "string") {
      delete partials[key];
    }
  }
  return { template, data: data.data, partials };
}

function logHandler(req, res, next) {
  const logInfo = { requestPath: req.path, traceId: getTraceId(req) };
  logger.info({ message: "Started handling request", ...logInfo });
  res.on("finish", () => {
    logger.info({ message: "Finished handling request", ...logInfo });
  });
  next();
}

async function tokenHandler(req, res, next) {
  const logInfo = { requestPath: req.path, traceId: getTraceId(req) };
  const validationResult = await validateToken(getBearerToken(req));
  if (!validationResult.valid) {
    logger.warn({ message: validationResult.message, ...logInfo });
    res.contentType("text/html");
    res.status(500).send("Invalid token");
    return;
  }
  next();
}

function getBearerToken(req) {
  if (typeof req.headers.authorization !== "string") {
    return "";
  }
  const parts = req.headers.authorization.split(" ");
  if (parts.length !== 2) {
    return "";
  }
  return parts[0] === "Bearer" ? parts[1] : "";
}

function getTraceId(req) {
  const traceparent = req.headers.traceparent;
  const parts = traceparent?.split("-");
  if (parts?.length >= 2) {
    return parts[1];
  }
  return traceparent;
}

function createTokenValidationFunction(filename, requiredScope) {
  let jwtPublicKey = "";
  try {
    jwtPublicKey = fs.readFileSync(filename, "utf8");
    logger.info(
      `Public key "${jwtPublicKey.slice(0, 40).replace("\n", " ")}..." loaded.`,
    );
  } catch (e) {
    logger.error(
      "Run `npm run generate-keys jwt` to create a public key for token validation.",
    );
    process.exit(1);
  }
  return (token) => verifyToken(token, jwtPublicKey, requiredScope);
}

function verifyToken(token, secretOrPublicKey, requiredScope) {
  const regex = new RegExp(`(^|\\s)${requiredScope}($|\\s)`);
  return new Promise((resolve) => {
    jwt.verify(token, secretOrPublicKey, function (err, decoded) {
      if (err) {
        resolve({ valid: false, message: err.message });
      } else if (
        Array.isArray(decoded.scope) &&
        decoded.scope.indexOf(requiredScope) !== -1
      ) {
        resolve({ valid: true, message: "" });
      } else if (
        typeof decoded.scope === "string" &&
        decoded.scope.search(regex) !== -1
      ) {
        resolve({ valid: true, message: "" });
      } else {
        resolve({
          valid: false,
          message: `Token does not contain scope '${requiredScope}'.`,
        });
      }
    });
  });
}
