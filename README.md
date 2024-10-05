# template-renderer

This small demo project shows a way to generate PDFs from [mustache](https://github.com/janl/mustache.js#templates) HTML templates using [puppeteer](https://pptr.dev) and [mustache.js](https://github.com/janl/mustache.js).

## Puppeteer

Puppeteer is an open-source Node.js library providing control to Chrome or Chromium used for automated testing and creating PDFs from HTML. Puppeteer is maintained by the Chrome DevTools team.\
<https://pptr.dev>\
<https://github.com/puppeteer/puppeteer>

## Mustache.js

An open-source JavaScript library to render mustache templates. The [mustache template syntax](https://github.com/janl/mustache.js#templates) supports variables, conditional templates, repeatable sections and inclusion of other templates. The mustache template engine is [widely available](https://mustache.github.io/).\
https://github.com/janl/mustache.js

## Security

Some remarks concerning security:

- Ensure user input is validated.
- Ensure the npm packages and docker image are up to date.
- Only allow access from trusted services. This is often achieved using json web tokens. Thanks to the package [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) this was easily implemented in [template-renderer.js](/template-renderer.js).
- For serving over https see <https://expressjs.com/en/5x/api.html#app.listen> and <https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener>.

## Getting started

### Npm commands

See [package.json](/package.json) for scripts to run, build and test [template-renderer.js](/template-renderer.js). It provides scripts to build some example templates as well.

- Run `npm run generate-keys jwt` to create a private and public key. The public key is used by [template-renderer.js](/template-renderer.js) for validating JWT's.
- Run `npm run start:test` to serve [template-renderer.js](/template-renderer.js) on port 5000 and a HTML test page on port 5021. The [examples directory](/examples) contains templates which can be used for testing.
- Run `npm run start:image` to serve [template-renderer.js](/template-renderer.js) on port 5000 and run `start:test-page` to run a HTML test page on port 5021. The [examples directory](/examples) contains templates which can be used for testing.
- Run `npx prettier . --check` or `npx prettier . --write` to format code using prettier (an opinionated formatter).

### Docker image

A [Dockerfile](/Dockerfile) is included in this repository. See <https://pptr.dev/guides/docker> and <https://github.com/puppeteer/puppeteer/blob/main/docker/Dockerfile> for more information.

### Source code

- [template-renderer.js](/template-renderer.js) - Combines Puppeteer and mustache.js with a few lines of code in order to create PDFs from mustache HTML templates.\
  The service waits until `window.readyForPdf != false`. This way the template can run JavaScript before it's rendered.
- [generate-keys.js](/utils/generate-keys.js) - Generates a private and public key.
- [test-page.js](/utils/test-page.js) - Serves a test page for testing [template-renderer.js](/template-renderer.js).

### Some example templates

- [a4](/examples/a4.html)
- [email](/examples/email.html)
- [image](/examples/image.html)
- [mustache](/examples/mustache.html)
- [pagedjs](/examples/pagedjs.html)
- [pagedjs-toc](/examples/pagedjs.html)
- [partial-lorem-ipsum](/examples/partial-lorem-ipsum.html)
- [partial-mustache](/examples/partial-mustache.html)

### Validating JWKS tokens

The package [jwks-rsa](https://github.com/auth0/node-jwks-rsa) provides functionality for validating JWT's created with a public key from a [JSON Web Key Set (JWKS)](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets).

For an example install the package with `npm i jwks-rsa` and adjust the code as written below.

```js
// add
const jwksClient = require("jwks-rsa");

// change validateToken
const validateToken = createTokenValidationFunction(
  "https://some-url...",
  "template",
);

// replace createTokenValidationFunction with the following function
function createTokenValidationFunction(url, requiredScope) {
  return (token) => {
    var client = jwksClient({ jwksUri: url });
    function getKey(header, callback) {
      client.getSigningKey(header.kid, function (err, key) {
        if (err) {
          logger.error({ message: err.message });
        }
        var signingKey = key?.publicKey || key?.rsaPublicKey;
        callback(null, signingKey);
      });
    }
    return verifyToken(token, getKey, requiredScope);
  };
}
```

_For local testing -_ Extra self-signed certificate(s) can be provided with a node environment variable: [NODE_EXTRA_CA_CERTS](https://nodejs.org/api/cli.html#node_extra_ca_certsfile).
