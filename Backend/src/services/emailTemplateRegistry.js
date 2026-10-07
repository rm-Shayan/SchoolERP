/**
 * Registry of org-editable mail templates.
 *
 * A template has TWO layers:
 *   1. built-in default — produced by services/email.templates.js (branding,
 *      logo, theme colour, credential tables all baked in)
 *   2. optional override — an EmailTemplate row written by the org admin
 *      from Settings > Mail Templates
 *
 * The override only wins when it is actually set: a NULL column means
 * "use the built-in default". Body overrides are plain HTML strings with
 * {{placeholder}} tokens resolved by applyPlaceholders() at send time.
 */

export const EMAIL_TEMPLATE_KEYS = [
  {
    key: "admin_credentials",
    label: "Branch Admin Credentials",
    description: "Sent to a newly created branch admin with their login details (organization → branch).",
    placeholders: ["orgName", "schoolName", "schoolCode", "name", "email", "username", "password", "loginUrl", "orgUrl"],
    defaultSubject: (v) => `Welcome to ${v.orgName || "School ERP"} - Your Admin Credentials`,
  },
  {
    key: "staff_credentials",
    label: "Staff Account Credentials",
    description: "Sent to a newly created staff member with their portal login.",
    placeholders: ["schoolName", "orgName", "name", "email", "username", "password", "role", "loginUrl"],
    defaultSubject: (v) => `School ERP - Staff Account Credentials (${v.role || "Staff"})`,
  },
  {
    key: "parent_notification",
    label: "Parent Notification",
    description: "General notification mailed to a parent (admission, result, circular, attendance).",
    placeholders: ["schoolName", "orgName", "title", "message", "address", "phone", "loginUrl"],
    defaultSubject: (v) => v.title || "School ERP Notification",
  },
  {
    key: "moderation_notice",
    label: "Organization / Branch Status Notice",
    description: "Sent when an organization or branch is blocked or unblocked.",
    placeholders: ["entityType", "entityName", "action", "reason", "orgName"],
    defaultSubject: (v) =>
      `${v.entityType === "SCHOOL" ? "Branch" : "Organization"} ${v.action === "blocked" ? "Blocked" : "Unblocked"}: ${v.entityName || ""}`,
  },
  {
    key: "announcement",
    label: "Platform Announcement",
    description: "Broadcast sent by the platform to administrators.",
    placeholders: ["orgName", "title", "message", "loginUrl"],
    defaultSubject: (v) => `${v.title || "Announcement"}`,
  },
];

const KEY_INDEX = new Map(EMAIL_TEMPLATE_KEYS.map((t) => [t.key, t]));

export const isValidTemplateKey = (key) => KEY_INDEX.has(key);
export const getTemplateMeta = (key) => KEY_INDEX.get(key) || null;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/**
 * Replace {{token}} with the matching value. HTML-sensitive values are escaped
 * so a parent-supplied name cannot inject markup into an admin-authored body.
 * Unknown tokens are dropped to empty string (rather than left as raw braces).
 */
export function applyPlaceholders(input, vars = {}) {
  if (!input) return input;
  return String(input).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (whole, name) => {
    const raw = vars[name];
    if (raw == null || raw === "") return "";
    // loginUrl / orgUrl / logoUrl are meant to be pasted into href attributes.
    if (name.endsWith("Url") || name === "loginUrl" || name === "orgUrl") return String(raw);
    return escapeHtml(raw);
  });
}

/**
 * Apply an org override (if any) on top of a freshly built default mail.
 *
 * @param {{subject?: string, html: string}} mail  built-in result
 * @param {{subject?: string|null, bodyHtml?: string|null}} override  DB row
 * @param {object} vars  placeholder values
 * @returns {{subject: string, html: string, overridden: boolean}}
 */
export function applyMailOverride(mail, override, vars) {
  if (!override) return { ...mail, overridden: false };
  const rawSubject = (override.subject || "").trim();
  const rawBody = (override.bodyHtml || "").trim();
  const subject = rawSubject ? applyPlaceholders(rawSubject, vars) : mail.subject;
  const html = rawBody ? applyPlaceholders(rawBody, vars) : mail.html;
  return { subject, html, overridden: Boolean(rawSubject || rawBody) };
}
