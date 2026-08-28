const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const developmentOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(process.env.NODE_ENV === "production" ? [] : developmentOrigins),
]);

export const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.has(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

