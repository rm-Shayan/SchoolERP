/**
 * One-time migration: local-disk logos (/uploads/...) ko Cloudinary par upload
 * karke DB me managed URL store karo.
 *
 * Run:  node scripts/migrateLogosToCloudinary.js
 */
import dotenv from "dotenv";
dotenv.config({ path: ["./.env.local", "./.env"] });

const prisma = (await import("../src/config/db.js")).default;
const storageService = (await import("../src/services/storage.service.js")).default;
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Logger from "../src/lib/utils/logger.js";

const logger = new Logger("logo-migration");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.resolve(__dirname, "../uploads");

const logoAsManaged = async (logoUrl, folder) => {
  if (!logoUrl) return logoUrl;
  if (logoUrl.includes("res.cloudinary.com/")) return logoUrl;
  if (logoUrl.startsWith("/uploads/")) {
    const filePath = path.join(UPLOAD_ROOT, logoUrl.replace("/uploads/", ""));
    try {
      const buffer = await fs.readFile(filePath);
      const { url } = await storageService.uploadImage({ buffer, folder, organizationId: process.env.DEFAULT_ORG_ID || undefined });
      return url || logoUrl;
    } catch (err) {
      // File missing (upload cleanup/rebuild ke baad) → dangling URL se behtar
      // NULL (branding fallback → default screen.png). Cloudinary tak nahi
      // pahunchne wala dead link store karne ka koi faida nahi.
      logger.logger.warn(`[migrate] local logo missing (${logoUrl}) → NULL: ${err.message}`);
      return null;
    }
  }
  if (/^data:/.test(logoUrl)) {
    const comma = logoUrl.indexOf(",");
    if (comma === -1) return logoUrl;
    try {
      const buffer = Buffer.from(logoUrl.slice(comma + 1), "base64");
      const { url } = await storageService.uploadImage({ buffer, folder });
      return url || logoUrl;
    } catch (err) {
      return logoUrl;
    }
  }
  return logoUrl;
};

const main = async () => {
  const ready = await storageService.waitForCloudinary();
  if (!ready) {
    logger.logger.warn("[migrate] Cloudinary NOT usable — env mein cloud name/api key/secret check karo");
  } else {
    logger.logger.info("[migrate] Cloudinary is configured");
  }

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true, logoUrl: true } });
  const schools = await prisma.school.findMany({ select: { id: true, name: true, logoUrl: true, organizationId: true } });

  let moved = 0;
  for (const org of orgs) {
    if (!org.logoUrl || org.logoUrl.includes("res.cloudinary.com/")) continue;
    const newUrl = await logoAsManaged(org.logoUrl, "org-logos");
    // newUrl === null tab bhi update karo (dangling URL → NULL, branding fallback)
    if (newUrl !== org.logoUrl) {
      await prisma.organization.update({ where: { id: org.id }, data: { logoUrl: newUrl } });
      logger.logger.info(`[migrate] ORG "${org.name}": ${org.logoUrl} -> ${String(newUrl)}`);
      moved++;
    }
  }
  for (const school of schools) {
    if (!school.logoUrl || school.logoUrl.includes("res.cloudinary.com/")) continue;
    const newUrl = await logoAsManaged(school.logoUrl, "school-logos");
    if (newUrl && newUrl !== school.logoUrl) {
      await prisma.school.update({ where: { id: school.id }, data: { logoUrl: newUrl } });
      logger.logger.info(`[migrate] SCHOOL "${school.name}": ${school.logoUrl} -> ${newUrl}`);
      moved++;
    }
  }

  logger.logger.info(`[migrate] done — ${moved} logo(s) moved to Cloudinary`);
  process.exit(0);
};

main().catch((err) => {
  logger.logger.error(`[migrate] failed: ${err.message}`);
  process.exit(1);
});