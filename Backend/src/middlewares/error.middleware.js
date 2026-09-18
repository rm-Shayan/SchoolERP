import * as Sentry from "@sentry/node";
import Logger from "../lib/utils/logger.js";

const appLogger = new Logger("error-handler");

const PRISMA_MESSAGES = {
  P2000: { status: 400, message: "Provided value is too long for the database field." },
  P2002: { status: 409, message: "This record already exists — same value is already in use." },
  P2003: { status: 400, message: "Related record not found. Please check the linked data and try again." },
  P2025: { status: 404, message: "Record not found. It may have been deleted already." },
  P2023: { status: 400, message: "Invalid data provided for the database field." },
};

const sendJsonError = (res, statusCode, message, extra = {}) =>
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    data: null,
    ...extra,
  });

const isPrismaError = (err) =>
  err && typeof err.code === "string" && err.code.startsWith("P");

const isBodyParseError = (err) =>
  err &&
  err.type === "entity.parse.failed" &&
  (err.status === 400 || err.statusCode === 400);

const logRequestError = (req, statusCode, message) => {
  appLogger.logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - IP: ${req.ip}`);
};

export const errorHandler = (err, req, res, next) => {
  Sentry.captureException(err);

  if (isBodyParseError(err)) {
    logRequestError(req, 400, "Invalid JSON body");
    return sendJsonError(res, 400, "Invalid JSON in request body. Please check the format and try again.");
  }

  if (err && err.name === "MulterError") {
    const maxMb = Number.parseInt(process.env.MAX_IMAGE_UPLOAD_SIZE_MB || "5", 10) || 5;
    const isTooLarge = err.code === "LIMIT_FILE_SIZE";
    const finalStatus = isTooLarge ? 413 : 400;
    const finalMessage = isTooLarge
      ? `File is too large. Maximum allowed image size is ${maxMb}MB.`
      : `Upload failed: ${err.message}`;

    logRequestError(req, finalStatus, finalMessage);
    return sendJsonError(res, finalStatus, finalMessage);
  }

  if (isPrismaError(err)) {
    const mapped = PRISMA_MESSAGES[err.code];
    if (mapped) {
      logRequestError(req, mapped.status, `[Prisma ${err.code}] ${err.message}`);
      return sendJsonError(res, mapped.status, mapped.message);
    }

    logRequestError(req, 500, `[Prisma ${err.code}] ${err.message}`);
    return sendJsonError(res, 500, "Something went wrong on the server. Please try again.");
  }

  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  const message = err.isOperational
    ? err.message || "Something went wrong. Please try again."
    : statusCode >= 500
      ? "Something went wrong on the server. Please try again."
      : err.message || "Something went wrong. Please try again.";

  const sentryId = res?.sentry ?? null;

  logRequestError(req, statusCode, err.message || message);
  if (err.stack) {
    appLogger.logger.debug(err.stack);
  }

  return sendJsonError(res, statusCode, message, { sentryId });
};

export const notFoundHandler = (req, res) =>
  sendJsonError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
