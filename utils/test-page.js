const express = require("express");
const fs = require("fs");
const axios = require("axios");
const json5 = require("json5");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.urlencoded({ extended: true }));

const getToken = createGetTokenFunction("keys/jwt-private.key");

app.post("/test", async (req, res) => {
  const outputType = req.body.outputType === "html" ? "html" : "pdf";
  const input = json5.parse(req.body.input);

  const sendError = function (error) {
    res.contentType("text/html");
    res.status(500).send(error);
  };

  let template = "";
  try {
    template = fs.readFileSync(
      `${__dirname}/../tests/${input.filename}`,
      "utf8",
    );
  } catch (error) {
    return sendError(error);
  }
  let partials = {};
  try {
    for (var key in input.partials) {
      partials[key] = fs.readFileSync(
        `${__dirname}/../tests/${input.partials[key]}`,
        "utf8",
      );
    }
  } catch (error) {
    return sendError(error);
  }
  const data = { template, data: input.data, partials };
  let result;
  const accessToken = getToken();
  try {
    result = await axios.post(`http://localhost:5000/${outputType}`, data, {
      responseType: "stream",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    if (error.response?.data) {
      let streamString = "";
      error.response.data.setEncoding("utf8");
      error.response.data
        .on("data", (chunk) => {
          streamString += chunk;
        })
        .on("end", () => {
          sendError(streamString);
        });
    } else {
      sendError(`Error message: ${error.message ?? "Unknown"}`);
    }
    return;
  }
  res.contentType(outputType === "html" ? "text/html" : "application/pdf");
  return result.data.pipe(res);
});

app.get("", async (_req, res) => {
  const html = `
<!doctype html>
<html>
  <head>
    <style>
	    html { height:100%; }
	    body { display:flex; flex-direction:column; height:100%; width:100%; margin:0; }
	    .title { padding-left:20px; margin-bottom:0; }
	    #form { padding:20px; }
        #form div { padding-bottom: 10px; }
	    .result { width:100%; flex:1; border:0; }
	  </style>
  </head>
  <body>
    <h2 class="title">Test mustache templates</h2>
    <form id="form" action="/test" method="post" target="result">
      <div>
        <select name="outputType" id="outputType">
          <option value="html">html</option>
          <option value="pdf" selected>pdf</option>
        </select>
      </div>
      <div>
        <textarea rows="10" cols="80" name="input">
{
  "filename": "mustache.html",
  "data": {
    "language": "en",
    "title": "Title",
    "value": "test",
    "array": ["a", "b", "c"],
    "arrayOfObjects": [
      { "value": "1" },
      { "value": "2" },
      { "value": "3" }
    ]
  },
  "partials": {
    "partial": "partial-mustache.html",
    "content": "partial-lorem-ipsum.html",
    "hyphens": "partial-hyphen-test.html"
  }
}
        </textarea>
      </div>
      <input id="submit" type="submit">
    </form>
    <iframe class="result" name="result"></iframe>
  </body>
</html>
`;
  res.contentType("text/html");
  res.send(html);
});

app.listen(5021, () => {
  console.log("Test server started: http://localhost:5021");
});

function createGetTokenFunction(filename) {
  let jwtPrivateKey = "";
  try {
    jwtPrivateKey = fs.readFileSync(filename, "utf8");
  } catch (err) {
    console.error(
      "Run `npm run generate-keys jwt` to create a private key for token validation.",
    );
    process.exit(1);
  }
  return () =>
    jwt.sign({ scope: "template" }, jwtPrivateKey, {
      algorithm: "RS256",
      expiresIn: 5 * 60,
    });
}
