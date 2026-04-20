import path from "path";
import { fileURLToPath } from "url";
import { Bench } from "tinybench";
import { readFileSync } from "fs";
import axios from "axios";
import jsonwebtoken from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getToken = createGetTokenFunction("keys/jwt-private.key");
const accessToken = getToken();
const data = getData();
const bench = new Bench();
const nRquests = 8;

bench.add("CreatePdfOnce", async () => {
  const outputType = "pdf";
  try {
    await axios.post(`http://localhost:5000/${outputType}`, data, {
      responseType: "stream",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.log(`Error message: ${error.message ?? "Unknown"}`);
  }
});

bench.add("CreatePdf", async () => {
  const outputType = "pdf";
  try {
    for (let i = 0; i < nRquests; i++) {
      await axios.post(`http://localhost:5000/${outputType}`, data, {
        responseType: "stream",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  } catch (error) {
    console.log(`Error message: ${error.message ?? "Unknown"}`);
  }
});

bench.add("CreatePdfParallel", async () => {
  const outputType = "pdf";
  try {
    let tasks = [];
    for (let i = 0; i < nRquests; i++) {
      tasks.push(
        axios.post(`http://localhost:5000/${outputType}`, data, {
          responseType: "stream",
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
    }
    await Promise.all(tasks);
  } catch (error) {
    console.log(`Error message: ${error.message ?? "Unknown"}`);
  }
});

async function main() {
  await bench.run();
  console.table(bench.table());
}
main();

function createGetTokenFunction(filename) {
  let jwtPrivateKey = "";
  try {
    jwtPrivateKey = readFileSync(filename, "utf8");
  } catch (err) {
    console.error(
      "Run `npm run generate-keys jwt` to create a private key for token validation.",
    );
    process.exit(1);
  }
  return () =>
    jsonwebtoken.sign({ scope: "template" }, jwtPrivateKey, {
      algorithm: "RS256",
      expiresIn: 5 * 60,
    });
}

function getData() {
  let template = "";
  try {
    template = readFileSync(`${__dirname}/../examples/a4.html`, "utf8");
  } catch (error) {
    console.log(`Error: ${error}`);
  }
  let partials = {};
  try {
    partials["template"] = readFileSync(
      `${__dirname}/../examples/partial-lorem-ipsum.html`,
      "utf8",
    );
  } catch (error) {
    console.log(`Error: ${error}`);
  }
  return { template, data: {}, partials };
}
