import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import bwipjs from "bwip-js";
import sharp from "sharp";
import Logger from "../lib/utils/logger.js";
import storageService from "./storage.service.js";

const logger = new Logger("pdf-service");

// ─── Design tokens (Oxford-blue "Corporate Modernism") ────────────────────────
const C = {
  primary:            "#00236f",
  primaryContainer:   "#1e3a8a",
  primaryDim:         "#b6c4ff",
  secondary:          "#0060ac",
  secondaryContainer: "#64a8fe",
  surface:            "#f8f9ff",
  surfaceLow:         "#eff4ff",
  surfaceContainer:   "#e6eeff",
  surfaceHigh:        "#dde9ff",
  surfaceHighest:     "#d5e3fd",
  onSurface:          "#0d1c2f",
  onSurfaceVariant:   "#444651",
  outlineVariant:     "#c5c5d3",
  white:              "#ffffff",
  gold:               "#c9a22a",      // classic Pakistani ID-card gold accent
  goldSoft:           "#e8d9a8",
  silhouette:         "#7b93cc",   // muted blue used for avatar shapes
  silhouetteFace:     "#a8bedf",   // lighter shade for face/skin area
  badgeGreenBg:       "#e6f4ea",
  badgeGreenFg:       "#137333",
  badgeAmberBg:       "#fef3c7",
  badgeAmberFg:       "#92400e",
  badgeRedBg:         "#fee2e2",
  badgeRedFg:         "#b91c1c",
};

const FONT = {
  regular:  "Helvetica",
  bold:     "Helvetica-Bold",
  italic:   "Helvetica-Oblique",
  mono:     "Courier",
  monoBold: "Courier-Bold",
};

const A4 = { width: 595.28, height: 841.89 };

