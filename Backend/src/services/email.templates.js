// ==========================================
// SHARED EMAIL TEMPLATES
// ==========================================

const CLIENT_URL = () => process.env.CLIENT_URL || "";

const rs = (n) => `Rs. ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Inline "Fee Payment Receipt" block — dashed receipt box with ref number,
 * line items aur total (PDF receipt ka HTML mirror — email body mein hi dikhta
 * hai, attachment ka intezaar nahi karna parta).
 */
function receiptHtml(receipt, themeColor) {
  if (!receipt) return "";
  const items = (receipt.lineItems || []).filter((li) => li && li.title != null);
  if (!items.length) return "";
  const itemRows = items
    .map(
      (li) => `<tr>
        <td style="padding:7px 12px;color:#0d1c2f;font-size:13px;">${li.title}</td>
        <td style="padding:7px 12px;color:#0d1c2f;font-size:13px;text-align:right;font-weight:bold;">${rs(li.amount)}</td>
      </tr>`
    )
    .join("");
  const balanceRow = receipt.balance != null
    ? `<tr>
        <td style="padding:7px 12px;color:#444651;font-size:12px;">Outstanding Balance</td>
        <td style="padding:7px 12px;color:${receipt.balance > 0 ? "#b91c1c" : "#137333"};font-size:12px;text-align:right;font-weight:bold;">${rs(receipt.balance)}</td>
      </tr>`
    : "";
  return `<div style="margin-top:18px;border:2px dashed #c5c5d3;border-radius:10px;padding:16px 18px;background:#ffffff;">
    <p style="margin:0 0 2px;color:#0d1c2f;font-size:12px;font-weight:bold;letter-spacing:0.6px;text-transform:uppercase;">Fee Payment Receipt</p>
    <p style="margin:0 0 12px;color:#757682;font-size:11px;font-family:monospace;">REF ${receipt.refNo || "—"}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
      <tr><td colspan="2" style="border-top:1px solid #e6eeff;"></td></tr>
      <tr>
        <td style="padding:8px 12px;color:${themeColor};font-size:13px;font-weight:bold;">TOTAL PAID</td>
        <td style="padding:8px 12px;color:${themeColor};font-size:14px;font-weight:bold;text-align:right;">${rs(receipt.totalPaid)}</td>
      </tr>
      ${balanceRow}
    </table>
  </div>`;
}
// Public base URL of the backend — used to absolutize locally-uploaded
// /uploads/... image paths inside emails (email clients can't load relative
// URLs). Falls back to CLIENT_URL, whose dev proxy also serves /uploads.
const API_URL = () => process.env.API_URL || "";

/**
 * Absolute URL for a stored image. Cloudinary / data: URLs pass through
 * unchanged; relative /uploads/... paths (local-disk storage fallback) get
 * the public base URL so logos/photos actually render in email clients.
 */
function toAbsoluteUrl(url) {
  if (!url || !url.startsWith("/uploads/")) return url;
  const base = API_URL() || CLIENT_URL();
  return base ? `${base.replace(/\/+$/, "")}${url}` : url;
}

/**
 * Portal links for credential emails — frontend ke slug scheme ke mutabiq:
 *  - Login page:  /login?org={slug}&school={code}  (org + branch branding ke saath)
 *  - Root page:   /o/{slug}          (org ka public landing page)
 * schoolCode sirf fallback hai jab orgSlug available na ho.
 */
function buildPortalLinks({ orgSlug, schoolCode }) {
  const loginUrl = buildLoginUrl({ orgSlug, schoolCode });
  const orgUrl = orgSlug ? `${CLIENT_URL()}/o/${encodeURIComponent(orgSlug)}` : null;
  return { loginUrl, orgUrl };
}

/**
 * Branded login URL for email CTAs. Recipient ko org/branch ke page par laate
 * hain taake theme + logo already loaded hon sign-in ke waqt.
 */
export function buildLoginUrl({ orgSlug, schoolCode }) {
  if (orgSlug) {
    const schoolParam = schoolCode ? `&school=${encodeURIComponent(schoolCode)}` : "";
    return `${CLIENT_URL()}/login?org=${encodeURIComponent(orgSlug)}${schoolParam}`;
  }
  if (schoolCode) return `${CLIENT_URL()}/login?code=${encodeURIComponent(schoolCode)}`;
  return `${CLIENT_URL()}/login`;
}

function linkHtml(url, label) {
  return `<p>${label}: <a href="${url}" style="color:#4f46e5;">${url}</a></p>`;
}

/**
 * Branded parent-notification email (admission test / approved / enrolled etc.)
 * — Oxford-blue "Academic Clarity System" design, mirroring the slip / ID-card
 * templates (stitch_school_slip_creator/DESIGN.md): deep blue header with the
 * school logo, sky accent strip, soft rounded surfaces and a label/value
 * details table with alternating tints.
 * Inline styles only (Gmail/Outlook safe), logo optional (fallback initial).
 */
export function parentNotificationEmail({ schoolName = "School", orgName, logoUrl, themeColor = "#00236f", title, message, details = [], address, phone, receipt }) {
  const brandName = orgName || schoolName;
  const initial = (brandName || "S").trim().charAt(0).toUpperCase();
  const fallbackLogo = `${CLIENT_URL()}/screen.png`;
  const logoHtml = logoUrl
    ? `<img src="${toAbsoluteUrl(logoUrl)}" width="52" height="52" alt="" style="display:block;border-radius:50%;object-fit:cover;background:#ffffff;border:2px solid rgba(255,255,255,0.3);" />`
    : `<img src="${fallbackLogo}" width="52" height="52" alt="" style="display:block;border-radius:10px;object-fit:contain;background:#ffffff;border:2px solid rgba(255,255,255,0.3);" />`;
  const subName = orgName && orgName !== schoolName ? orgName : "";

  // Label/value rows — slip jaisi table: uppercase blue label column,
  // alternating white / light-blue fills, sky-tinted border.
  const detailsHtml = details.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border:1px solid #d5e3fd;border-radius:10px;overflow:hidden;">
        ${details
          .filter(([, v]) => v != null && v !== "")
          .map(
            ([label, value], i) => `<tr style="background:${i % 2 === 0 ? "#ffffff" : "#eff4ff"};">
          <td style="padding:10px 14px;background:${themeColor};color:#ffffff;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;width:120px;">${label}</td>
          <td style="padding:10px 14px;color:#0d1c2f;font-size:14px;">${value}</td>
        </tr>`
          )
          .join("")}
      </table>`
    : "";
  const contactHtml = address || phone
    ? `<div style="margin:4px 0 6px;">${[address, phone].filter(Boolean).join(" · ")}</div>`
    : "";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#eff4ff;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff4ff;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #c5c5d3;">
            <tr>
              <td style="background:${themeColor};padding:22px 28px 0;border-bottom:3px solid #64a8fe;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding-bottom:20px;">
                  <tr>
                    <td style="width:64px;padding-right:14px;">${logoHtml}</td>
                    <td>
                      <p style="margin:0;color:#ffffff;font-size:17px;font-weight:bold;line-height:1.3;">${schoolName}</p>
                      ${subName ? `<p style="margin:3px 0 0;color:#b6c4ff;font-size:12px;letter-spacing:0.5px;">${subName}</p>` : ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 28px 6px;">
                <h2 style="margin:0 0 4px;color:#0d1c2f;font-size:18px;">${title}</h2>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 26px;color:#444651;font-size:14px;line-height:1.7;">
                <div style="background:#f8f9ff;border:1px solid #e6eeff;border-left:4px solid ${themeColor};border-radius:10px;padding:16px 20px;">
                  ${message.replace(/\n/g, "<br/>")}
                </div>
                ${detailsHtml}
                ${receiptHtml(receipt, themeColor)}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #e6eeff;color:#757682;font-size:12px;line-height:1.6;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:40px;vertical-align:middle;padding-right:10px;">
                      ${logoUrl ? `<img src="${toAbsoluteUrl(logoUrl)}" width="32" height="32" alt="" style="display:block;border-radius:6px;object-fit:contain;background:#ffffff;" />` : `<img src="${fallbackLogo}" width="32" height="32" alt="" style="display:block;border-radius:6px;object-fit:contain;background:#ffffff;" />`}
                    </td>
                    <td>
                      <p style="margin:0;font-weight:bold;color:#444651;">${schoolName}</p>
                      ${subName ? `<p style="margin:2px 0 0;color:#9ca3af;font-size:11px;">${subName}</p>` : ""}
                    </td>
                  </tr>
                </table>
                ${contactHtml}
                <span style="color:#b0b1bd;">This is an automated message from your school's management system.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Minimal, mobile-friendly HTML wrapper used by all transactional emails.
 * Inline styles only (no external CSS) so Gmail/Outlook render it correctly.
 * @param {string} title
 * @param {string} bodyHtml
 * @param {object} [opts]
 * @param {string} [opts.logoUrl]  - Absolute URL of the logo image to show in header
 */
export function wrapEmail(title, bodyHtml, opts = {}) {
  const logoUrl = opts.logoUrl ? toAbsoluteUrl(opts.logoUrl) : `${CLIENT_URL()}/screen.png`;
  const themeColor = opts.themeColor || "#00236f";
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;border-radius:8px;object-fit:contain;background:#ffffff;margin-right:12px;" />`
    : "";
  const brandName = opts.branchName || opts.orgName || "School ERP";
  const subName = opts.branchName && opts.orgName && opts.branchName !== opts.orgName ? opts.orgName : "";
  const senderLogoHtml = logoUrl
    ? `<img src="${logoUrl}" width="32" height="32" alt="" style="display:inline-block;vertical-align:middle;border-radius:6px;object-fit:contain;background:#ffffff;margin-right:8px;" />`
    : "";
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#eff4ff;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff4ff;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #c5c5d3;">
            <tr>
              <td style="background:${themeColor};padding:20px 28px;border-bottom:3px solid #64a8fe;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:52px;padding-right:12px;">${logoHtml}</td>
                    <td>
                      <h1 style="margin:0;color:#ffffff;font-size:18px;line-height:1.3;">${brandName}</h1>
                      ${subName ? `<p style="margin:2px 0 0;color:#b6c4ff;font-size:11px;letter-spacing:0.5px;">${subName}</p>` : ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#444651;font-size:14px;line-height:1.7;">${bodyHtml}</td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #e6eeff;color:#757682;font-size:12px;line-height:1.6;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${senderLogoHtml ? `<td style="width:40px;vertical-align:middle;padding-right:8px;">${senderLogoHtml}</td>` : ""}
                    <td>
                      <p style="margin:0;font-weight:bold;color:#444651;">${brandName}</p>
                      ${subName ? `<p style="margin:2px 0 0;color:#9ca3af;font-size:11px;">${subName}</p>` : ""}
                      <p style="margin:4px 0 0;"><a href="${CLIENT_URL()}" style="color:#6b7280;">${CLIENT_URL()}</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function credentialsBox(rows, title = "Login Credentials") {
  const lis = rows
    .filter((r) => r.value)
    .map((r) => `<li style="margin:4px 0;"><b>${r.label}:</b> <span style="font-family:monospace;">${r.value}</span></li>`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0 0 8px;font-weight:bold;color:#111827;">${title}</p>
      <ul style="margin:0;padding-left:18px;">${lis}</ul>
    </td></tr>
  </table>`;
}

/**
 * Organization welcome email — sent on create (single or bulk import).
 * `viaImport` only changes the wording ("created" vs "setup via bulk import").
 */
/**
 * Branch admin (Principal) credentials email.
 * Full-branded Oxford-blue template (mirrors parentNotificationEmail design)
 * with a logo header, welcome banner, credential table, CTA button, and
 * security tips — inline styles only for Gmail/Outlook compatibility.
 */
export function adminCredentialsEmail({ orgName, orgSlug, schoolName, name, email, username, password, schoolCode, logoUrl, themeColor }) {
  const { loginUrl, orgUrl } = buildPortalLinks({ orgSlug, schoolCode });
  const brandName = orgName || "School ERP";
  const initial = (brandName || "S").trim().charAt(0).toUpperCase();
  const fallbackLogo = `${CLIENT_URL()}/screen.png`;
  const resolvedLogo = logoUrl ? toAbsoluteUrl(logoUrl) : fallbackLogo;
  const logoHtml = resolvedLogo
    ? `<img src="${resolvedLogo}" width="52" height="52" alt="" style="display:block;border-radius:50%;object-fit:cover;background:#ffffff;border:2px solid rgba(255,255,255,0.3);" />`
    : `<div style="width:52px;height:52px;border-radius:50%;background:#ffffff;border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;color:#00236f;">${initial}</div>`;
  const hdrColor = themeColor || "#00236f";

  // Credential rows — label-value table with alternating tints
  const credRows = [
    ["Organization", orgName],
    ["Branch", schoolName],
    ["School Code", schoolCode],
    ["Email", email],
    username ? ["Username", username] : null,
    ["Password", password],
  ].filter(Boolean);

  const credTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border:1px solid #d5e3fd;border-radius:10px;overflow:hidden;">
    ${credRows.map(([label, value], i) => `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#eff4ff'};">
      <td style="padding:10px 14px;background:${hdrColor};color:#ffffff;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;width:120px;">${label}</td>
      <td style="padding:10px 14px;color:#0d1c2f;font-size:14px;font-family:monospace;">${value}</td>
    </tr>`).join("")}
  </table>`;

  // CTA button
  const ctaButton = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="border-radius:8px;background:${hdrColor};">
        <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:8px;">Log In to Portal</a>
      </td>
    </tr>
  </table>`;

  const orgLink = orgUrl ? `<p style="margin:4px 0;color:#757682;font-size:13px;">Organization page: <a href="${orgUrl}" style="color:#4f46e5;">${orgUrl}</a></p>` : "";

  const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0;padding:0;background:#eff4ff;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff4ff;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #c5c5d3;">
          <!-- Header -->
          <tr>
            <td style="background:${hdrColor};padding:22px 28px 0;border-bottom:3px solid #64a8fe;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding-bottom:20px;">
                <tr>
                  <td style="width:64px;padding-right:14px;">${logoHtml}</td>
                  <td>
                    <p style="margin:0;color:#ffffff;font-size:17px;font-weight:bold;line-height:1.3;">${brandName}</p>
                    ${schoolName ? `<p style="margin:3px 0 0;color:#b6c4ff;font-size:12px;letter-spacing:0.5px;">${schoolName}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Welcome banner -->
          <tr>
            <td style="padding:26px 28px 6px;">
              <h2 style="margin:0 0 4px;color:#0d1c2f;font-size:18px;">Welcome aboard, ${name || 'Admin'}! 🎉</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 20px;color:#444651;font-size:14px;line-height:1.7;">
              <div style="background:#f8f9ff;border:1px solid #e6eeff;border-left:4px solid ${hdrColor};border-radius:10px;padding:16px 20px;">
                Your account as <b>Branch Admin / Principal</b> for <b>${schoolName || 'your branch'}</b> under <b>${orgName}</b> has been created successfully.<br/>
                Use the credentials below to log in to the portal and start managing your branch.
              </div>
            </td>
          </tr>
          <!-- Credentials -->
          <tr>
            <td style="padding:0 28px 4px;color:#0d1c2f;font-size:13px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;">Login Credentials</td>
          </tr>
          <tr>
            <td style="padding:0 28px;">${credTable}</td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:4px 28px 20px;">${ctaButton}</td>
          </tr>
          <!-- Security tip -->
          <tr>
            <td style="padding:0 28px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef9ee;border:1px solid #fde68a;border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px;font-size:13px;color:#92400e;line-height:1.6;">
                    <b>🔒 Security Tip:</b> Please change your password immediately after your first login. Do not share your credentials with anyone.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${orgLink}
          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #e6eeff;color:#757682;font-size:12px;line-height:1.6;">
              ${brandName}${schoolName ? ` · ${schoolName}` : ""}<br/>
              <span style="color:#b0b1bd;">This is an automated message from your school's management system.</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return {
    subject: `Welcome to ${brandName} — Your Admin Credentials`,
    text: `Hello ${name},\n\nYour branch account is ready.\nOrganization: ${orgName}\nBranch: ${schoolName}\nPortal: ${loginUrl}${orgUrl ? `\nOrganization page: ${orgUrl}` : ""}\n\nLogin credentials:\nSchool Code: ${schoolCode}\nEmail: ${email}${username ? `\nUsername: ${username}` : ""}\nPassword: ${password}\n\nLogin using your School Code + Username/Email and Password.\nPlease change your password after logging in.`,
    html,
  };
}

/**
 * Staff account credentials email (single create + bulk import).
 */
export function staffCredentialsEmail({ name, role, username, email, password, schoolCode, orgName, orgSlug, logoUrl, themeColor }) {
  // Branded links (slug scheme) — staff/teacher ko bhi org root + login page mile.
  const { loginUrl, orgUrl } = buildPortalLinks({ orgSlug, schoolCode });
  const roleLabel = (role || "Staff").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const body = `
    <p>Hello <b>${name}</b>,</p>
    <p>Your staff account has been created for the role <b>${roleLabel}</b>.</p>
    ${linkHtml(loginUrl, "Login")}
    ${orgUrl ? linkHtml(orgUrl, "Organization page") : ""}
    ${credentialsBox([
      { label: "Organization", value: orgName },
      { label: "School Code", value: schoolCode },
      { label: "Staff ID / Username", value: username },
      { label: "Email", value: email },
      { label: "Password", value: password },
    ])}
    <p style="color:#b91c1c;">Please change your password after logging in.</p>
    <p style="margin-bottom:0;">Login using your Email or Staff ID + School Code.</p>
  `;

  return {
    subject: `School ERP - Staff Account Credentials (${roleLabel})`,
    text: `Hello ${name},\n\nYour staff account has been created (role: ${roleLabel}).\nPortal: ${loginUrl}${orgUrl ? `\nOrganization page: ${orgUrl}` : ""}\n\nLogin credentials:\n${orgName ? `Organization: ${orgName}\n` : ""}${schoolCode ? `School Code: ${schoolCode}\n` : ""}Staff ID / Username: ${username}\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in.`,
    html: wrapEmail("Welcome to School ERP", body, { logoUrl, orgName, branchName: orgName, themeColor }),
  };
}

/**
 * Moderation notice (org/branch blocked or unblocked) sent to the affected
 * org/branch ADMIN — NOT to the SUPER_ADMIN (platform credential holder).
 * `action` = "blocked" | "unblocked".
 */
export function moderationNoticeEmail({ name, entityName, entityType, action, reason, logoUrl, themeColor }) {
  const verb = action === "unblocked" ? "restored (unblocked)" : "suspended (blocked)";
  const headline =
    entityType === "SCHOOL"
      ? `Your branch "${entityName}" has been ${verb}`
      : `Your organization "${entityName}" has been ${verb}`;
  const body = `
    <p>Hello ${name || "Admin"},</p>
    <p>${headline} by the platform administrator.</p>
    ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ""}
    <p>While ${action === "blocked" ? "suspended" : "restored"}, access for staff, students and parents is ${action === "blocked" ? "disabled" : "re-enabled"}. Contact the platform administrator if you believe this is an error.</p>
    <p style="margin-bottom:0;">This is an automated notice — please do not reply.</p>
  `;
  return {
    subject: `${entityType === "SCHOOL" ? "Branch" : "Organization"} ${action === "blocked" ? "Blocked" : "Unblocked"}: ${entityName}`,
    text: `Hello ${name || "Admin"},\n\n${headline} by the platform administrator.${reason ? `\nReason: ${reason}` : ""}\n\nThis is an automated notice.`,
    html: wrapEmail("Account Status Update", body, { logoUrl, orgName: entityName, themeColor }),
  };
}

/**
 * Platform Announcement email — super admin se saare branch admins ko.
 */
export function announcementEmail({ name, title, message, logoUrl, themeColor }) {
  const body = `
    <p>Hello ${name || "Admin"},</p>
    <p><b>${title}</b></p>
    <p style="white-space:pre-line;">${(message || "").replace(/</g, "&lt;")}</p>
    <p style="margin-bottom:0;color:#666;font-size:12px;">This is an automated announcement from the platform administrator.</p>
  `;
  return {
    subject: `📢 ${title}`,
    text: `Hello ${name || "Admin"},\n\n${title}\n\n${message || ""}\n\nThis is an automated announcement.`,
    html: wrapEmail("Platform Announcement", body, { logoUrl, themeColor }),
  };
}
