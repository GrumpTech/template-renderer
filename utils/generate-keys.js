const { generateKeyPair } = require("crypto");
const fs = require("fs");

const argv = require("minimist")(process.argv.slice(2));

if (argv["_"]?.length > 1) {
  console.log("Usage: node generate-keys.js [filename] [-p password]");
  process.exit(1);
}

const filename = argv["_"]?.length === 1 ? `${argv["_"][0]}-` : "";
const password = argv["p"];
delete argv["_"];
delete argv["p"];

if (Object.keys(argv).length) {
  console.log("Usage: node generate-keys.js [filename] [-p password]");
  process.exit(1);
}

const privateKeyEncoding = {
  type: "pkcs8",
  format: "pem",
};
if (password) {
  privateKeyEncoding["cipher"] = "aes-256-cbc";
  privateKeyEncoding["passphrase"] = password;
}

generateKeyPair(
  "rsa",
  {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding,
  },
  (error, publicKey, privateKey) => {
    if (error) {
      console.error(error);
    } else {
      fs.writeFileSync(`keys/${filename}public.key`, publicKey);
      fs.writeFileSync(`keys/${filename}private.key`, privateKey);
      console.log(`Keys saved in keys directory.`);
    }
  },
);
