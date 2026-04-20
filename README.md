# template-renderer

This proof of concept shows how to generate PDFs from [mustache](https://github.com/janl/mustache.js#templates) HTML templates using [playwright](https://playwright.dev) and [mustache.js](https://github.com/janl/mustache.js).

_Visit <https://grumptech.github.io/templates> for more information and related projects on PDF generation with open source libraries._

## Security

Some remarks concerning security:

- Ensure user input is validated.
- Ensure the npm packages and docker image are up to date.
- Only allow access from trusted services. This is often achieved using json web tokens. Thanks to the package [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) this was easily implemented in [authorization.ts](src/core/authorization.ts).
- For serving over https see <https://expressjs.com/en/5x/api.html#app.listen> and <https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener>.
- Ensure beste practices for container hardening are applied. [OWASP](https://owasp.org/about/) provides a [Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html).

## Getting started

### Npm commands

See [package.json](/package.json) for scripts to run, build and test [template-renderer](src/index.ts).

- Run `npm install` to install all required packages.
- Run `npx playwright install --with-deps --only-shell` to install chromium browser for playwright.
- Run `npm run generate-keys jwt` to create a private and public key. The public key is used for validating JWT's.
- Run `npm run start` or `npm run watch` to serve [template-renderer](/src/index.ts) on port 5000.
- Run `npm run start:test-page` to serve a HTML test page on port 5021. The [examples directory](/examples) contains templates which can be used for testing.
- Run `npm run build:image` to build a docker image.
- Run `npm run start:image` to serve the docker image on port 5000.
- Run `npx prettier . -w` to format code using prettier (an opinionated formatter).

### Docker image

A [Dockerfile](/Dockerfile) is included in this repository. See <https://playwright.dev/docs/docker> for more information.

### Source code

- [template-renderer](/src/index.ts) combines Playwright and mustache.js in order to create PDFs from mustache HTML templates.\
  - The code waits until `window.readyForPdf != false`. This way the template can run JavaScript before it's rendered.
  - AsyncObjectPool in [async-object-pool.ts](src/services/async-object-pool.ts) is implemented to leverage [object pooling](https://en.wikipedia.org/wiki/Object_pool_pattern).
  - The `Mutex` class in [mutex.ts](src/services/mutex.ts) is implemented to ensure that asynchronous code does not start the browser more than once simultaneously.
- [generate-keys.js](/utils/generate-keys.js) generates a private and public key.
- [test-page.js](/utils/test-page.js) serves a test page for testing [template-renderer](/src/index.ts).

### Some example templates

- [a4.html](/examples/a4.html)
- [email.html](/examples/email.html)
- [image.html](/examples/image.html)
- [mustache.html](/examples/mustache.html)
- [pagedjs.html](/examples/pagedjs.html)
- [pagedjs-toc.html](/examples/pagedjs.html)
- [partial-lorem-ipsum.html](/examples/partial-lorem-ipsum.html)
- [partial-mustache.html](/examples/partial-mustache.html)

**Note:** Both _pagedjs.html_ and _pagedjs-toc.html_ use [paged.js](https://pagedjs.org) to paginate content. The source code for the implementation can be found in the [Mustache example layouts](https://github.com/GrumpTech/mustache-example-layouts) repository.

**Note 2:** These example templates include mustache partials and variables to test dynamic content creation.

### Validating JWKS tokens

The package [jwks-rsa](https://github.com/auth0/node-jwks-rsa) provides functionality for validating JWT's created with a public key from a [JSON Web Key Set (JWKS)](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets).

For an example install the package with `npm i jwks-rsa` and adjust the code of [authorization.ts](/src/core/authorization.ts) as written below.

```js
// add
import jwksClient from "jwks-rsa";

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
