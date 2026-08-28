/**
 * Preview PDFs for the slip / ID-card templates so the design can be
 * reviewed without running the whole app or seeding a database.
 *
 *   node src/scripts/generateSlipSamples.js
 *
 * Writes:
 *   Backend/slip-test.pdf      → Admission Fee Slip (sample applicant)
 *   Backend/id-card-test.pdf   → Student ID Card (portrait card)
 *   Backend/receipt-test.pdf   → Fee Payment Receipt
 *   Backend/uploads/sample-logo.png → demo school logo used in the previews
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import pdfService from "../services/pdf.service.js";
import { parentNotificationEmail } from "../services/email.templates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../..");

// Demo school logo (Oxford-blue tile with an "S" monogram) so the header
// logo + watermark are visible in the previews. Real schools pass their own
// logoUrl — the templates just render whatever is provided.
const logoPath = path.join(outDir, "uploads", "sample-logo.png");
fs.mkdirSync(path.dirname(logoPath), { recursive: true });
const logoSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#00236f" rx="44"/>
  <circle cx="150" cy="120" r="48" fill="#64a8fe"/>
  <text x="150" y="148" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle">S</text>
  <text x="150" y="226" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" letter-spacing="4" text-anchor="middle">O.I.S.S</text>
</svg>`);
await sharp(logoSvg).png().toFile(logoPath);

const sample = {
  schoolName: "Oxford Islamic Scientific School",
  campusName: "Main Campus",
  themeColor: "#00236f",
  logoUrl: "/uploads/sample-logo.png",
  schoolAddress: "Main Campus, Gulshan-e-Iqbal, Karachi",
  schoolPhone: "0300-1234567",
};

// 1. Admission Fee Slip (matches stitch_school_slip_creator (1)/code.html)
const slip = await pdfService.admissionSlip({
  ...sample,
  applicant: {
    firstName: "Rao",
    lastName: "Shayan",
    className: "PlayGroup",
    parentName: "M Shayan",
    parentWhatsappNo: "0300-1234567",
    status: "APPROVED",
  },
  refNo: "ADM-test123",
  amount: 5000,
  dueDate: new Date("2026-08-25"),
});
fs.writeFileSync(path.join(outDir, "slip-test.pdf"), slip);

// 2. Student ID Card (matches stitch_school_slip_creator/code.html)
const idCard = await pdfService.studentIdSlip({
  ...sample,
  studentName: "Rao Shayan",
  fatherName: "Muhammad Shayan",
  className: "PlayGroup",
  sectionName: "Blue",
  rollNumber: "2024-001",
  identifierCode: "OISS-2024-001-ABC123",
  refNo: "ID-12345678",
  validUntil: new Date("2026-12-31"),
  photoUrl: null,
});
fs.writeFileSync(path.join(outDir, "id-card-test.pdf"), idCard);

// 3. Bulk ID card sheet (A4, 2×2 grid) — 4 sample students
const sheetCards = [
  { studentName: "Rao Shayan", fatherName: "Muhammad Shayan", className: "PlayGroup", sectionName: "Blue", rollNumber: "2024-001", identifierCode: "OISS-2024-001-ABC123", refNo: "ID-12345678" },
  { studentName: "Ayesha Khan", fatherName: "Imran Khan", className: "PlayGroup", sectionName: "Blue", rollNumber: "2024-002", identifierCode: "OISS-2024-002-DEF456", refNo: "ID-12345679" },
  { studentName: "Hassan Ali", fatherName: "Shahid Ali", className: "Class 1", sectionName: "A", rollNumber: "2024-003", identifierCode: "OISS-2024-003-GHI789", refNo: "ID-12345680" },
  { studentName: "Fatima Noor", fatherName: "Abdul Noor", className: "Class 1", sectionName: "A", rollNumber: "2024-004", identifierCode: "OISS-2024-004-JKL012", refNo: "ID-12345681" },
  { studentName: "Bilal Khan", fatherName: "Shahid Khan", className: "Class 2", sectionName: "B", rollNumber: "2024-005", identifierCode: "OISS-2024-005-MNO345", refNo: "ID-12345682" },
  { studentName: "Zainab Malik", fatherName: "Nadeem Malik", className: "Class 2", sectionName: "B", rollNumber: "2024-006", identifierCode: "OISS-2024-006-PQR678", refNo: "ID-12345683" },
];
const idCardSheet = await pdfService.idCardSheet({ cards: sheetCards, ...sample });
fs.writeFileSync(path.join(outDir, "id-card-sheet-test.pdf"), idCardSheet);

// 4. Branded email preview (Oxford-blue design — admission approved mail)
process.env.API_URL = "http://localhost:3000"; // preview: local logo ko absolute URL
const emailHtml = parentNotificationEmail({
  schoolName: sample.schoolName,
  orgName: sample.campusName,
  logoUrl: sample.logoUrl,
  title: "Admission Approved — Slip Ready",
  message:
    "Good news! Rao Shayan's admission has been APPROVED at Oxford Islamic Scientific School.\nPlease clear the advance fee at the office to complete enrollment.",
  details: [
    ["Student", "Rao Shayan"],
    ["Class", "PlayGroup"],
    ["Advance Fee", "Rs. 5000.00"],
    ["Slip Ref", "ADM-test123"],
  ],
  address: "Main Campus, Gulshan-e-Iqbal, Karachi",
  phone: "0300-1234567",
});
fs.writeFileSync(path.join(outDir, "email-preview.html"), emailHtml);

// 5. Fee Payment Receipt
const receipt = await pdfService.feeReceipt({
  ...sample,
  studentName: "Rao Shayan",
  className: "PlayGroup Blue",
  rows: [
    { label: "Due Date", value: "10/08/2026" },
    { label: "Status", value: "PAID" },
  ],
  lineItems: [
    { title: "Tuition Fee", amount: 4000 },
    { title: "Transport", amount: 1000 },
  ],
  totalPaid: 5000,
  paidAt: new Date("2026-08-16"),
  refNo: "RC-12345678",
});
fs.writeFileSync(path.join(outDir, "receipt-test.pdf"), receipt);

console.log("Generated preview PDFs:");
console.log("  Backend/slip-test.pdf           (Admission Fee Slip)");
console.log("  Backend/id-card-test.pdf        (Student ID Card — logo + watermark)");
console.log("  Backend/id-card-sheet-test.pdf  (A4 sheet, 4 ID cards for bulk print)");
console.log("  Backend/receipt-test.pdf        (Fee Payment Receipt)");
console.log("  Backend/email-preview.html      (Oxford-blue branded email)");
console.log("  Backend/uploads/sample-logo.png (demo school logo)");
