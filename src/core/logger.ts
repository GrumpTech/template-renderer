import os from "os";
import winston, { format } from "winston";
import { Request, Response, NextFunction } from "express";
import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "crypto";

interface RequestData {
  requestPath: string;
  traceId: string;
}

const requestStorage = new AsyncLocalStorage<RequestData>();

const addRequestData = format((info) => {
  Object.assign(info, requestStorage.getStore());
  return info;
});

export const logger = winston.createLogger({
  level: "info",
  defaultMeta: { machineName: os.hostname() },
  format: winston.format.combine(
    winston.format.timestamp(),
    addRequestData(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

export function logHandler(req: Request, res: Response, next: NextFunction) {
  res.on("finish", () => {
    logger.info({ message: "Finished handling request" });
  });
  let defaultLogData: RequestData = {
    requestPath: req.path,
    traceId: getTraceId(req) || crypto.randomUUID(),
  };
  requestStorage.run(defaultLogData, () => {
    logger.info({ message: "Started handling request" });
    next();
  });
}

function getTraceId(req: Request): string {
  let traceparent = req.headers.traceparent;
  if (Array.isArray(traceparent) && traceparent.length) {
    traceparent = traceparent[0];
  }
  if (typeof traceparent !== "string") {
    return "";
  }
  const parts = traceparent?.split("-");
  if (parts?.length >= 2) {
    return parts[1];
  }
  return traceparent;
}
