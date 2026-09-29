/**
 * rotate-mail-enc-key.js — MAIL_ENC_KEY rotate karo, data khoone ke bina.
 *
 * Problem: MAIL_ENC_KEY set na hone par tenant ke Cloudinary/SMTP secrets
 * `sha256(JWT_SECRET)` se encrypt hote hain. Iska matlab JWT_SECRET badalte
 * hi saare stored credentials PERMANENTLY unread ho jate hain.
 *
 * Ye script: purani key se sab decrypt → nayi key se encrypt → ek hi
 * transaction me write. Naya 64-char hex key generate karke bhi de sakta
 * hai (default) ya `--new-key` se de sakte hain.
 *
 * Safety:
 *   1. --yes ke bina DRY-RUN (kuch write nahi hota).
 *   2. Pehle poora OrgSecrets table JSON file me back up hota hai.
 *   3. Koi bhi row purani key se decrypt na ho → ABORT, kuch write nahi.
 *      ( chup-chaap skip karne se credential permanently loss ho jayega )
 *   4. Sab ek transaction me — koi row fail ho to sab revert.
 *   5. Write ke BAAD nayi key se dobara decrypt karke verify karta hai.
 *
 * Usage:
 *   npm run rotate:key                    # dry-run
 *   npm run rotate:key -- --yes           # nayi random key generate + rotate
 *   npm run rotate:key -- --yes --new-key <64-char-hex>
 *
 * NOTE: ye env file wahi use karta hai jo normal server chal raha hai
 * (NODE_ENV=local → dev.env/local DB, warna .env/production).
 */

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

import "../src/config/env.js";
import prisma from "../src/config/db.js";
import {
  deriveKey,
  decryptSecretWith,
  encryptSecretWith,
  currentSecret,
} from "../src/lib/utils/secretBox.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const yesFlag = args.includes("--yes");
const newKeyIdx = args.indexOf("--new-key");

const oldSecret = currentSecret();
const newSecret =
  newKeyIdx > -1 ? args[newKeyIdx + 1] : crypto.randomBytes(32).toString("hex");

// secretBox 64-char hex ya koi bhi non-empty string leti hai (sha256 ho jata
// hai) — par 64-char hex hi documented format hai, isliye validate karte hain.
if (!/^[0-9a-fA-F]{64}$/.test(newSecret)) {
  console.error("\n✗ --new-key 64-character hex string honi chahiye (32 bytes).");
  process.exit(1);
}
if (newSecret === oldSecret) {
  console.error("\n✗ Nayi key purani key ke barabar hai — rotation ka koi fayda nahi.");
  process.exit(1);
}

const oldKey = deriveKey(oldSecret);
const nextKey = deriveKey(newSecret);

console.log("== MAIL_ENC_KEY rotation ==");
console.log(`target DB : ${(process.env.DATABASE_URL || "").replace(/:[^:@/]+@/, ":***@")}`);
console.log(`old source: ${process.env.MAIL_ENC_KEY ? "MAIL_ENC_KEY" : "JWT_SECRET (derived)"}`);
console.log(`new key   : ${newSecret.slice(0, 8)}…${newSecret.slice(-8)} (${newSecret.length} chars)`);

const rows = await prisma.orgSecrets.findMany();
const ENC_FIELDS = ["apiSecretEnc", "passwordEnc"];

let touched = 0;
for (const r of rows) {
  for (const f of ENC_FIELDS) {
    if (r.data?.[f]) touched += 1;
  }
}

console.log(`\nOrgSecrets rows: ${rows.length}, encrypted values: ${touched}`);

if (touched === 0) {
  console.log("\n✓ Koi encrypted tenant secret nahi — rotation ki zaroorat nahi.");
  console.log("  Bas .env me MAIL_ENC_KEY set kar do (naya random 64-char hex).");
  await prisma.$disconnect();
  process.exit(0);
}

if (!yesFlag) {
  console.log("\n⚠️  DRY-RUN — kuch write nahi hua. Asli rotation ke liye:");
  console.log("   npm run rotate:key -- --yes");
  console.log(`   (ya apni key: --yes --new-key <64-char-hex>)`);
  await prisma.$disconnect();
  process.exit(0);
}

// ── [1] Backup ────────────────────────────────────────────────────────────
const backupFile = path.join(backendRoot, `org-secrets-backup-${Date.now()}.json`);
writeFileSync(
  backupFile,
  JSON.stringify(rows, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2),
);
console.log(`\n[1/3] Backup: ${path.basename(backupFile)}`);

// ── [2] Re-encrypt (single transaction) ───────────────────────────────────
console.log("[2/3] Re-encrypt karke likh raha hoon…");
const failures = [];

try {
  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      const data = { ...(r.data || {}) };
      for (const f of ENC_FIELDS) {
        const payload = data[f];
        if (!payload) continue;

        const plain = decryptSecretWith(payload, oldKey);
        if (plain === null) {
          failures.push(`${r.id} (${r.category} ${r.organizationId}) .${f}`);
          continue; // throw nahi karte — saari failures ek saath report
        }
        data[f] = encryptSecretWith(plain, nextKey);
      }
      await tx.orgSecrets.update({ where: { id: r.id }, data: { data } });
    }

    if (failures.length) {
      throw new Error("decrypt failures");
    }
  });
} catch (err) {
  console.error(`\n✗ Rotation FAIL — transaction revert ho gaya, DB badla nahi hai.`);
  if (err.message === "decrypt failures") {
    console.error(`  Ye ${failures.length} value(s) purani key se decrypt nahi huin:`);
    for (const f of failures) console.error(`    - ${f}`);
    console.error(`  Matlab MAIL_ENC_KEY pehle kabhi set tha ya data corrupt hai.`);
    console.error(`  In rows ko chhoedna BINA fix nahi ho sakta — manual dekho.`);
  } else {
    console.error(`  ${err.message}`);
  }
  console.error(`  Backup safe hai: ${backupFile}`);
  await prisma.$disconnect();
  process.exit(1);
}

// ── [3] Verify with the NEW key ───────────────────────────────────────────
console.log("[3/3] Nayi key se verify…");
const after = await prisma.orgSecrets.findMany();
let ok = 0;
for (const r of after) {
  for (const f of ENC_FIELDS) {
    if (!r.data?.[f]) continue;
    if (decryptSecretWith(r.data[f], nextKey) !== null) ok += 1;
    else failures.push(`post-write ${r.id} .${f}`);
  }
}

await prisma.$disconnect();

if (failures.length) {
  console.error(`\n✗ ${failures.length} value nayi key se verify nahi hui: ${failures.join(", ")}`);
  console.error(`  Purani key se wapas rotate karo, warna ye credentials dead hain.`);
  console.error(`  Backup: ${backupFile}`);
  process.exit(1);
}

console.log(`\n✓ ${ok}/${touched} encrypted values nayi key ke saath verified.`);
console.log(`\nAb .env me ye line set karo (purani MAIL_ENC_KEY hatake):`);
console.log(`   MAIL_ENC_KEY=${newSecret}`);
console.log(`Backup file delete karna ho to: ${path.basename(backupFile)}`);
