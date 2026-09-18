// Smart loader — NODE_ENV=local → dev.env, warna .env (src/config/env.js)
import "./src/config/env.js";
import { defineConfig, env } from "prisma/config";

export default defineConfig({  
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});