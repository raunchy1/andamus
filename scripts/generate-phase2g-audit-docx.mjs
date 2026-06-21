#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun,
  PageNumber, Packer, PageBreak, Paragraph, ShadingType, Table, TableCell,
  TableRow, TextRun, WidthType,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_DIR = process.argv[2] || path.join(__dirname, "../../audit");
const OUT_FILE = path.join(AUDIT_DIR, "Andamus_Phase2G_Complete_Legacy_Red_Sweep_Audit.docx");
const MAX_IMG_WIDTH = 580;
const TABLE_WIDTH = 9026;
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function scaledSize(filePath, maxWidth = MAX_IMG_WIDTH) {
  const buf = fs.readFileSync(filePath);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (!w || !h) return { width: maxWidth, height: Math.round(maxWidth * 0.6) };
  const ratio = maxWidth / w;
  return { width: maxWidth, height: Math.round(h * ratio) };
}

function imageParagraph(filePath, title) {
  const size = scaledSize(filePath);
  return [
    new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: title, bold: true, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: fs.readFileSync(filePath), transformation: size, altText: { title, description: title, name: path.basename(filePath, ".png") } })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: path.basename(filePath), italics: true, size: 18, color: "666666" })] }),
  ];
}

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width || TABLE_WIDTH / 2, type: WidthType.DXA },
    shading: opts.header ? { fill: "D5E8F0", type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.header, size: opts.header ? 20 : 18 })] })],
  });
}

const results = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, "phase-2g-results.json"), "utf8"));
const screens = [
  { file: "phase-2g-home-desktop.png", title: "Home + Footer" },
  { file: "phase-2g-auth-modal-desktop.png", title: "AuthModal (login)" },
  { file: "phase-2g-cerca-desktop.png", title: "Cerca" },
  { file: "phase-2g-premium-desktop.png", title: "Premium" },
  { file: "phase-2g-gruppi-desktop.png", title: "Gruppi" },
  { file: "email-welcome.png", title: "Email Welcome (no emoji)" },
  { file: "email-booking-rejected.png", title: "Email Booking Rejected" },
];

const children = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Andamus", size: 40, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "Phase 2G — Complete Legacy Red Sweep Audit", size: 28, bold: true })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Data: ", bold: true }), new TextRun("21 iunie 2026")] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Accent: ", bold: true }), new TextRun("#4FB3C9 (teal) — zero #e63946 în cod live")] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Rezumat")] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Sweep complet Phase 2G: tokeni globals.css repoint, 66 fișiere live restyled, manifest PWA #0A0A0A, emoji eliminate din emailuri, 2 componente dead șterse. Build: exit 0.", size: 20 })] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Verificare automată")] }),
  new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [2400, 2200, 2200, 2226],
    rows: [
      new TableRow({ children: [cell("Element", { header: true, width: 2400 }), cell("Status", { header: true, width: 2200 }), cell("Legacy red", { header: true, width: 2200 }), cell("Fișier", { header: true, width: 2226 })] }),
      ...results.map((r) => new TableRow({ children: [cell(r.name, { width: 2400 }), cell(r.status, { width: 2200 }), cell(r.legacyRedInHtml ? "DA" : "NU", { width: 2200 }), cell(r.file || "—", { width: 2226 })] })),
    ],
  }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Capturi ecran (inline)")] }),
];

for (const s of screens) {
  const fp = path.join(AUDIT_DIR, s.file);
  if (fs.existsSync(fp)) children.push(...imageParagraph(fp, s.title));
}

children.push(
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Fișiere șterse (dead code)")] }),
  new Paragraph({ children: [new TextRun("• components/BetaFeedback.tsx — zero imports")] }),
  new Paragraph({ children: [new TextRun("• components/SardiniaMap.tsx — zero imports")] }),
);

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: 20 } } }, paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 0 } }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("Phase 2G Audit — "), new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
    children,
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT_FILE, buffer);
console.log(`DOCX: ${OUT_FILE} (${(buffer.length / 1024).toFixed(1)} KB)`);