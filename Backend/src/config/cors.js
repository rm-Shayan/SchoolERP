const stripSlash = (origin) => origin.replace(/\/+$/, "");

const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => stripSlash(origin.trim()))
  .filter(Boolean);

const fixedOrigins = [
  "https://school-mchoxdsno-areesharao9-8007s-projects.vercel.app",
  "https://school-erp.vercel.app",
  "https://school-erp-nine-iota.vercel.app",
];

const developmentOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...fixedOrigins,
  ...(process.env.NODE_ENV !== "production" ? developmentOrigins : []),
]);

export const corsOrigin = (origin, callback) => {
  // Requests like Postman/server-to-server don't have Origin
  if (!origin) {
    return callback(null, true);
  }

  const normalizedOrigin = stripSlash(origin.trim());

  if (allowedOrigins.has(normalizedOrigin)) {
    return callback(null, true);
  }

  console.error("CORS blocked origin:", origin);
  console.error(
    "Allowed origins:",
    [...allowedOrigins]
  );

  return callback(
    new Error(`Origin ${origin} is not allowed by CORS`)
  );
};