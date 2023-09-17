const inliner = require("web-resource-inliner");
const path = require("path");
const fs = require("fs");

if (process.argv.length !== 4) {
  console.log("Usage: node web-resource-inliner.js input.html output.html");
  process.exit(1);
}

const inputFilename = process.argv[2];
const outputFilename = process.argv[3];

const fileContent = readFile(inputFilename);
const relativeTo = path.dirname(inputFilename);
inliner.html({ fileContent, relativeTo }, function (error, result) {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  fs.writeFileSync(outputFilename, result);
});

function normalize(contents) {
  return process.platform === "win32"
    ? contents.replace(/\r\n/g, "\n")
    : contents;
}

function readFile(file) {
  return normalize(fs.readFileSync(file, "utf8"));
}
