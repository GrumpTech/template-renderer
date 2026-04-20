import { Request, Response, NextFunction } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import { logger } from "./logger";

const validateToken = createTokenValidationFunction(
  "keys/jwt-public.key",
  "template",
);

export async function tokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const validationResult = await validateToken(getBearerToken(req));
  if (!validationResult.valid) {
    logger.warn({ message: validationResult.message });
    res.contentType("text/html");
    res.status(500).send("Invalid token");
    return;
  }
  next();
}

function getBearerToken(req: Request): string {
  if (typeof req.headers.authorization !== "string") {
    return "";
  }
  const parts = req.headers.authorization.split(" ");
  if (parts.length !== 2) {
    return "";
  }
  return parts[0] === "Bearer" ? parts[1] : "";
}

function createTokenValidationFunction(
  filename: string,
  requiredScope: string,
) {
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
  return (token: string) => verifyToken(token, jwtPublicKey, requiredScope);
}

function verifyToken(
  token: string,
  secretOrPublicKey: jwt.Secret | jwt.PublicKey | jwt.GetPublicKeyOrSecret,
  requiredScope: string,
): Promise<{ valid: boolean; message: string }> {
  const regex = new RegExp(`(^|\\s)${requiredScope}($|\\s)`);
  return new Promise((resolve) => {
    jwt.verify(token, secretOrPublicKey, function (err, decoded) {
      if (err) {
        resolve({ valid: false, message: err.message });
      } else if (decoded === undefined) {
        resolve({ valid: false, message: "Decoded token is undefined." });
      } else if (typeof decoded === "string") {
        resolve({ valid: false, message: "Decoded token is a string." });
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
