import Logger from "../lib/utils/logger.js";

const appLogger = new Logger("error-handler");

/**
 * Express error handler — har error yahan se JSON response mein jata hai.
 *
 * RULE: Frontend ko SIRF clean, human-readable `message` mile. Status codes,
 * stack traces aur raw DB errors client ko kabhi nahi bheje jaate — wo sirf
 * logs mein jaate hain. Prisma ke known errors ko friendly messages par map
 * kiya gaya hai (unique conflict → 409, record nahi mila → 404, FK fail → 400).
 */
const PRISMA_MESSAGES = {
  P2000: { status: 400, message: "Provided value is too long for the database field." },
  P2002: { status: 409, message: "This record already exists — same value is already in use." },
  P2003: { status: 400, message: "Related record not found. Please check the linked data and try again." },
  P2025: { status: 404, message: "Record not found. It may have been deleted already." },
  P2023: { status: 400, message: "Invalid data provided for the database field." },
};

function isPrismaError(err) {
  return err && typeof err.code === "string" && err.code.startsWith("P");
}

function isBodyParseError(err) {
  return (
    err &&
    err.type === "entity.parse.failed" &&
    (err.status === 400 || err.statusCode === 400)
  );
}

export const errorHandler = (err, req, res, next) => {
  // 0. Body-parser JSON parse error (malformed JSON) — clean 400.
  if (isBodyParseError(err)) {
    appLogger.logger.error(`400 - Invalid JSON body - ${req.originalUrl} - ${req.method} - IP: ${req.ip}`);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid JSON in request body. Please check the format and try again.",
      data: null,
    });
  }

  // 1. Multer upload rejections — clean 4xx instead of a 500.
  if (err && err.name === "MulterError") {
    const maxMb = Number.parseInt(process.env.MAX_IMAGE_UPLOAD_SIZE_MB || "5", 10) || 5;
    const isTooLarge = err.code === "LIMIT_FILE_SIZE";
    const finalStatus = isTooLarge ? 413 : 400;
    const finalMessage = isTooLarge
      ? `File is too large. Maximum allowed image size is ${maxMb}MB.`
      : `Upload failed: ${err.message}`;
    appLogger.logger.error(`${finalStatus} - ${finalMessage} - ${req.originalUrl} - ${req.method} - IP: ${req.ip}`);
    return res.status(finalStatus).json({
      success: false,
      statusCode: finalStatus,
      message: finalMessage,
      data: null,
    });
  }

  // 2. Prisma known errors → human-readable message (raw Prisma text kabhi
  //    client ko nahi jata — sirf log mein).
  if (isPrismaError(err)) {
    const mapped = PRISMA_MESSAGES[err.code];
    if (mapped) {
      appLogger.logger.error(`${mapped.status} - [Prisma ${err.code}] ${err.message} - ${req.originalUrl} - ${req.method}`);
      return res.status(mapped.status).json({
        success: false,
        statusCode: mapped.status,
        message: mapped.message,
        data: null,
      });
    }
    appLogger.logger.error(`500 - [Prisma ${err.code}] ${err.message} - ${req.originalUrl} - ${req.method}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Something went wrong on the server. Please try again.",
      data: null,
    });
  }

  // 3. Operational errors (ApiError) — message already clean, sirf status + message bhejo.
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;
  const message = err.isOperational
    ? err.message || "Something went wrong. Please try again."
    : statusCode >= 500
      ? "Something went wrong on the server. Please try again."
      : err.message || "Something went wrong. Please try again.";

  appLogger.logger.error(`${statusCode} - ${err.message || message} - ${req.originalUrl} - ${req.method} - IP: ${req.ip}`);
  if (err.stack) {
    appLogger.logger.debug(err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    data: null,
  });
};

/**
 * 404 handler — koi route match nahi hua to Express ka default HTML page
 * (jis se frontend ko sirf status code milta tha) ki jagah clean JSON message.
 */
export const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
  });
};
