import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import {
  EMAIL_TEMPLATE_KEYS,
  applyPlaceholders,
  getTemplateMeta,
  isValidTemplateKey,
} from "../../services/emailTemplateRegistry.js";

/** Send-path reads are hot (one per mail) — 30s cache keeps it off the DB. */
const OVERRIDE_TTL_MS = 30_000;
const overrideCache = new Map(); // `${orgId}:${key}` -> { at, row|null }

export function invalidateTemplateCache(organizationId) {
  if (!organizationId) {
    overrideCache.clear();
    return;
  }
  for (const k of [...overrideCache.keys()]) {
    if (k.startsWith(`${organizationId}:`)) overrideCache.delete(k);
  }
}

class EmailTemplatesService {
  /** Templates belong to the whole organization, so only the org owner (or a
   *  super admin) may rewrite what every branch mails out. */
  async _assertAccess(requester, organizationId) {
    if (!organizationId) throw ApiError.badRequestError("organizationId is required");
    if (requester.role === "SUPER_ADMIN") return;
    if (requester.role !== "ADMIN" || requester.organizationId !== organizationId) {
      throw ApiError.forbiddenError("You cannot manage email templates for this organization");
    }
    if (requester.isOrganizationOwner !== true) {
      throw ApiError.forbiddenError("Only the organization owner can customize email templates");
    }
  }

  _resolveOrgId(requester, organizationId) {
    return organizationId || requester?.organizationId || null;
  }

  /** GET /email-templates — every key, its default text and the org override. */
  async list(requester, organizationId) {
    const orgId = this._resolveOrgId(requester, organizationId);
    await this._assertAccess(requester, orgId);

    const rows = await prisma.emailTemplate.findMany({
      where: { organizationId: orgId },
      select: { key: true, subject: true, bodyHtml: true, updatedAt: true },
    });
    const byKey = new Map(rows.map((r) => [r.key, r]));

    return {
      organizationId: orgId,
      templates: EMAIL_TEMPLATE_KEYS.map((meta) => {
        const row = byKey.get(meta.key);
        const vars = sampleVars(meta.key);
        return {
          key: meta.key,
          label: meta.label,
          description: meta.description,
          placeholders: meta.placeholders,
          defaultSubject: meta.defaultSubject(vars),
          subject: row?.subject ?? null,
          bodyHtml: row?.bodyHtml ?? null,
          isCustomized: Boolean(row && (row.subject || row.bodyHtml)),
          updatedAt: row?.updatedAt ?? null,
        };
      }),
    };
  }

  /** PUT /email-templates/:key — upsert subject and/or body override. */
  async upsert(requester, organizationId, key, payload) {
    const orgId = this._resolveOrgId(requester, organizationId);
    await this._assertAccess(requester, orgId);
    if (!isValidTemplateKey(key)) throw ApiError.badRequestError(`Unknown email template: ${key}`);

    const subject = trimOrNull(payload?.subject);
    const bodyHtml = trimOrNull(payload?.bodyHtml);
    if (!subject && !bodyHtml) {
      throw ApiError.badRequestError("Provide a subject, a body, or both — empty overrides are rejected");
    }

    const row = await prisma.emailTemplate.upsert({
      where: { organizationId_key: { organizationId: orgId, key } },
      create: { organizationId: orgId, key, subject, bodyHtml },
      update: { subject, bodyHtml },
    });
    invalidateTemplateCache(orgId);
    return { key: row.key, subject: row.subject, bodyHtml: row.bodyHtml, isCustomized: true };
  }

  /** DELETE /email-templates/:key — drop the override, back to built-in default. */
  async reset(requester, organizationId, key) {
    const orgId = this._resolveOrgId(requester, organizationId);
    await this._assertAccess(requester, orgId);
    if (!isValidTemplateKey(key)) throw ApiError.badRequestError(`Unknown email template: ${key}`);

    await prisma.emailTemplate.deleteMany({ where: { organizationId: orgId, key } });
    invalidateTemplateCache(orgId);
    return { key, isCustomized: false };
  }

  /** POST /email-templates/:key/preview — rendered default + rendered override/draft. */
  async preview(requester, organizationId, key, payload) {
    const orgId = this._resolveOrgId(requester, organizationId);
    await this._assertAccess(requester, orgId);
    const meta = getTemplateMeta(key);
    if (!meta) throw ApiError.badRequestError(`Unknown email template: ${key}`);

    const vars = { ...sampleVars(key), ...(payload?.vars || {}) };
    const override = await this.getOverride(orgId, key);
    const rawSubject = trimOrNull(payload?.subject) ?? override?.subject ?? null;
    const rawBody = trimOrNull(payload?.bodyHtml) ?? override?.bodyHtml ?? null;
    return {
      key,
      label: meta.label,
      placeholders: meta.placeholders,
      vars,
      defaultSubject: meta.defaultSubject(vars),
      subject: rawSubject,
      bodyHtml: rawBody,
      renderedSubject: rawSubject ? applyPlaceholders(rawSubject, vars) : meta.defaultSubject(vars),
      renderedBody: rawBody ? applyPlaceholders(rawBody, vars) : null,
      isCustomized: Boolean(rawSubject || rawBody),
    };
  }

  /**
   * Send-path lookup. Never throws — a template read failure must not stop an
   * outgoing mail, so any error degrades to "no override, use the default".
   */
  async getOverride(organizationId, key) {
    if (!organizationId || !key) return null;
    const ck = `${organizationId}:${key}`;
    const hit = overrideCache.get(ck);
    if (hit && Date.now() - hit.at < OVERRIDE_TTL_MS) return hit.row;

    let row = null;
    try {
      row = await prisma.emailTemplate.findUnique({
        where: { organizationId_key: { organizationId, key } },
        select: { subject: true, bodyHtml: true },
      });
    } catch {
      row = null;
    }
    overrideCache.set(ck, { at: Date.now(), row });
    return row;
  }
}

const trimOrNull = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

/** Placeholder values used by the editor preview until real data is known. */
export function sampleVars(key) {
  const base = {
    orgName: "Falcon Academy",
    schoolName: "Gulshan Campus",
    schoolCode: "GUL-01",
    name: "Ayesha Khan",
    email: "ayesha.khan@example.com",
    username: "ayesha.khan",
    password: "Tr7!kq2P",
    role: "Teacher",
    title: "Student marked absent",
    message: "Ali was marked absent for 06 Oct 2026.",
    action: "blocked",
    entityType: "ORGANIZATION",
    entityName: "Falcon Academy",
    reason: "Payment overdue",
    address: "12 Iqra Avenue, Karachi",
    phone: "+92 21 111 000 222",
    loginUrl: "https://portal.example.com/login",
    orgUrl: "https://portal.example.com/o/falcon",
  };
  return base;
}

export default new EmailTemplatesService();
