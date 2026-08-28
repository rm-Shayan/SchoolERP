import prisma from "../../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { queueEmail } from "../../services/emailOutbox.js";
import { adminCredentialsEmail } from "../../services/email.templates.js";

/**
 * Build a unique School (branch) code from a base (e.g. org code + "-01").
 * Appends a numeric suffix if the candidate is already taken, since
 * School.code is globally unique across all organizations.
 */
export async function generateUniqueSchoolCode(baseCode) {
  const code = baseCode.toString().trim().toUpperCase();
  let candidate = code;
  let suffix = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.school.findUnique({ where: { code: candidate } });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${code}-${String(suffix).padStart(2, "0")}`;
  }
}

/**
 * Auto-create the default branch (School) for a freshly created organization.
 * Used by single-create AND bulk Excel import so every delivered organization
 * starts with one ready-to-use campus.
 */
export async function createDefaultBranch(org) {
  const code = await generateUniqueSchoolCode(`${org.code}-01`);
  return prisma.school.create({
    data: {
      organizationId: org.id,
      name: `${org.name} Main Campus`,
      code,
    },
  });
}

/**
 * Create a branch admin (Principal) user and email their login credentials.
 * Role is always ADMIN — har branch ka apna principal hota hai.
 * Password is auto-generated when not provided; credentials are always emailed.
 */
export async function createBranchAdmin({
  organizationId,
  schoolId,
  name,
  email,
  password,
  orgName,
  orgSlug,
  schoolName,
  schoolCode,
  skipEmail = false,
}) {
  const cleanEmail = email.toString().trim().toLowerCase();
  const generatedPassword = password || crypto.randomBytes(4).toString("hex") + "A1!";
  const hashedPassword = await bcrypt.hash(generatedPassword, 12);

  const user = await prisma.user.create({
    data: {
      name: (name || "Branch Admin").toString().trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "ADMIN",
      organizationId,
      schoolId,
    },
  });

  if (!skipEmail) {
    // Fetch org logo for branded email
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { logoUrl: true, themeColor: true },
    }).catch(() => null);
    const mail = adminCredentialsEmail({
      orgName,
      orgSlug,
      schoolName,
      name: user.name,
      email: cleanEmail,
      username: user.username || null,
      password: generatedPassword,
      schoolCode,
      logoUrl: org?.logoUrl || null,
      themeColor: org?.themeColor || null,
    });
    await queueEmail({
      to: cleanEmail,
      ...mail,
      priority: "CRITICAL",
      organizationId,
      schoolId,
    });
  }

  return { user, credentials: { email: cleanEmail, password: generatedPassword } };
}
