import prisma from "../../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { queueEmail } from "../../services/emailOutbox.js";
import { adminCredentialsEmail } from "../../services/email.templates.js";
import Logger from "../../lib/utils/logger.js";
import { pickOwnerSuccessor } from "./ownerSuccession.js";

const logger = new Logger("org-provision");

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
      isDefaultBranch: true,
    },
  });
}

/**
 * Organization owner succession.
 *
 * Only one account owns organization-level settings (name/logo/theme/contact).
 * When that account is deleted, deactivated or moved off its branch, the
 * organization would be left with nobody able to edit itself — so the flag is
 * handed over to the most senior remaining branch admin.
 *
 * Candidate order (deterministic, oldest first):
 *   1. Admins that already manage several branches (`branchAccess`) — they are
 *      the ones who actually understand org-wide context.
 *   2. Admins of the organization's earliest branch.
 * Ties break on `createdAt ASC, id ASC` so the same admin is always chosen.
 *
 * The stale flag on a deactivated owner is cleared inside the same transaction
 * that grants the new one, so reactivating a former owner can never end up with
 * two owners. Runs AFTER the owner loss (delete/deactivate), so the losing
 * account is already inactive or gone and can never be picked again.
 */
export async function transferOrganizationOwnership(organizationId, { excludeUserIds = [] } = {}) {
  if (!organizationId) return null;

  const activeOwner = await prisma.user.findFirst({
    where: {
      organizationId,
      role: "ADMIN",
      isActive: true,
      isOrganizationOwner: true,
      blockedAt: null,
      id: { notIn: excludeUserIds },
    },
    select: { id: true },
  });
  if (activeOwner) return null;

  // `branchAccess` is a Json array (not a relation), so Prisma cannot sort by
  // it — candidates are fetched oldest-first and ranked in memory.
  const candidates = await prisma.user.findMany({
    where: {
      organizationId,
      role: "ADMIN",
      isActive: true,
      isOrganizationOwner: false,
      blockedAt: null,
      id: { notIn: excludeUserIds },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, name: true, email: true, schoolId: true, branchAccess: true },
  });
  const candidate = pickOwnerSuccessor(candidates);
  if (!candidate) return null;

  const promoted = await prisma.$transaction(async (tx) => {
    // Drop every stale owner flag in this org (inactive/deleted owners keep
    // theirs), then grant it to exactly one account.
    await tx.user.updateMany({
      where: { organizationId, isOrganizationOwner: true },
      data: { isOrganizationOwner: false },
    });
    return tx.user.update({
      where: { id: candidate.id },
      data: { isOrganizationOwner: true },
      select: { id: true, name: true, email: true, schoolId: true },
    });
  });

  logger.logger.info(
    `[OrgOwner] Transferred organization ownership ${organizationId} -> ${promoted.email} (school ${promoted.schoolId || "none"})`
  );
  return promoted;
}

/**
 * Create a branch admin (Principal) user and email their login credentials.
 * Role is always ADMIN — har branch ka apna principal hota hai.
 * Password is auto-generated when not provided; credentials are always emailed.
 * `isOrganizationOwner` stays false for everyone created here: only the account
 * born with the organization (default branch principal) owns org-level settings.
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
      isOrganizationOwner: false,
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