const rs        = (n)  => `Rs. ${Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;
const dateStr   = (d)  => d ? new Date(d).toLocaleDateString("en-PK") : "—";
const monthYear = (d)  => d ? new Date(d).toLocaleDateString("en-PK", { month: "short", year: "numeric" }) : "—";

function badgeColors(status) {
  const s = String(status || "").toUpperCase();
  if (["APPROVED","PAID","ENROLLED","SENT","DELIVERED","ACTIVE"].includes(s))
    return { bg: C.badgeGreenBg, fg: C.badgeGreenFg };
  if (["PENDING","FEE_PENDING","PARTIAL","UNPAID"].includes(s))
    return { bg: C.badgeAmberBg, fg: C.badgeAmberFg };
  if (["REJECTED","FAILED","OVERDUE","BLOCKED"].includes(s))
    return { bg: C.badgeRedBg, fg: C.badgeRedFg };
  return { bg: C.surfaceContainer, fg: C.primary };
}

async function imageToBuffer(url) {
  if (!url) return null;
  try {
    let buf = null;
    if (url.startsWith("/uploads/")) {
      const p = path.join(storageService.getUploadRoot(), url.replace("/uploads/", ""));
      buf = existsSync(p) ? await readFile(p) : null;
    } else if (url.startsWith("data:")) {
      const c = url.indexOf(",");
      buf = c === -1 ? null : Buffer.from(url.slice(c + 1), "base64");
    } else if (/^https?:\/\//.test(url)) {
      const r = await fetch(url);
      buf = r.ok ? Buffer.from(await r.arrayBuffer()) : null;
    }
    if (!buf) return null;

    // PDFKit sirf JPEG/PNG render karta hai — WebP/AVIF (Cloudinary
    // fetch_format:auto ya q75 re-encode) aaye to sharp se PNG banao,
    // warna logo PDF par nahi dikhta.
    const isPng = buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47 && buf.readUInt32BE(4) === 0x0d0a1a0a;
    const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (!isPng && !isJpeg) {
      buf = await sharp(buf).rotate().png().toBuffer();
    }
    return buf;
  } catch (e) {
    logger.logger.warn(`[PDF] image load failed: ${e.message}`);
  }
  return null;
}

async function qrBuffer(data) {
  if (!data) return null;
  try {
    return await QRCode.toBuffer(String(data), {
      width: 200, margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (e) {
    logger.logger.warn(`[PDF] QR failed: ${e.message}`);
    return null;
  }
}

// Code-128 barcode (PNG) via bwip-js — front of the student ID card.
async function barcodeBuffer(data, { height = 12, scale = 3 } = {}) {
  if (!data) return null;
  try {
    return await bwipjs.toBuffer({
      bcid: "code128",
      text: String(data),
      scale,
      height,
      includetext: true,
      textxalign: "center",
      textyoffset: 2,
      paddingwidth: 4,
      paddingheight: 4,
      backgroundcolor: "FFFFFF",
      barcolor: "000000",
      textcolor: "000000",
    });
  } catch (e) {
    logger.logger.warn(`[PDF] barcode failed: ${e.message}`);
    return null;
  }
}

// ─── Gender-aware avatar placeholder ─────────────────────────────────────────
// Draws directly into the clipped photo region [px,py,pw,ph].
// No external resources needed — purely PDFKit vector shapes.
function drawAvatarPlaceholder(doc, px, py, pw, ph, gender, themeColor = C.primary) {
  const cx = px + pw / 2;
  const isFem = gender && String(gender).toUpperCase() === "FEMALE";

  doc.save();
  // Soft background matching theme
  doc.rect(px, py, pw, ph).fillColor(C.surfaceHigh).fill();
  
  if (isFem) {
    // Abstract female profile
    doc.circle(cx, py + ph * 0.4, pw * 0.22).fillColor(C.surfaceHighest).fill();
    doc.circle(cx, py + ph * 0.4, pw * 0.17).fillColor(C.silhouetteFace).fill();
    
    // Hijab/hair abstraction
    doc.moveTo(cx - pw * 0.28, py + ph).lineTo(cx - pw * 0.22, py + ph * 0.6)
       .bezierCurveTo(cx - pw * 0.2, py + ph * 0.35, cx + pw * 0.2, py + ph * 0.35, cx + pw * 0.22, py + ph * 0.6)
       .lineTo(cx + pw * 0.28, py + ph)
       .closePath().fillColor(themeColor || C.primary).fillOpacity(0.2).fill();
  } else {
    // Abstract male profile
    doc.circle(cx, py + ph * 0.35, pw * 0.22).fillColor(C.silhouetteFace).fill();
    
    // Shoulders
    doc.moveTo(cx - pw * 0.38, py + ph)
       .bezierCurveTo(cx - pw * 0.35, py + ph * 0.65, cx - pw * 0.15, py + ph * 0.6, cx, py + ph * 0.6)
       .bezierCurveTo(cx + pw * 0.15, py + ph * 0.6, cx + pw * 0.35, py + ph * 0.65, cx + pw * 0.38, py + ph)
       .closePath().fillColor(themeColor || C.primary).fillOpacity(0.2).fill();
  }

  // Camera icon in center
  doc.lineWidth(1.5).strokeColor(themeColor || C.primary).strokeOpacity(0.5);
  const ix = cx - 14, iy = py + ph * 0.75 - 10;
  doc.roundedRect(ix, iy, 28, 20, 4).stroke();
  doc.circle(cx, iy + 10, 5).stroke();
  doc.rect(cx - 4, iy - 3, 8, 3).fillColor(themeColor || C.primary).fillOpacity(0.5).fill();
  doc.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
class PdfService {
  _buildDoc(size, draw) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size, margin: 0, bufferPages: true });
        const chunks = [];
        doc.on("data", (c) => chunks.push(c));
        doc.on("end",  () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        draw(doc);
        doc.end();
      } catch (e) {
        logger.logger.error(`[PDF] build failed: ${e.message}`);
        reject(e);
      }
    });
  }

  // ── Slip header (A4 slips) ────────────────────────────────────────────────
  _drawSlipHeader(doc, { logo, schoolName, title, themeColor, cardX, cardW }) {
    const cx = A4.width / 2;
    let y = 76;
    const logoD = 58;

    // Logo circle
    doc.save();
    doc.circle(cx, y + logoD / 2, logoD / 2 + 3).fillColor(C.surfaceHigh).fill();
    doc.circle(cx, y + logoD / 2, logoD / 2 + 3).lineWidth(1).strokeColor(C.outlineVariant).stroke();
    if (logo) {
      doc.circle(cx, y + logoD / 2, logoD / 2 - 1).clip();
      doc.image(logo, cx - logoD / 2 + 1, y + 1, { fit: [logoD - 2, logoD - 2] });
    } else {
      doc.circle(cx, y + logoD / 2, logoD / 2 - 2).fillColor(C.surfaceContainer).fill();
      doc.font(FONT.bold).fontSize(20).fillColor(themeColor)
         .text((schoolName || "S").charAt(0), cx - logoD / 2, y + logoD / 2 - 13, { width: logoD, align: "center" });
    }
    doc.restore();
    y += logoD + 14;

    doc.font(FONT.bold).fontSize(16).fillColor(themeColor);
    const nh = doc.heightOfString(schoolName, { width: cardW - 60, align: "center" });
    doc.text(schoolName, cardX + 30, y, { width: cardW - 60, align: "center", lineGap: 2 });
    y += nh + 5;

    doc.font(FONT.regular).fontSize(9).fillColor(C.onSurfaceVariant)
       .text(String(title).toUpperCase(), cardX + 30, y, { width: cardW - 60, align: "center", characterSpacing: 1.8 });
    y += 18;
    doc.moveTo(cardX + 24, y).lineTo(cardX + cardW - 24, y).lineWidth(0.75).strokeColor(C.outlineVariant).stroke();
    return y + 20;
  }

  // ── Centered QR + ref number ──────────────────────────────────────────────
  _drawQrBlock(doc, { qr, refNo, cardX, cardW, y }) {
    const box = 104;
    const qx  = A4.width / 2 - box / 2;
    doc.save();
    doc.roundedRect(qx - 6, y - 6, box + 12, box + 12, 10).fillColor(C.surfaceLow).fill();
    doc.roundedRect(qx - 6, y - 6, box + 12, box + 12, 10).lineWidth(1).strokeColor(C.outlineVariant).stroke();
    doc.roundedRect(qx, y, box, box, 6).fillColor(C.white).fill();
    if (qr) doc.image(qr, qx + 6, y + 6, { fit: [box - 12, box - 12] });
    doc.restore();
    y += box + 16;
    doc.font(FONT.mono).fontSize(9).fillColor(C.onSurfaceVariant)
       .text(`REF  ${refNo || "—"}`, cardX + 20, y, { width: cardW - 40, align: "center", characterSpacing: 0.5 });
    return y + 22;
  }

  // ── Detail rows panel ─────────────────────────────────────────────────────
  _drawRowsPanel(doc, { rows, cardX, cardW, y, themeColor }) {
    const rowH = 34, pad = 10;
    const boxH = rows.length * rowH + pad * 2;
    doc.save();
    doc.roundedRect(cardX + 10, y, cardW - 20, boxH, 10).fillColor(C.surfaceLow).fill();
    doc.roundedRect(cardX + 10, y, cardW - 20, boxH, 10).lineWidth(1).strokeColor(C.outlineVariant).stroke();
    doc.restore();
    rows.forEach((r, i) => {
      const ry = y + pad + i * rowH;
      doc.font(FONT.regular).fontSize(8).fillColor(C.onSurfaceVariant)
         .text(String(r.label).toUpperCase(), cardX + 24, ry + 2, { width: 130, characterSpacing: 0.8 });
      if (String(r.label).toLowerCase() === "status") {
        const bc  = badgeColors(r.value);
        const txt = String(r.value).replace(/_/g, " ");
        doc.font(FONT.bold).fontSize(8).fillColor(bc.fg);
        const bw = doc.widthOfString(txt) + 22;
        const bx = cardX + cardW - 24 - bw;
        doc.save();
        doc.roundedRect(bx, ry, bw, 20, 10).fillColor(bc.bg).fill();
        doc.restore();
        doc.text(txt, bx, ry + 6, { width: bw, align: "center" });
      } else {
        doc.font(r.emphasis ? FONT.bold : FONT.regular)
           .fontSize(r.emphasis ? 12 : 11)
           .fillColor(r.emphasis ? themeColor : C.onSurface)
           .text(String(r.value), cardX + 24 + 130, ry, { width: cardW - 48 - 130, align: "right" });
      }
      if (i < rows.length - 1)
        doc.moveTo(cardX + 24, ry + rowH - 4).lineTo(cardX + cardW - 24, ry + rowH - 4)
           .lineWidth(0.5).strokeColor(C.outlineVariant).stroke();
    });
    return y + boxH + 16;
  }

  // ── Fee table ─────────────────────────────────────────────────────────────
  _drawFeeTable(doc, { lineItems, totalPaid, cardX, cardW, y, themeColor, totalLabel = "TOTAL PAID" }) {
    const items   = (lineItems || []).filter((li) => li && li.title != null);
    const colX    = cardX + 24;
    const amountW = 120;
    const amountX = cardX + cardW - 24 - amountW;
    const headH   = 28, rowH = 28;
    const tableH  = headH + items.length * rowH + 32;

    doc.save();
    doc.roundedRect(colX, y, cardW - 48, tableH, 8).lineWidth(0.75).strokeColor(C.outlineVariant).stroke();
    doc.restore();

    doc.save();
    doc.roundedRect(colX, y, cardW - 48, headH, [6, 6, 0, 0]).fillColor(themeColor).fill();
    doc.restore();
    doc.font(FONT.bold).fontSize(9).fillColor(C.white)
       .text("DESCRIPTION", colX + 12, y + 9, { width: amountX - colX - 20 });
    doc.font(FONT.bold).fontSize(9).fillColor(C.white)
       .text("AMOUNT", amountX, y + 9, { width: amountW, align: "right" });
    y += headH;

    items.forEach((li, i) => {
      if (i % 2 === 1) {
        doc.save();
        doc.rect(colX, y, cardW - 48, rowH).fillColor(C.surfaceLow).fill();
        doc.restore();
      }
      doc.font(FONT.regular).fontSize(10).fillColor(C.onSurface)
         .text(String(li.title || li.description || "Fee"), colX + 12, y + 9, { width: amountX - colX - 20 });
      doc.font(FONT.mono).fontSize(9.5).fillColor(C.onSurface)
         .text(rs(li.amount), amountX, y + 9, { width: amountW, align: "right" });
      if (li.paid) {
        doc.font(FONT.bold).fontSize(8).fillColor(C.badgeGreenFg)
           .text("PAID", colX + 12, y + 9, { continued: true, width: amountX - colX - 24, align: "right" });
      }
      y += rowH;
    });

    doc.save();
    doc.rect(colX, y, cardW - 48, 32).fillColor(C.surfaceContainer).fill();
    doc.restore();
    doc.moveTo(colX, y).lineTo(cardX + cardW - 24, y).lineWidth(1.5).strokeColor(themeColor).stroke();
    doc.font(FONT.bold).fontSize(11).fillColor(themeColor)
       .text(totalLabel, colX + 12, y + 10, { width: amountX - colX - 20 });
    doc.font(FONT.monoBold).fontSize(12).fillColor(themeColor)
       .text(rs(totalPaid), amountX, y + 9, { width: amountW, align: "right" });
    return y + 46;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMISSION FEE SLIP  (A4) — premium two-column layout with prominent fee
  // section, applicant details, and payment instructions.
  // ═══════════════════════════════════════════════════════════════════════════
  async admissionSlip({ schoolName, applicant, refNo, amount, dueDate, themeColor, logoUrl }) {
    const logo  = await imageToBuffer(logoUrl);
    const qr    = await qrBuffer(refNo);
    const theme = themeColor || C.primary;
    // Keep every entry point consistent: older callers passed a name string,
    // while the polished slip needs structured applicant metadata.
    const rawApplicant = applicant && typeof applicant === "object" ? applicant : { firstName: applicant };
    applicant = {
      firstName: rawApplicant.firstName || rawApplicant.name || "Applicant",
      lastName: rawApplicant.lastName || "",
      className: rawApplicant.className || rawApplicant.class?.name || "Not assigned",
      parentName: rawApplicant.parentName || rawApplicant.fatherName || rawApplicant.guardianName || "Not provided",
      parentWhatsappNo: rawApplicant.parentWhatsappNo || rawApplicant.parentPhone || rawApplicant.phone || "Not provided",
      status: rawApplicant.status || "APPROVED",
    };
    const cardW = 440, cardX = (A4.width - cardW) / 2;
    const cardTop = 40, cardH = 752;

    return this._buildDoc("A4", (doc) => {
      doc.rect(0, 0, A4.width, A4.height).fillColor(C.surfaceLow).fill();
      doc.save();
      doc.roundedRect(cardX + 3, cardTop + 3, cardW, cardH, 14).fillColor("#cdd5ee").fill();
      doc.restore();
      doc.save();
      doc.roundedRect(cardX, cardTop, cardW, cardH, 14).fillColor(C.white).fill();
      doc.roundedRect(cardX, cardTop, cardW, cardH, 14).lineWidth(1).strokeColor(C.outlineVariant).stroke();
      doc.restore();

      // ── Branded header band ──
      const headH = 64;
      const bandGrad = doc.linearGradient(cardX, cardTop, cardX + cardW, cardTop);
      bandGrad.stop(0, theme, 1).stop(1, C.primaryContainer, 1);
      doc.save();
      doc.roundedRect(cardX, cardTop, cardW, headH, [14, 14, 0, 0]).fill(bandGrad);
      doc.restore();
      doc.rect(cardX, cardTop + headH - 3, cardW, 3).fillColor(C.gold).fill();

      const logoD = 44;
      doc.save();
      doc.circle(cardX + 22 + logoD / 2, cardTop + headH / 2, logoD / 2 + 2).fillColor(C.white).fill();
      doc.circle(cardX + 22 + logoD / 2, cardTop + headH / 2, logoD / 2 - 1).clip();
      if (logo) doc.image(logo, cardX + 23, cardTop + headH / 2 - logoD / 2 + 1, { fit: [logoD - 2, logoD - 2] });
      else doc.font(FONT.bold).fontSize(17).fillColor(theme)
         .text((schoolName || "S").charAt(0), cardX + 23, cardTop + headH / 2 - 12, { width: logoD, align: "center" });
      doc.restore();
      doc.font(FONT.bold).fontSize(15).fillColor(C.white)
         .text(schoolName || "School", cardX + 80, cardTop + 14, { width: cardW - 100 });
      doc.font(FONT.regular).fontSize(8).fillColor(C.surfaceHighest)
         .text("ADMISSION FEE SLIP", cardX + 80, cardTop + 34, { width: cardW - 100, characterSpacing: 1.5 });

      let y = cardTop + headH + 24;

      // ── Applicant name ──
      const fullName = `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() || "Applicant";
      doc.font(FONT.bold).fontSize(7).fillColor(C.onSurfaceVariant)
         .text("ADMITTED APPLICANT", cardX + 24, y, { width: cardW - 48, characterSpacing: 1.2 });
      y += 14;
      doc.font(FONT.bold).fontSize(19).fillColor(theme)
         .text(fullName, cardX + 24, y, { width: cardW - 48 });
      const nameH = doc.heightOfString(fullName, { width: cardW - 48 });
      y += nameH + 12;

      // ── Info + amount two-column ──
      const colW = (cardW - 48 - 16) / 2;
      const lx = cardX + 24, rx = cardX + 24 + colW + 16;
      const leftRows = [
        ["CLASS",     applicant.className || "N/A"],
        ["PARENT",    applicant.parentName || "—"],
        ["CONTACT",   applicant.parentWhatsappNo || applicant.parentPhone || "—"],
      ];
      const rightRows = [
        ["REFERENCE", refNo || "—"],
        ["STATUS",    String(applicant.status || "APPROVED").replace(/_/g, " ")],
        ["PAYABLE BY", dueDate ? dateStr(dueDate) : "Immediately"],
      ];
      const rowH = 30;
      const drawInfo = (r, ix, iy, isStatus) => {
        doc.save();
        doc.roundedRect(ix, iy, colW, rowH - 6, 8).fillColor(C.surfaceLow).fill();
        doc.roundedRect(ix, iy, colW, rowH - 6, 8).lineWidth(0.75).strokeColor(C.outlineVariant).stroke();
        doc.restore();
        doc.font(FONT.bold).fontSize(6.5).fillColor(theme)
           .text(r.label, ix + 10, iy + 5, { width: colW - 20, characterSpacing: 0.8 });
        if (isStatus) {
          const bc = badgeColors(r.value);
          const bw = doc.widthOfString(r.value) + 18;
          doc.save();
          doc.roundedRect(ix + 10, iy + 15, bw, 14, 7).fillColor(bc.bg).fill();
          doc.restore();
          doc.font(FONT.bold).fontSize(8).fillColor(bc.fg).text(r.value, ix + 10, iy + 18, { width: bw, align: "center" });
        } else {
          doc.font(FONT.bold).fontSize(10).fillColor(C.onSurface)
             .text(String(r.value), ix + 10, iy + 16, { width: colW - 20, ellipsis: true });
        }
      };
      leftRows.forEach((r, i) => drawInfo(r, lx, y + i * rowH, false));
      rightRows.forEach((r, i) => drawInfo(r, rx, y + i * rowH, String(r.label) === "STATUS"));
      y += leftRows.length * rowH + 14;

      // ── Payable amount focal ──
      const adv = Number(amount || 0);
      if (adv > 0) {
        const feeH = 64;
        doc.save();
        doc.roundedRect(cardX + 24, y, cardW - 48, feeH, 12).fillColor(theme).fill();
        doc.roundedRect(cardX + 24, y, 6, feeH, [12, 0, 0, 12]).fillColor(C.gold).fill();
        doc.restore();
        doc.font(FONT.regular).fontSize(9).fillColor(C.surfaceHighest)
           .text("ADVANCE FEE PAYABLE", cardX + 44, y + 12, { width: cardW - 80, characterSpacing: 1.4 });
        doc.font(FONT.monoBold).fontSize(22).fillColor(C.white)
           .text(rs(adv), cardX + 44, y + 28, { width: cardW - 80 });
        y += feeH + 16;
      }

      // ── Instructions / notes ──
      doc.font(FONT.bold).fontSize(8).fillColor(theme)
         .text("INSTRUCTIONS", cardX + 24, y, { width: cardW - 48, characterSpacing: 1.2 });
      y += 13;
      const notes = [
        "1. Present this slip at the school office to pay the admission fee.",
        "2. Fee once paid is non-refundable as per school policy.",
        "3. Keep this slip safe — it is your proof of application & payment.",
      ];
      doc.font(FONT.regular).fontSize(8.5).fillColor(C.onSurface);
      notes.forEach((n) => { doc.text(n, cardX + 24, y, { width: cardW - 48, lineGap: 3 }); y += 16; });
      y += 8;

      // ── QR + note ──
      const qrBox = 86;
      doc.save();
      doc.roundedRect(cardX + 24, y, qrBox + 10, qrBox + 10, 10).fillColor(C.surfaceLow).fill();
      doc.roundedRect(cardX + 24, y, qrBox + 10, qrBox + 10, 10).lineWidth(1).strokeColor(C.outlineVariant).stroke();
      doc.roundedRect(cardX + 27, y + 3, qrBox, qrBox, 6).fillColor(C.white).fill();
      if (qr) doc.image(qr, cardX + 30, y + 6, { fit: [qrBox - 6, qrBox - 6] });
      doc.restore();
      doc.font(FONT.mono).fontSize(8).fillColor(C.onSurfaceVariant)
         .text(`REF  ${refNo || "—"}`, cardX + 24, y + qrBox + 14, { width: qrBox + 10, align: "center", characterSpacing: 0.4 });
      doc.font(FONT.regular).fontSize(8.5).fillColor(C.onSurfaceVariant)
         .text("Scan the QR code to verify this admission slip at the time of payment.",
           cardX + 24 + qrBox + 22, y + 12, { width: cardW - 48 - qrBox - 22, lineGap: 3 });

      // ── Footer ──
      const fy = cardTop + cardH - 28;
      doc.moveTo(cardX + 30, fy - 12).lineTo(cardX + cardW - 30, fy - 12)
         .lineWidth(0.5).strokeColor(C.outlineVariant).stroke();
      doc.font(FONT.italic).fontSize(8).fillColor(C.onSurfaceVariant)
         .text("This is an official admission slip generated by the School Management System. Thank you.",
           cardX + 40, fy, { width: cardW - 80, align: "center" });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENT ID CARD (520 × 330 pt — landscape, Pakistani school card format)
  // Two-sided: PAGE 1 = front (photo, student info, barcode),
  //            PAGE 2 = back  (QR code, school address/phone).
  // ═══════════════════════════════════════════════════════════════════════════
  async studentIdSlip({ schoolName, studentName, fatherName, className, sectionName, rollNumber,
    identifierCode, refNo, photoUrl, themeColor, logoUrl, validUntil, campusName, gender,
    schoolAddress, schoolPhone }) {
    const [photo, logo, qr, barcode] = await Promise.all([
      imageToBuffer(photoUrl),
      imageToBuffer(logoUrl),
      qrBuffer(identifierCode || refNo),
      barcodeBuffer(identifierCode || refNo),
    ]);
    return this._buildDoc([520, 330], (doc) => {
      // Page 1 — Front
      this._drawIdCardFront(doc, {
        schoolName, studentName, fatherName, className, sectionName, rollNumber,
        identifierCode, refNo, validUntil, campusName, themeColor,
        gender, photo, logo, barcode,
      });
      // Page 2 — Back
      doc.addPage();
      this._drawIdCardBack(doc, {
        schoolName, campusName, themeColor, logo, qr,
        identifierCode, refNo, validUntil, schoolAddress, schoolPhone,
      });
    });
  }

  _drawIdCardFront(doc, { schoolName, campusName, studentName, fatherName, className, sectionName,
    rollNumber, identifierCode, refNo, validUntil, themeColor, gender, logo, photo, contactPhone, emergencyPhone }) {
    const theme = themeColor || C.primary;
    const W = 520, H = 330;

    doc.save();
    doc.roundedRect(0, 0, W, H, 12).clip();
    doc.rect(0, 0, W, H).fillColor(C.white).fill();
    doc.rect(0, 0, 7, H).fillColor(theme).fillOpacity(0.92).fill();
    doc.restore();

    // ── Top band (theme + gold wave) ──
    doc.save();
    doc.moveTo(0, 0).lineTo(W, 0).lineTo(W, 64)
       .bezierCurveTo(W * 0.62, 64, W * 0.4, 92, 0, 92).fillColor(C.gold).fill();
    doc.moveTo(0, 0).lineTo(W, 0).lineTo(W, 58)
       .bezierCurveTo(W * 0.62, 58, W * 0.4, 86, 0, 86).fillColor(theme).fill();
    doc.restore();

    // ── Header content ──
    const logoX = 22, logoY = 14, logoD = 52;
    if (logo) {
      doc.save();
      doc.circle(logoX + logoD / 2, logoY + logoD / 2, logoD / 2 + 2).fillColor(C.white).fill();
      doc.circle(logoX + logoD / 2, logoY + logoD / 2, logoD / 2).clip();
      doc.image(logo, logoX, logoY, { fit: [logoD, logoD] });
      doc.restore();
    }
    const titleX = logo ? logoX + logoD + 16 : 28;
    const titleW = W - titleX - 22;
    doc.font(FONT.bold).fontSize(17).fillColor(C.white);
    let schoolStr = String(schoolName || "School Name").toUpperCase();
    if (doc.heightOfString(schoolStr, { width: titleW }) > 24) doc.fontSize(13);
    doc.text(schoolStr, titleX, 16, { width: titleW, lineGap: -2 });
    doc.font(FONT.regular).fontSize(8).fillColor(C.surfaceHighest)
       .text(String(campusName || "STUDENT IDENTITY CARD").toUpperCase(),
         titleX, 40, { width: titleW, characterSpacing: 1.5 });

    // ── Photo (left) ──
    const pw = 104, ph = 128, px = 26, py = 104;
    doc.save();
    doc.roundedRect(px, py, pw, ph, 10).fillColor(C.white).fillOpacity(1).fill();
    doc.roundedRect(px, py, pw, ph, 10).lineWidth(2).strokeColor(theme).stroke();
    doc.roundedRect(px + 3, py + 3, pw - 6, ph - 6, 8).clip();
    if (photo) {
      doc.image(photo, px + 3, py + 3, { fit: [pw - 6, ph - 6], align: "center", valign: "center" });
    } else {
      drawAvatarPlaceholder(doc, px + 3, py + 3, pw - 6, ph - 6, gender, theme);
    }
    doc.restore();

    // ── Details (right) ──
    const dx = 150, dw = W - dx - 26;
    let ry = 108;
    doc.font(FONT.bold).fontSize(19).fillColor(theme);
    const dispName = String(studentName || "STUDENT").toUpperCase();
    doc.text(dispName, dx, ry, { width: dw });
    const nameH = doc.heightOfString(dispName, { width: dw });
    doc.save();
    doc.rect(dx, ry + nameH + 3, 46, 3).fillColor(C.gold).fill();
    doc.restore();
    ry += nameH + 14;

    const rows = [
      { label: "CLASS",   value: [className, sectionName].filter(Boolean).join(" — ") || "—" },
      { label: "ROLL NO", value: String(rollNumber || "—") },
      { label: "FATHER",  value: fatherName || "—" },
      { label: "CONTACT", value: contactPhone || emergencyPhone || "—" },
    ];
    const rowH = 22;
    rows.forEach((row) => {
      doc.save();
      doc.roundedRect(dx, ry, 70, 16, 4).fillColor(theme).fillOpacity(0.08).fill();
      doc.restore();
      doc.font(FONT.bold).fontSize(6).fillColor(theme)
         .text(row.label, dx + 4, ry + 4.5, { width: 62, characterSpacing: 0.4 });
      doc.font(FONT.bold).fontSize(10).fillColor(C.onSurface)
         .text(String(row.value), dx + 78, ry + 2, { width: dw - 78 });
      ry += rowH;
    });

    // ── Bottom accent band ──
    doc.save();
    doc.moveTo(0, H).lineTo(W, H).lineTo(W, H - 40)
       .bezierCurveTo(W * 0.6, H - 40, W * 0.4, H - 22, 0, H - 22).fillColor(theme).fill();
    doc.restore();

    doc.save();
    doc.roundedRect(0, 0, W, H, 12).lineWidth(2).strokeColor(theme).strokeOpacity(0.5).stroke();
    doc.restore();
  }

  _drawIdCardBack(doc, { schoolName, campusName, themeColor, logo, qr,
    identifierCode, refNo, validUntil, schoolAddress, schoolPhone }) {
    const theme = themeColor || C.primary;
    const W = 520, H = 330;

    doc.save();
    doc.roundedRect(0, 0, W, H, 12).clip();
    doc.rect(0, 0, W, H).fillColor("#ffffff").fill();

    // Watermark
    doc.save();
    doc.circle(W * 0.78, H * 0.35, 150).fillColor(theme).fillOpacity(0.02).fill();
    doc.circle(W * 0.78, H * 0.35, 170).lineWidth(3).strokeColor(theme).strokeOpacity(0.02).stroke();
    doc.restore();

    // ── Top band ──
    doc.save();
    doc.moveTo(0, 0).lineTo(W, 0).lineTo(W, 70)
       .bezierCurveTo(W * 0.6, 70, W * 0.4, 100, 0, 100).fillColor(C.gold).fill();
    doc.moveTo(0, 0).lineTo(W, 0).lineTo(W, 64)
       .bezierCurveTo(W * 0.6, 64, W * 0.4, 94, 0, 94).fillColor(theme).fill();
    doc.restore();

    // ── Header — logo + school name ──
    const logoX = 24, logoD = 52;
    if (logo) {
      doc.save();
      doc.circle(logoX + logoD/2, 16 + logoD/2, logoD/2 + 2).fillColor(C.white).fill();
      doc.circle(logoX + logoD/2, 16 + logoD/2, logoD/2).clip();
      doc.image(logo, logoX, 16, { fit: [logoD, logoD] });
      doc.restore();
    }
    const titleX = logo ? logoX + logoD + 18 : 30;
    const titleW = W - titleX - 24;
    doc.font(FONT.bold).fontSize(18).fillColor(C.white);
    const sName = String(schoolName || "School Name").toUpperCase();
    let sH = doc.heightOfString(sName, { width: titleW });
    if (sH > 26) { doc.fontSize(14); sH = doc.heightOfString(sName, { width: titleW }); }
    doc.text(sName, titleX, 18, { width: titleW, lineGap: -2 });
    doc.font(FONT.regular).fontSize(9).fillColor(C.surfaceHighest)
       .text("OFFICIAL STUDENT IDENTITY CARD", titleX, 18 + sH + 2, { width: titleW, characterSpacing: 1.5 });

    // ── School contact panel (left) ──
    const px = 30, pw = W - 60 - 150 - 30;
    let py = 118;
    const panelH = 120;
    doc.save();
    doc.roundedRect(px, py - 10, pw, panelH, 10).fillColor(C.surfaceLow).fill();
    doc.roundedRect(px, py - 10, pw, panelH, 10).lineWidth(1).strokeColor(C.outlineVariant).stroke();
    doc.roundedRect(px, py - 10, pw, panelH, 10).clip();
    doc.rect(px, py - 10, 4, panelH).fillColor(theme).fill();
    doc.restore();
    doc.font(FONT.bold).fontSize(7).fillColor(theme)
       .text("CAMPUS / CONTACT", px + 14, py, { characterSpacing: 1 });
    py += 16;
    const contactRows = [
      ["ADDRESS", schoolAddress || "School address"],
      ["CAMPUS", campusName || "Main Campus"],
      ["ID NO", String(identifierCode || refNo || "—")],
    ];
    contactRows.forEach(([label, value], idx) => {
      doc.font(FONT.bold).fontSize(6).fillColor(theme)
         .text(label, px + 14, py, { width: 54, characterSpacing: 0.5 });
      doc.font(FONT.regular).fontSize(9).fillColor(C.onSurface)
         .text(String(value), px + 76, py - 1, { width: pw - 88 });
      if (idx < contactRows.length - 1)
        doc.moveTo(px + 14, py + 18).lineTo(px + pw - 12, py + 18)
           .lineWidth(0.4).strokeColor(C.outlineVariant).stroke();
      py += 26;
    });

    // ── QR code (right side) ──
    const qs = 96;
    const qx = W - 30 - qs;
    const qy = 118;
    doc.save();
    doc.roundedRect(qx + 3, qy + 3, qs, qs, 8).fillColor(C.onSurface).fillOpacity(0.15).fill();
    doc.roundedRect(qx, qy, qs, qs, 8).fillColor(C.white).fillOpacity(1).fill();
    doc.roundedRect(qx, qy, qs, qs, 8).lineWidth(2).strokeColor(theme).strokeOpacity(1).stroke();
    if (qr) doc.image(qr, qx + 6, qy + 6, { fit: [qs - 12, qs - 12] });
    doc.restore();
    // Keep the verification label close to the QR; the identifier is shown in
    // the campus/contact information instead of underneath the QR.
    doc.font(FONT.bold).fontSize(6.5).fillColor(theme)
       .text("SCAN TO VERIFY", qx, qy + qs + 6, { width: qs, align: "center", characterSpacing: 1 });

    // ── Footer band ──
    doc.save();
    doc.moveTo(0, H).lineTo(W, H).lineTo(W, H - 96)
       .bezierCurveTo(W * 0.6, H - 96, W * 0.4, H - 50, 0, H - 50).fillColor(C.gold).fill();
    doc.moveTo(0, H).lineTo(W, H).lineTo(W, H - 90)
       .bezierCurveTo(W * 0.6, H - 90, W * 0.4, H - 44, 0, H - 44).fillColor(theme).fill();
    doc.restore();

    const until = validUntil ? monthYear(validUntil) : monthYear(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    doc.font(FONT.bold).fontSize(7).fillColor(C.white)
       .text("VALID UNTIL:  " + until.toUpperCase(), 30, H - 24, { characterSpacing: 0.5 });
    doc.font(FONT.regular).fontSize(7).fillColor(C.surfaceHighest)
       .text("If found, please return to the nearest campus of " + String(schoolName || "the school"),
         W / 2 - 150, H - 24, { width: 300, align: "center", characterSpacing: 0.3 });

    doc.save();
    doc.roundedRect(0, 0, W, H, 12).lineWidth(2).strokeColor(theme).strokeOpacity(0.5).stroke();
    doc.restore();
    doc.restore(); // end clip
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK ID CARD SHEET (A4, landscape cards — 2×3 grid, 6 per page)
  // ═══════════════════════════════════════════════════════════════════════════
  async idCardSheet({ cards = [], schoolName, campusName, themeColor, logoUrl }) {
    if (!cards.length) return null;
    const [logo, ...photos] = await Promise.all([
      imageToBuffer(logoUrl),
      ...cards.map((c) => imageToBuffer(c.photoUrl)),
    ]);
    const SCALE = 0.557, GAP = 16;
    const cW = 520 * SCALE, cH = 330 * SCALE;
    const sx = (A4.width  - (2 * cW + GAP)) / 2;
    const sy = (A4.height - (3 * cH + 2 * GAP)) / 2;

    return this._buildDoc("A4", (doc) => {
      doc.rect(0, 0, A4.width, A4.height).fillColor(C.surfaceLow).fill();
      cards.forEach((card, i) => {
        if (i > 0 && i % 6 === 0) doc.addPage();
        const slot = i % 6, col = slot % 2, row = Math.floor(slot / 2);
        doc.save();
        doc.translate(sx + col * (cW + GAP), sy + row * (cH + GAP));
        doc.scale(SCALE);
        this._drawIdCardFront(doc, { schoolName, campusName, themeColor, logo, photo: photos[i], ...card });
        doc.restore();
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF ID CARD SHEET (A4, no barcode — 2×3 grid, 6 per page)
  // ═══════════════════════════════════════════════════════════════════════════
  async staffIdCard({ cards = [], schoolName, campusName, themeColor, logoUrl }) {
    if (!cards.length) return null;
    const [logo, ...photos] = await Promise.all([
      imageToBuffer(logoUrl),
      ...cards.map((c) => imageToBuffer(c.photoUrl)),
    ]);
    const SCALE = 0.557, GAP = 16;
    const cW = 520 * SCALE, cH = 330 * SCALE;
    const sx = (A4.width  - (2 * cW + GAP)) / 2;
    const sy = (A4.height - (3 * cH + 2 * GAP)) / 2;

    return this._buildDoc("A4", (doc) => {
      doc.rect(0, 0, A4.width, A4.height).fillColor(C.surfaceLow).fill();
      cards.forEach((card, i) => {
        if (i > 0 && i % 6 === 0) doc.addPage();
        const slot = i % 6, col = slot % 2, row = Math.floor(slot / 2);
        doc.save();
        doc.translate(sx + col * (cW + GAP), sy + row * (cH + GAP));
        doc.scale(SCALE);
        this._drawStaffIdCardFront(doc, { schoolName, campusName, themeColor, logo, photo: photos[i], ...card });
        doc.restore();
      });
    });
  }

  _drawStaffIdCardFront(doc, { schoolName, campusName, themeColor, logo, photo, name, designation, employeeId, department, phone, validTill, refNo, qr }) {
    const theme = themeColor || C.primary;
    const W = 520, H = 330;

    doc.save();
    doc.roundedRect(0, 0, W, H, 12).clip();
    doc.rect(0, 0, W, H).fillColor(C.white).fill();
    doc.rect(0, 0, 7, H).fillColor(theme).fillOpacity(0.92).fill();
    doc.restore();

    // ── Top band ──
    doc.save();
    doc.moveTo(0, 0).lineTo(W, 0).lineTo(W, 64)
       .bezierCurveTo(W * 0.62, 64, W * 0.4, 92, 0, 92).fillColor(C.gold).fill();
    doc.moveTo(0, 0).lineTo(W, 0).lineTo(W, 58)
       .bezierCurveTo(W * 0.62, 58, W * 0.4, 86, 0, 86).fillColor(theme).fill();
    doc.restore();

    const logoX = 22, logoY = 14, logoD = 52;
    if (logo) {
      doc.save();
      doc.circle(logoX + logoD / 2, logoY + logoD / 2, logoD / 2 + 2).fillColor(C.white).fill();
      doc.circle(logoX + logoD / 2, logoY + logoD / 2, logoD / 2).clip();
      doc.image(logo, logoX, logoY, { fit: [logoD, logoD] });
      doc.restore();
    }
    const titleX = logo ? logoX + logoD + 16 : 28;
    const titleW = W - titleX - 22;
    doc.font(FONT.bold).fontSize(17).fillColor(C.white);
    let sName = String(schoolName || "School Name").toUpperCase();
    if (doc.heightOfString(sName, { width: titleW }) > 24) doc.fontSize(13);
    doc.text(sName, titleX, 16, { width: titleW, lineGap: -2 });
    doc.font(FONT.regular).fontSize(8).fillColor(C.surfaceHighest)
       .text(String(campusName || "STAFF IDENTITY CARD").toUpperCase(), titleX, 40, { width: titleW, characterSpacing: 1.5 });

    // ── Photo (left) ──
    const pw = 104, ph = 128, px = 26, py = 104;
    doc.save();
    doc.roundedRect(px, py, pw, ph, 10).fillColor(C.white).fillOpacity(1).fill();
    doc.roundedRect(px, py, pw, ph, 10).lineWidth(2).strokeColor(theme).stroke();
    doc.roundedRect(px + 3, py + 3, pw - 6, ph - 6, 8).clip();
    if (photo) {
      doc.image(photo, px + 3, py + 3, { fit: [pw - 6, ph - 6], align: "center", valign: "center" });
    } else {
      drawAvatarPlaceholder(doc, px + 3, py + 3, pw - 6, ph - 6, undefined, theme);
    }
    doc.restore();

    // ── Details (right) — QR hone par width thori kam (right edge QR column) ──
    const dx = 150, dw = qr ? W - dx - 118 : W - dx - 26;
    let ry = 108;
    doc.font(FONT.bold).fontSize(19).fillColor(theme);
    const dispName = String(name || "STAFF").toUpperCase();
    doc.text(dispName, dx, ry, { width: dw });
    const nameH = doc.heightOfString(dispName, { width: dw });
    doc.save();
    doc.rect(dx, ry + nameH + 3, 46, 3).fillColor(C.gold).fill();
    doc.restore();
    ry += nameH + 14;

    const rows = [
      { label: "DESIGNATION", value: designation || "—" },
      { label: "EMP ID",      value: String(employeeId || refNo || "—") },
      { label: "DEPARTMENT",  value: department || "—" },
      { label: "PHONE",       value: phone || "—" },
    ];
    const rowH = 22;
    rows.forEach((row) => {
      doc.save();
      doc.roundedRect(dx, ry, 84, 16, 4).fillColor(theme).fillOpacity(0.08).fill();
      doc.restore();
      doc.font(FONT.bold).fontSize(6).fillColor(theme)
         .text(row.label, dx + 4, ry + 4.5, { width: 76, characterSpacing: 0.3 });
      doc.font(FONT.bold).fontSize(10).fillColor(C.onSurface)
         .text(String(row.value), dx + 92, ry + 2, { width: dw - 92 });
      ry += rowH;
    });

    // ── Attendance QR (right edge) — gate scanner se check-in ──
    if (qr) {
      const qs = 74, qx = W - qs - 24, qy = 108;
      doc.save();
      doc.roundedRect(qx - 4, qy - 4, qs + 8, qs + 8, 6)
         .lineWidth(1).strokeColor(C.outlineVariant).stroke();
      doc.image(qr, qx, qy, { fit: [qs, qs] });
      doc.font(FONT.bold).fontSize(6).fillColor(theme)
         .text("SCAN TO CHECK-IN", qx, qy + qs + 7, { width: qs + 8, align: "center", characterSpacing: 0.5 });
      doc.restore();
    }

    // ── Bottom accent band + valid till ──
    doc.save();
    doc.moveTo(0, H).lineTo(W, H).lineTo(W, H - 40)
       .bezierCurveTo(W * 0.6, H - 40, W * 0.4, H - 22, 0, H - 22).fillColor(theme).fill();
    doc.restore();
    const vt = validTill ? monthYear(validTill) : monthYear(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    doc.font(FONT.bold).fontSize(7).fillColor(C.white)
       .text("VALID TILL", 26, H - 20, { width: 60, characterSpacing: 0.5 });
    doc.font(FONT.bold).fontSize(9).fillColor(C.white)
       .text(vt.toUpperCase(), 26, H - 30, { width: 150 });
    doc.font(FONT.mono).fontSize(8).fillColor(C.surfaceHighest)
       .text("EMP STAFF CARD", W - 176, H - 26, { width: 150, align: "right" });

    doc.save();
    doc.roundedRect(0, 0, W, H, 12).lineWidth(2).strokeColor(theme).strokeOpacity(0.5).stroke();
    doc.restore();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEE PAYMENT RECEIPT (A4)
  // ═══════════════════════════════════════════════════════════════════════════
  async feeReceipt({ schoolName, studentName, className, rows, lineItems, totalPaid, paidAt, refNo, themeColor, logoUrl, qrData, title = "Fee Payment Receipt", footer = "This is a computer-generated receipt. Thank you for your payment.", showPaidMeta = true, totalLabel = "TOTAL PAID" }) {
    const logo    = await imageToBuffer(logoUrl);
    // QR content — fee record ka scannable code (FEE:<id>), fallback refNo
    const qr      = await qrBuffer(qrData || refNo);
    const theme   = themeColor || C.primary;
    const cardW   = 440;
    const cardX   = (A4.width - cardW) / 2;
    const cardTop = 40, cardH = 760;

    return this._buildDoc("A4", (doc) => {
      doc.rect(0, 0, A4.width, A4.height).fillColor(C.surfaceLow).fill();
      doc.save();
      doc.roundedRect(cardX + 3, cardTop + 3, cardW, cardH, 14).fillColor("#cdd5ee").fill();
      doc.restore();
      doc.save();
      doc.roundedRect(cardX, cardTop, cardW, cardH, 14).fillColor(C.white).fill();
      doc.roundedRect(cardX, cardTop, cardW, cardH, 14).lineWidth(1).strokeColor(C.outlineVariant).stroke();
      doc.restore();
      doc.save();
      doc.roundedRect(cardX, cardTop, cardW, 7, 14).fillColor(theme).fill();
      doc.rect(cardX, cardTop + 4, cardW, 3).fillColor(theme).fill();
      doc.restore();

      let y = cardTop + 26;
      y = this._drawSlipHeader(doc, { logo, schoolName, title, themeColor: theme, cardX, cardW });
      y = this._drawQrBlock(doc, { qr, refNo, cardX, cardW, y });

      const metaRows = showPaidMeta
        ? [
            { label: "Student",     value: studentName },
            { label: "Class",       value: className || "N/A" },
            { label: "Paid Amount", value: rs(totalPaid), emphasis: true },
            { label: "Paid On",     value: paidAt ? dateStr(paidAt) : dateStr(new Date()) },
            ...(rows || []),
          ]
        : [
            { label: "Student", value: studentName },
            { label: "Class",   value: className || "N/A" },
            ...(rows || []),
          ];
      y = this._drawRowsPanel(doc, { rows: metaRows, cardX, cardW, y, themeColor: theme });
      y = this._drawFeeTable(doc, { lineItems, totalPaid, cardX, cardW, y, themeColor: theme, totalLabel });
      doc.moveTo(cardX + 30, y + 4).lineTo(cardX + cardW - 30, y + 4)
         .lineWidth(0.5).strokeColor(C.outlineVariant).stroke();
      doc.font(FONT.italic).fontSize(9).fillColor(C.onSurfaceVariant)
         .text(footer,
           cardX + 40, y + 14, { width: cardW - 80, align: "center", lineGap: 2 });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEE VOUCHER (A4) — structured layout: brand header, student info grid,
  // fee breakdown table, payment summary strip (Total/Paid/Balance),
  // status-aware watermark, QR + payment instructions side-by-side.
  // ═══════════════════════════════════════════════════════════════════════════
  async feeVoucher({ schoolName, studentName, className, rollNumber, monthLabel, rows, lineItems, totalAmount, paidAmount, totalDue, dueDate, issuedDate, refNo, themeColor, logoUrl, qrData, status, bank }) {
    const logo  = await imageToBuffer(logoUrl);
    const qr    = await qrBuffer(qrData || refNo);
    const theme = themeColor || C.primary;
    const cardW = 480, cardX = (A4.width - cardW) / 2;
    const cardTop = 30;

    // Status derive — purane callers sirf totalDue bhejte hain, wo bhi chalega.
    const total = Number(totalAmount ?? ((Number(paidAmount || 0)) + Number(totalDue || 0)));
    const paid  = Number(paidAmount || 0);
    const bal   = Math.max(0, Number(totalDue ?? (total - paid)));
    let st      = String(status || "").toUpperCase();
    if (!st) st = paid <= 0 ? "UNPAID" : bal > 0 ? "PARTIAL" : "PAID";

    // Dynamic card height — line items + bank box ke hisaab se, no dead space.
    const itemCount = Math.max(1, (lineItems && lineItems.length) ? lineItems.length : 1);
    const bankH = bank?.accountNumber ? 52 : 0;
    const cardH = Math.min(A4.height - cardTop - 8, Math.max(620, 600 + 28 * itemCount + bankH));

    return this._buildDoc("A4", (doc) => {
      // Background + card
      doc.rect(0, 0, A4.width, A4.height).fillColor(C.surfaceLow).fill();
      doc.save();
      doc.roundedRect(cardX + 3, cardTop + 3, cardW, cardH, 14).fillColor("#cdd5ee").fill();
      doc.roundedRect(cardX, cardTop, cardW, cardH, 14).fillColor(C.white).fill();
      doc.roundedRect(cardX, cardTop, cardW, cardH, 14).lineWidth(1).strokeColor(C.outlineVariant).stroke();
      doc.restore();

      // Soft status watermark (PAID par nahi) — subtle, behind content
      if (st !== "PAID" && bal > 0) {
        doc.save();
        doc.translate(A4.width / 2, A4.height / 2);
        doc.rotate(-32);
        doc.font(FONT.bold).fontSize(52).fillColor(C.surfaceHighest)
           .text(st, -170, -30, { width: 340, align: "center", characterSpacing: 2 });
        doc.restore();
      }

      // Header band — theme gradient sheen with white school name (premium look)
      const headH = 62;
      const bandGrad = doc.linearGradient(cardX, cardTop, cardX + cardW, cardTop);
      bandGrad.stop(0, theme, 1).stop(1, C.primaryContainer, 1);
      doc.save();
      doc.roundedRect(cardX, cardTop, cardW, headH, [14, 14, 0, 0]).fill(bandGrad);
      doc.restore();
      doc.rect(cardX, cardTop + headH - 3, cardW, 3).fillColor(C.gold).fill();

      const logoD = 46;
      doc.save();
      doc.circle(cardX + 22 + logoD / 2, cardTop + headH / 2, logoD / 2 + 2).fillColor(C.white).fill();
      if (logo) {
        doc.circle(cardX + 22 + logoD / 2, cardTop + headH / 2, logoD / 2 - 1).clip();
        doc.image(logo, cardX + 23, cardTop + headH / 2 - logoD / 2 + 1, { fit: [logoD - 2, logoD - 2] });
      } else {
        doc.font(FONT.bold).fontSize(17).fillColor(theme)
           .text((schoolName || "S").charAt(0), cardX + 23, cardTop + headH / 2 - 12, { width: logoD, align: "center" });
      }
      doc.restore();
      doc.font(FONT.bold).fontSize(14).fillColor(C.white)
         .text(schoolName || "School", cardX + 82, cardTop + 13, { width: cardW - 260 });
      doc.font(FONT.regular).fontSize(8).fillColor(C.surfaceHighest)
         .text("FEE PAYMENT VOUCHER", cardX + 82, cardTop + 33, { width: 180, characterSpacing: 1.5 });
      doc.font(FONT.mono).fontSize(8).fillColor(C.white)
         .text(`REF ${refNo || "—"}`, cardX + cardW - 150, cardTop + 13, { width: 126, align: "right" });
      doc.font(FONT.mono).fontSize(8).fillColor(C.surfaceHighest)
         .text(dateStr(issuedDate || new Date()), cardX + cardW - 150, cardTop + 30, { width: 126, align: "right" });

      let y = cardTop + headH + 22;

      // ── Section: Student details ──
      doc.font(FONT.bold).fontSize(8).fillColor(theme)
         .text("STUDENT DETAILS", cardX + 16, y, { width: cardW - 32, characterSpacing: 1.5 });
      y += 16;

      // ── Student info strip (4 tidy cells) ──
      const cellW = (cardW - 32 - 3 * 10) / 4, cellH = 40;
      const cells = [
        ["STUDENT", studentName || "—"],
        ["CLASS", className || "N/A"],
        ["ROLL NO", rollNumber || "—"],
        ["FEE PERIOD", monthLabel || monthYear(dueDate)],
      ];
      cells.forEach(([label, value], i) => {
        const cx = cardX + 16 + i * (cellW + 10);
        doc.save();
        doc.roundedRect(cx, y, cellW, cellH, 8).fillColor(C.surfaceLow).fill();
        doc.roundedRect(cx, y, cellW, cellH, 8).lineWidth(0.75).strokeColor(C.outlineVariant).stroke();
        doc.roundedRect(cx, y, 4, cellH, [8, 0, 0, 8]).fillColor(theme).fillOpacity(0.85).fill();
        doc.restore();
        doc.font(FONT.bold).fontSize(6.5).fillColor(theme)
           .text(label, cx + 12, y + 7, { width: cellW - 18, characterSpacing: 0.8 });
        doc.font(FONT.bold).fontSize(10).fillColor(C.onSurface)
           .text(String(value), cx + 12, y + 19, { width: cellW - 18, ellipsis: true });
      });
      y += cellH + 18;

      // ── Section: Fee breakdown ──
      doc.font(FONT.bold).fontSize(8).fillColor(theme)
         .text("FEE BREAKDOWN", cardX + 16, y, { width: cardW - 32, characterSpacing: 1.5 });
      y += 16;

      // ── Fee breakdown table ──
      y = this._drawFeeTable(doc, {
        lineItems: (lineItems && lineItems.length ? lineItems : [{ title: "Monthly Fee", amount: total }]),
        totalPaid: total, cardX, cardW, y, themeColor: theme, totalLabel: "TOTAL FEE",
      });
      y += 16;

      // ── Hero: BALANCE DUE (clear focal point) ──
      const heroH = 80;
      const heroX = cardX + 16, heroW = cardW - 32;
      doc.save();
      doc.roundedRect(heroX, y, heroW, heroH, 10).fillColor(theme).fill();
      doc.restore();
      const heroMid = heroX + heroW * 0.52;
      // left: balance
      doc.font(FONT.regular).fontSize(7.5).fillColor(C.surfaceHighest)
         .text("BALANCE DUE", heroX + 16, y + 14, { width: heroMid - heroX - 20, characterSpacing: 1.5 });
      doc.font(FONT.monoBold).fontSize(22).fillColor(C.white)
         .text(rs(bal), heroX + 16, y + 26, { width: heroMid - heroX - 24 });
      doc.font(FONT.regular).fontSize(7).fillColor(C.surfaceHighest)
         .text("PAY BEFORE  " + (dueDate ? dateStr(dueDate) : "—"), heroX + 16, y + 60, { width: heroMid - heroX - 20, characterSpacing: 0.4 });
      // right: stats + status chip
      const rzX = heroMid + 6;
      const rzW = heroW - (rzX - heroX) - 16;
      const bc = badgeColors(st);
      const stTxt = st === "PARTIAL" ? "PARTIALLY PAID" : st;
      doc.font(FONT.bold).fontSize(8).fillColor(bc.fg);
      const chipW = doc.widthOfString(stTxt) + 20;
      doc.save();
      doc.roundedRect(rzX, y + 12, chipW, 16, 8).fillColor(C.white).fill();
      doc.restore();
      doc.text(stTxt, rzX, y + 15, { width: chipW, align: "center" });
      doc.font(FONT.bold).fontSize(6.5).fillColor(C.surfaceHighest)
         .text("TOTAL FEE", rzX, y + 34, { width: rzW, characterSpacing: 0.6 });
      doc.font(FONT.monoBold).fontSize(11).fillColor(C.white)
         .text(rs(total), rzX, y + 42, { width: rzW });
      doc.font(FONT.bold).fontSize(6.5).fillColor(C.surfaceHighest)
         .text("PAID SO FAR", rzX, y + 58, { width: rzW, characterSpacing: 0.6 });
      doc.font(FONT.monoBold).fontSize(11).fillColor(C.white)
         .text(rs(paid), rzX, y + 66, { width: rzW });
      y += heroH + 16;

      // ── QR (left) + HOW TO PAY (right) ──
      doc.font(FONT.bold).fontSize(8).fillColor(theme)
         .text("HOW TO PAY", cardX + 16, y - 2, { width: 100, characterSpacing: 1.2 });
      const qrBox = 92;
      doc.save();
      doc.roundedRect(cardX + 16, y + 8, qrBox + 12, qrBox + 12, 10).fillColor(C.white).fill();
      doc.roundedRect(cardX + 16, y + 8, qrBox + 12, qrBox + 12, 10).lineWidth(1).strokeColor(C.outlineVariant).stroke();
      if (qr) doc.image(qr, cardX + 22, y + 14, { fit: [qrBox, qrBox] });
      doc.restore();
      const insX = cardX + 16 + qrBox + 24;
      const insW = cardX + cardW - 16 - insX;
      doc.moveTo(insX, y + 18).lineTo(insX + insW, y + 18)
         .lineWidth(0.5).strokeColor(C.outlineVariant).stroke();
      doc.font(FONT.regular).fontSize(8.5).fillColor(C.onSurface);
      doc.text("1. Pay at the school office counter and get this voucher stamped.", insX, y + 24, { width: insW, lineGap: 2 });
      doc.text("2. Or scan the QR code — staff will collect and confirm instantly.", insX, y + 46, { width: insW, lineGap: 2 });
      doc.text("3. Keep the receipt safe — it is your proof of payment.", insX, y + 68, { width: insW, lineGap: 2 });
      y += qrBox + 24;

      // ── Bank transfer box (sirf jab bank account configured ho) ──
      if (bank?.accountNumber) {
        const bH = 40;
        doc.save();
        doc.roundedRect(cardX + 16, y, cardW - 32, bH, 8).fillColor(C.surfaceContainer).fill();
        doc.roundedRect(cardX + 16, y, cardW - 32, bH, 8).lineWidth(0.75).strokeColor(C.outlineVariant).stroke();
        doc.restore();
        doc.font(FONT.bold).fontSize(7.5).fillColor(theme)
           .text("BANK TRANSFER", cardX + 28, y + 7, { width: 110, characterSpacing: 1 });
        const acctLine = [bank.bankName, bank.accountNumber].filter(Boolean).join("  ·  ");
        doc.font(FONT.regular).fontSize(8.5).fillColor(C.onSurface)
           .text(acctLine, cardX + 150, y + 6, { width: cardW - 180, align: "right" });
        doc.font(FONT.monoBold).fontSize(9).fillColor(C.onSurface)
           .text(bank.accountTitle || "", cardX + 150, y + 21, { width: cardW - 180, align: "right" });
        y += bH + 14;
      }

      // ── Footer ──
      doc.moveTo(cardX + 30, y).lineTo(cardX + cardW - 30, y)
         .lineWidth(0.5).strokeColor(C.outlineVariant).stroke();
      doc.font(FONT.italic).fontSize(8).fillColor(C.onSurfaceVariant)
         .text("This is an official fee voucher. Please pay before the due date to avoid late charges. Thank you.",
           cardX + 40, y + 8, { width: cardW - 80, align: "center", lineGap: 2 });
      doc.font(FONT.regular).fontSize(6.5).fillColor(C.onSurfaceVariant)
         .text(`Generated ${new Date().toLocaleString("en-PK")} — School Management System`,
           cardX + 40, y + 30, { width: cardW - 80, align: "center" });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEE VOUCHER A5 — print-optimized compact layout for A5 paper
  // (148 × 210 mm = 419.53 × 595.28 pt). Smaller margins, tighter spacing,
  // same visual hierarchy scaled down for half-sheet printing.
  // ═══════════════════════════════════════════════════════════════════════════
  async feeVoucherA5({ schoolName, studentName, className, rows, lineItems, totalDue, totalAmount, paidAmount, dueDate, refNo, themeColor, logoUrl, qrData, status, bank }) {
    const logo  = await imageToBuffer(logoUrl);
    const qr    = await qrBuffer(qrData || refNo);
    const theme = themeColor || C.primary;
    // A5 dimensions
    const PW = 419.53, PH = 595.28;
    const cardW = 380, cardX = (PW - cardW) / 2;
    const cardTop = 18, cardH = PH - 36;

    // Status derive — partial payments par PARTIAL chip dikhta hai.
    const total = Number(totalAmount ?? ((Number(paidAmount || 0)) + Number(totalDue || 0)));
    const paid  = Number(paidAmount || 0);
    const bal   = Math.max(0, Number(totalDue ?? (total - paid)));
    let st      = String(status || "").toUpperCase();
    if (!st) st = paid <= 0 ? "UNPAID" : bal > 0 ? "PARTIAL" : "PAID";

    return this._buildDoc([PW, PH], (doc) => {
      // Background
      doc.rect(0, 0, PW, PH).fillColor(C.surfaceLow).fill();
      // Card shadow
      doc.save();
      doc.roundedRect(cardX + 2, cardTop + 2, cardW, cardH, 10).fillColor("#cdd5ee").fill();
      doc.restore();
      // Card body
      doc.save();
      doc.roundedRect(cardX, cardTop, cardW, cardH, 10).fillColor(C.white).fill();
      doc.roundedRect(cardX, cardTop, cardW, cardH, 10).lineWidth(0.75).strokeColor(C.outlineVariant).stroke();
      doc.restore();

      // ── Branded header band ──
      const headH = 52;
      const bandGrad = doc.linearGradient(cardX, cardTop, cardX + cardW, cardTop);
      bandGrad.stop(0, theme, 1).stop(1, C.primaryContainer, 1);
      doc.save();
      doc.roundedRect(cardX, cardTop, cardW, headH, [10, 10, 0, 0]).fill(bandGrad);
      doc.restore();
      doc.rect(cardX, cardTop + headH - 3, cardW, 3).fillColor(C.gold).fill();

      const logoD = 34;
      doc.save();
      doc.circle(cardX + 18 + logoD / 2, cardTop + headH / 2, logoD / 2 + 2).fillColor(C.white).fill();
      if (logo) {
        doc.circle(cardX + 18 + logoD / 2, cardTop + headH / 2, logoD / 2 - 1).clip();
        doc.image(logo, cardX + 19, cardTop + headH / 2 - logoD / 2 + 1, { fit: [logoD - 2, logoD - 2] });
      } else {
        doc.font(FONT.bold).fontSize(13).fillColor(theme)
           .text((schoolName || "S").charAt(0), cardX + 19, cardTop + headH / 2 - 9, { width: logoD, align: "center" });
      }
      doc.restore();
      doc.font(FONT.bold).fontSize(12).fillColor(C.white)
         .text(schoolName || "School", cardX + 60, cardTop + 11, { width: cardW - 200 });
      doc.font(FONT.regular).fontSize(6.5).fillColor(C.surfaceHighest)
         .text("FEE VOUCHER", cardX + 60, cardTop + 30, { width: 150, characterSpacing: 1.5 });
      doc.font(FONT.mono).fontSize(6.5).fillColor(C.white)
         .text(`REF ${refNo || "—"}`, cardX + cardW - 120, cardTop + 12, { width: 102, align: "right" });
      doc.font(FONT.mono).fontSize(6.5).fillColor(C.surfaceHighest)
         .text(dateStr(new Date()), cardX + cardW - 120, cardTop + 28, { width: 102, align: "right" });

      let y = cardTop + headH + 16;

      // ── Student info strip (2×2 cells) ──
      const cellW = (cardW - 32 - 10) / 2, cellH = 34;
      const infoCells = [
        ["STUDENT",    studentName || "—"],
        ["CLASS",      className || "N/A"],
        ["FEE PERIOD", monthYear(dueDate)],
        ["STATUS",     st === "PARTIAL" ? "PARTIAL" : st],
      ];
      infoCells.forEach(([label, value], i) => {
        const cx = cardX + 16 + (i % 2) * (cellW + 10);
        const cy = y + Math.floor(i / 2) * (cellH + 8);
        doc.save();
        doc.roundedRect(cx, cy, cellW, cellH, 6).fillColor(C.surfaceLow).fill();
        doc.roundedRect(cx, cy, cellW, cellH, 6).lineWidth(0.6).strokeColor(C.outlineVariant).stroke();
        doc.roundedRect(cx, cy, 3, cellH, [6, 0, 0, 6]).fillColor(theme).fillOpacity(0.85).fill();
        doc.restore();
        doc.font(FONT.bold).fontSize(6).fillColor(theme)
           .text(label, cx + 9, cy + 5, { width: cellW - 14, characterSpacing: 0.6 });
        doc.font(FONT.bold).fontSize(9).fillColor(label === "STATUS" ? badgeColors(String(value)).fg : C.onSurface)
           .text(String(value), cx + 9, cy + 15, { width: cellW - 14, ellipsis: true });
      });
      y += cellH * 2 + 8 + 12;

      // ── Fee table (compact) ──
      const items = (lineItems && lineItems.length ? lineItems : [{ title: "Total Due", amount: totalDue }]).filter((li) => li && li.title != null);
      const colX = cardX + 18;
      // Give DESCRIPTION more room; keep AMOUNT compact on the right.
      const amountW = 68;
      const amountX = cardX + cardW - 18 - amountW;
      const headH2 = 22, rowH = 22;
      doc.save();
      doc.roundedRect(colX, y, cardW - 36, headH2, [5, 5, 0, 0]).fillColor(theme).fill();
      doc.restore();
      doc.font(FONT.bold).fontSize(7).fillColor(C.white)
         .text("DESCRIPTION", colX + 8, y + 7, { width: amountX - colX - 14 });
      doc.font(FONT.bold).fontSize(7).fillColor(C.white)
         .text("AMOUNT", amountX, y + 7, { width: amountW, align: "right" });
      y += headH2;
      items.forEach((li, i) => {
        if (i % 2 === 1) {
          doc.save();
          doc.rect(colX, y, cardW - 36, rowH).fillColor(C.surfaceLow).fill();
          doc.restore();
        }
        doc.font(FONT.regular).fontSize(9).fillColor(C.onSurface)
           .text(String(li.title || "Fee"), colX + 8, y + 6, { width: amountX - colX - 14 });
        doc.font(FONT.mono).fontSize(8.5).fillColor(C.onSurface)
           .text(rs(li.amount), amountX, y + 6, { width: amountW, align: "right" });
        y += rowH;
      });

      // ── BALANCE DUE hero ──
      const heroH = 56;
      doc.save();
      doc.roundedRect(colX, y, cardW - 36, heroH, [0, 0, 5, 5]).fillColor(theme).fill();
      doc.restore();
      const hMid = colX + (cardW - 36) * 0.52;
      doc.font(FONT.regular).fontSize(6.5).fillColor(C.surfaceHighest)
         .text("BALANCE DUE", colX + 10, y + 9, { width: hMid - colX - 16, characterSpacing: 1.2 });
      doc.font(FONT.monoBold).fontSize(15).fillColor(C.white)
         .text(rs(bal), colX + 10, y + 20, { width: hMid - colX - 14 });
      const rX = hMid + 4, rW = cardW - 36 - (rX - colX) - 10;
      const bcA = badgeColors(st);
      const stT = st === "PARTIAL" ? "PARTIAL" : st;
      doc.font(FONT.bold).fontSize(7).fillColor(bcA.fg);
      const cW2 = doc.widthOfString(stT) + 16;
      doc.save();
      doc.roundedRect(rX, y + 9, cW2, 13, 6.5).fillColor(C.white).fill();
      doc.restore();
      doc.text(stT, rX, y + 11, { width: cW2, align: "center" });
      doc.font(FONT.bold).fontSize(6).fillColor(C.surfaceHighest)
         .text("PAY BY", rX, y + 28, { width: rW, characterSpacing: 0.4 });
      doc.font(FONT.mono).fontSize(9).fillColor(C.white)
         .text(dueDate ? dateStr(dueDate) : "—", rX, y + 36, { width: rW, align: "right" });
      y += heroH + 12;

      // ── QR (left) + HOW TO PAY (right) ──
      const qrBox = 76;
      doc.save();
      doc.roundedRect(cardX + 16, y, qrBox + 10, qrBox + 10, 8).fillColor(C.surfaceLow).fill();
      doc.roundedRect(cardX + 16, y, qrBox + 10, qrBox + 10, 8).lineWidth(0.6).strokeColor(C.outlineVariant).stroke();
      doc.roundedRect(cardX + 19, y + 3, qrBox, qrBox, 5).fillColor(C.white).fill();
      if (qr) doc.image(qr, cardX + 22, y + 6, { fit: [qrBox - 6, qrBox - 6] });
      doc.restore();
      const insX = cardX + 16 + qrBox + 20;
      const insW = cardX + cardW - 16 - insX;
      doc.font(FONT.bold).fontSize(7).fillColor(theme)
         .text("HOW TO PAY", insX, y + 2, { width: insW, characterSpacing: 1 });
      doc.moveTo(insX, y + 12).lineTo(insX + insW, y + 12)
         .lineWidth(0.4).strokeColor(C.outlineVariant).stroke();
      doc.font(FONT.regular).fontSize(7).fillColor(C.onSurface)
         .text("1. Pay at the school office & get stamped.", insX, y + 16, { width: insW, lineGap: 2 });
      doc.text("2. Scan the QR code — fee marked PAID.", insX, y + 36, { width: insW, lineGap: 2 });
      y += qrBox + 14;

      // ── Bank transfer strip (sirf jab bank account configured ho) ──
      if (bank?.accountNumber) {
        const bH = 22;
        doc.save();
        doc.roundedRect(cardX + 16, y, cardW - 32, bH, 6).fillColor(C.surfaceContainer).fill();
        doc.roundedRect(cardX + 16, y, cardW - 32, bH, 6).lineWidth(0.5).strokeColor(C.outlineVariant).stroke();
        doc.restore();
        doc.font(FONT.bold).fontSize(6.5).fillColor(theme)
           .text(`BANK${bank.bankName ? `: ${bank.bankName}` : ""}`, cardX + 22, y + 7, { width: 140 });
        doc.font(FONT.monoBold).fontSize(7).fillColor(C.onSurface)
           .text([bank.accountNumber, bank.accountTitle].filter(Boolean).join("  ·  "), cardX + 150, y + 7, { width: cardW - 170, align: "right" });
        y += bH + 8;
      }

      // ── Footer ──
      doc.moveTo(cardX + 24, y).lineTo(cardX + cardW - 24, y)
         .lineWidth(0.4).strokeColor(C.outlineVariant).stroke();
      doc.font(FONT.italic).fontSize(7).fillColor(C.onSurfaceVariant)
         .text("Please pay before the due date to avoid late charges. Thank you.",
           cardX + 30, y + 6, { width: cardW - 60, align: "center", lineGap: 1 });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK FEE VOUCHERS — A5 vouchers, 2 per A4 page (print-optimized)
  // Ek click pe poori class ke vouchers ka PDF download.
  // ═══════════════════════════════════════════════════════════════════════════
  async bulkFeeVouchers({ vouchers = [], schoolName, themeColor, logoUrl }) {
    if (!vouchers.length) return null;
    const logo = await imageToBuffer(logoUrl);
    const theme = themeColor || C.primary;
    const qrBuffers = await Promise.all(
      vouchers.map((v) => qrBuffer(v.qrData || v.refNo))
    );

    // A5 dimensions
    const PW = 419.53, PH = 595.28;
    const cardW = 370, cardX = (PW - cardW) / 2;
    const cardTop = 14, cardH = PH - 28;
    const cx = PW / 2;
    // A4 page layout: 2 A5 vouchers stacked vertically
    const GAP = 20;

    return this._buildDoc("A4", (doc) => {
      doc.rect(0, 0, A4.width, A4.height).fillColor(C.surfaceLow).fill();

      vouchers.forEach((v, i) => {
        const slot = i % 2;
        if (i > 0 && slot === 0) doc.addPage();

        // Offset Y for top/bottom slot on A4 page
        const offsetY = slot === 0 ? 0 : PH + GAP;

        doc.save();
        doc.translate(0, offsetY);

        // Card background
        doc.roundedRect(cardX + 2, cardTop + 2, cardW, cardH, 10).fillColor("#cdd5ee").fill();
        doc.roundedRect(cardX, cardTop, cardW, cardH, 10).fillColor(C.white).fill();
        doc.roundedRect(cardX, cardTop, cardW, cardH, 10).lineWidth(0.75).strokeColor(C.outlineVariant).stroke();
        // Top accent
        doc.roundedRect(cardX, cardTop, cardW, 5, 10).fillColor(theme).fill();
        doc.rect(cardX, cardTop + 3, cardW, 2).fillColor(theme).fill();

        let y = cardTop + 16;

        // ── Compact Header ──
        const logoD = 36;
        if (logo) {
          doc.circle(cx, y + logoD / 2, logoD / 2 + 2).fillColor(C.surfaceHigh).fill();
          doc.circle(cx, y + logoD / 2, logoD / 2).clip();
          doc.image(logo, cx - logoD / 2, y, { fit: [logoD, logoD] });
        } else {
          doc.circle(cx, y + logoD / 2, logoD / 2).fillColor(C.surfaceContainer).fill();
          doc.font(FONT.bold).fontSize(14).fillColor(theme)
             .text((schoolName || "S").charAt(0), cx - logoD / 2, y + logoD / 2 - 9, { width: logoD, align: "center" });
        }
        y += logoD + 8;

        doc.font(FONT.bold).fontSize(12).fillColor(theme)
           .text(schoolName, cardX + 16, y, { width: cardW - 32, align: "center" });
        y += doc.heightOfString(schoolName, { width: cardW - 32 }) + 2;

        doc.font(FONT.regular).fontSize(7).fillColor(C.onSurfaceVariant)
           .text("FEE VOUCHER", cardX + 16, y, { width: cardW - 32, align: "center", characterSpacing: 2 });
        y += 10;
        doc.moveTo(cardX + 14, y).lineTo(cardX + cardW - 14, y)
           .lineWidth(0.4).strokeColor(C.outlineVariant).stroke();
        y += 8;

        // ── Student Info ──
        const infoH = 40;
        doc.roundedRect(cardX + 8, y, cardW - 16, infoH, 6).fillColor(C.surfaceLow).fill();
        doc.roundedRect(cardX + 8, y, cardW - 16, infoH, 6).lineWidth(0.5).strokeColor(C.outlineVariant).stroke();

        doc.font(FONT.regular).fontSize(6.5).fillColor(C.onSurfaceVariant)
           .text("STUDENT", cardX + 16, y + 6, { width: 60, characterSpacing: 0.5 });
        doc.font(FONT.bold).fontSize(9).fillColor(C.onSurface)
           .text(v.studentName || "—", cardX + 80, y + 5, { width: cardW - 96 });
        doc.moveTo(cardX + 16, y + 20).lineTo(cardX + cardW - 16, y + 20)
           .lineWidth(0.3).strokeColor(C.outlineVariant).stroke();
        doc.font(FONT.regular).fontSize(6.5).fillColor(C.onSurfaceVariant)
           .text("CLASS", cardX + 16, y + 24, { width: 60, characterSpacing: 0.5 });
        doc.font(FONT.regular).fontSize(9).fillColor(C.onSurface)
           .text(v.className || "—", cardX + 80, y + 23, { width: cardW - 96 });
        y += infoH + 8;

        // ── Due Date + Amount ──
        const metaH = 32;
        doc.roundedRect(cardX + 8, y, cardW - 16, metaH, 6).fillColor(C.surfaceLow).fill();
        doc.roundedRect(cardX + 8, y, cardW - 16, metaH, 6).lineWidth(0.5).strokeColor(C.outlineVariant).stroke();

        doc.font(FONT.regular).fontSize(6.5).fillColor(C.onSurfaceVariant)
           .text("DUE DATE", cardX + 16, y + 6, { width: 60, characterSpacing: 0.5 });
        doc.font(FONT.mono).fontSize(10).fillColor(C.onSurface)
           .text(v.dueDate ? dateStr(v.dueDate) : "—", cardX + 80, y + 4, { width: cardW - 96, align: "right" });
        doc.moveTo(cardX + 16, y + 18).lineTo(cardX + cardW - 16, y + 18)
           .lineWidth(0.3).strokeColor(C.outlineVariant).stroke();
        doc.font(FONT.regular).fontSize(6.5).fillColor(C.onSurfaceVariant)
           .text("TOTAL DUE", cardX + 16, y + 21, { width: 60, characterSpacing: 0.5 });
        doc.font(FONT.monoBold).fontSize(10).fillColor(theme)
           .text(rs(v.totalDue), cardX + 80, y + 20, { width: cardW - 96, align: "right" });
        y += metaH + 8;

        // ── Fee Line Items ──
        const items = (v.lineItems || []).filter((li) => li && li.title != null);
        if (items.length) {
          const itemH = 18;
          items.forEach((li, j) => {
            if (j % 2 === 1) {
              doc.rect(cardX + 8, y, cardW - 16, itemH).fillColor(C.surfaceLow).fill();
            }
            doc.font(FONT.regular).fontSize(8).fillColor(C.onSurface)
               .text(li.title, cardX + 14, y + 5, { width: cardW - 100 });
            doc.font(FONT.mono).fontSize(8).fillColor(C.onSurface)
               .text(rs(li.amount), cardX + cardW - 80, y + 5, { width: 66, align: "right" });
            y += itemH;
          });
          // Total
          doc.rect(cardX + 8, y, cardW - 16, 20).fillColor(C.surfaceContainer).fill();
          doc.moveTo(cardX + 8, y).lineTo(cardX + cardW - 8, y).lineWidth(1).strokeColor(theme).stroke();
          doc.font(FONT.bold).fontSize(9).fillColor(theme)
             .text("TOTAL DUE", cardX + 14, y + 5, { width: cardW - 100 });
          doc.font(FONT.monoBold).fontSize(9).fillColor(theme)
             .text(rs(v.totalDue), cardX + cardW - 80, y + 5, { width: 66, align: "right" });
          y += 28;
        } else {
          doc.font(FONT.regular).fontSize(9).fillColor(C.onSurface)
             .text("Total Due: " + rs(v.totalDue), cardX + 14, y + 4, { width: cardW - 28 });
          y += 22;
        }

        // ── QR Code ──
        const qrBuf = qrBuffers[i];
        const qrBox = 72;
        const qx = A4.width / 2 - qrBox / 2;
        doc.roundedRect(qx - 4, y - 4, qrBox + 8, qrBox + 8, 6).fillColor(C.surfaceLow).fill();
        doc.roundedRect(qx - 4, y - 4, qrBox + 8, qrBox + 8, 6).lineWidth(0.5).strokeColor(C.outlineVariant).stroke();
        doc.roundedRect(qx, y, qrBox, qrBox, 4).fillColor(C.white).fill();
        if (qrBuf) doc.image(qrBuf, qx + 4, y + 4, { fit: [qrBox - 8, qrBox - 8] });
        y += qrBox + 6;
        doc.font(FONT.mono).fontSize(6.5).fillColor(C.onSurfaceVariant)
           .text(v.refNo || "—", cardX + 14, y, { width: cardW - 28, align: "center", characterSpacing: 0.5 });
        y += 12;

        // ── Payment Instructions ──
        doc.moveTo(cardX + 14, y).lineTo(cardX + cardW - 14, y)
           .lineWidth(0.3).strokeColor(C.outlineVariant).stroke();
        doc.font(FONT.italic).fontSize(6.5).fillColor(C.onSurfaceVariant)
           .text("Pay at school office or scan QR to pay online. Thank you.",
             cardX + 18, y + 4, { width: cardW - 36, align: "center", lineGap: 1 });

        doc.restore(); // end translate
      });
    });
  }
}

export default new PdfService();
