# Template renderer

A combination of three remarkable open source projects makes it easy to create PDF documents from HTML templates. With only a few lines of code Puppeteer and mustache.js can be combined to create PDF's from HTML. This is demonstrated in template-renderer.js. Paged.js can be used to create documents with a table of contents and page numbers. This is demonstrated in tests/pagedjs/pagedjs.html.

Creating PDF's is a common task in software development. This repository shows a free and open source alternative to commercial packages like Aspose.Pdf or Exstream.

## Security

Some remarks concerning security.

- Ensure user input is validated.
- Ensure the npm packages and docker image are up to date.
- Only allow access from trusted services. This is often achieved using json web tokens. Thanks to the package [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) this was easily implemented in template-renderer.js.
- For serving over https see <https://expressjs.com/en/5x/api.html#app.listen> and <https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener>.

## General information

### Puppeteer

An open source Node.js library providing control to Chrome or Chromium used for automated testing and creating PDF's. Puppeteer is maintained by the Chrome DevTools team.\
<https://pptr.dev>\
<https://github.com/puppeteer/puppeteer>\
License: See project, Apache License 2.0 at time of writing

### mustache.js

An open source javascript library to render mustache templates.\
<https://github.com/janl/mustache.js>\
<https://mustache.github.io>\
License: See project, MIT License at time of writeing

### Paged.js

An open source library to paginate HTML content for printing to PDF. This library is used to design books with HTML and CSS.\
<https://pagedjs.org>\
<https://github.com/pagedjs/pagedjs>\
<https://ashok-khanna.medium.com/beautiful-pdfs-from-html-9a7a3c565404>\
<https://www.adamhyde.net/some-pagedjs-info>\
License: See project, MIT license at time of writing

### Typesetting with CSS

Browsers provide some interesting options for typesetting. For example the following CSS styles.

- **orphans** - minimum number of lines at the bottom of a page
- **widows** - minimum number of lines at the top of a page
- **break-before: avoid-page** - avoid page break before a HTML element
- **break-after: avoid-page** - avoid page break after a HTML element
- **text-align: justify** - align text to the left and right edges of lines, except at the last line
- **hyphens: auto** - words are hyphenated according to language-specific hyphenation rules, where the language should be specified with a lang attribute

**Note:** It seems that Puppeteer does not yet handle hyphens correctly. Two possible workarrounds are [hyphen](https://www.npmjs.com/package/hyphen) (node) and [Hyphenopoly](https://github.com/mnater/Hyphenopoly) (browser).

## Getting started

### Npm commands

See package.json for some scripts to run, build and test template-renderer.js and some example templates.

- Run `npm run generate-keys jwt` to create a private and public key used by template-renderer.js for validating JWT's.
- Run `npm run start:test` to serve template-renderer.js on port 5000 and a HTML test page on port 5021. See tests directory for some templates which can be used for testing.

### Docker image

See <https://pptr.dev/guides/docker> and <https://github.com/puppeteer/puppeteer/tree/main/docker> for more information.

### Some example templates

- tests/a4-pages.html
- tests/email.html
- tests/image.html
- tests/mustache.html
- tests/pagedjs.html

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
          logger.error({ message: err });
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

## Packages

- Puppeteer: library providing control to Chrome or Chromium
- mustache.js: library to render mustache templates
- Paged.js: library to paginate HTML content for printing to PDF
- winston: a simple logging library with support for multiple transports
- jsonwebtoken: an implementation of JSON Web Tokens use for signing and verifying JWT's
- jwks-rsa: a library to retrieve signing keys from a JWKS endpoint

### Packages for testing

- axios: node package for http requests
- http-server: serve files to test HTML locally
- json5: for parsing json written by hand
- juice: inline web resources (styles, scripts, images)
- nodemon: run script and restart when changed
- npm-run-all: run multiple npm scripts with one command
- web-resource-inliner: inline web resources without any changes (preserves all Paged.js styles)

### Package for formatting

- prettier: opinionated code formatter (run with `npx prettier . --check` or `npx prettier . --write`)
