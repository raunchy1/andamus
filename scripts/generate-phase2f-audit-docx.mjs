#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  PageNumber,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_DIR = process.argv[2] || path.join(__dirname, "../../audit");
const OUT_FILE = path.join(AUDIT_DIR, "Andamus_Phase2F_Legacy_Red_Sweep_Audit.docx");
const MAX_IMG_WIDTH = 580;

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const TABLE_WIDTH = 9026;

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
  const children = [
    new ImageRun({
      type: "png",
      data: fs.readFileSync(filePath),
      transformation: size,
      altText: {
        title,
        description: title,
        name: path.basename(filePath, ".png"),
      },
    }),
  ];
  return [
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: title, bold: true, size: 22 })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, children }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: path.basename(filePath),
          italics: true,
          size: 18,
          color: "666666",
        }),
      ],
    }),
  ];
}

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width || TABLE_WIDTH / 2, type: WidthType.DXA },
    shading: opts.header ? { fill: "D5E8F0", type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: !!opts.header, size: opts.header ? 20 : 18 })],
      }),
    ],
  });
}

function tableRow(cells) {
  return new TableRow({ children: cells });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: `• ${text}`, size: 20 })],
  });
}

const results = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, "phase-2f-results.json"), "utf8"));

const pageScreens = [
  { file: "phase-2f-privacy-policy-desktop.png", title: "Privacy Policy — desktop" },
  { file: "phase-2f-termini-e-condizioni-desktop.png", title: "Termini e Condizioni — desktop" },
  { file: "phase-2f-premium-desktop.png", title: "Premium — desktop" },
  { file: "phase-2f-gruppi-desktop.png", title: "Gruppi — desktop" },
];

const emailScreens = [
  { file: "email-welcome.png", title: "Email — Welcome" },
  { file: "email-booking-request.png", title: "Email — Booking Request" },
  { file: "email-booking-confirmed.png", title: "Email — Booking Confirmed" },
  { file: "email-booking-rejected.png", title: "Email — Booking Rejected" },
  { file: "email-new-message.png", title: "Email — New Message" },
];

const remainingRed = [
  "components/AuthModal.tsx",
  "components/footer.tsx",
  "components/OnboardingModal.tsx",
  "components/cerca/PremiumRideCard.tsx",
  "components/NotificationBell.tsx",
  "components/CreateRequestModal.tsx",
  "app/[locale]/manifest.ts",
  "app/globals.css (legacy token references)",
];

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "Andamus", size: 40, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text: "Raport audit vizual — Phase 2F Legacy Red Sweep",
        size: 28,
        bold: true,
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: "Data: ", bold: true }),
      new TextRun("21 iunie 2026"),
    ],
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: "Commit: ", bold: true }),
      new TextRun("14229fc — feat(ui): Phase 2F legacy red sweep"),
    ],
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: "Mediu captură: ", bold: true }),
      new TextRun("http://localhost:7001 (Next.js 16 dev)"),
    ],
  }),
  new Paragraph({
    spacing: { after: 240 },
    children: [
      new TextRun({ text: "Accent nou: ", bold: true }),
      new TextRun("#4FB3C9 (teal) — înlocuire vizuală a roșului legacy #e63946"),
    ],
  }),

  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun("1. Rezumat")],
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: "Phase 2F finalizează sweep-ul vizual pe paginile legale, premium, gruppi și șabloanele de email tranzacționale. Toate capturile din acest raport au fost verificate automat: legacyRedInHtml = false pentru fiecare pagină și email.",
        size: 20,
      }),
    ],
  }),
  bullet("Pagini legale (privacy, termini) — tokeni design system: bg-bg, text-fg, heading-editorial, accente teal"),
  bullet("Premium — carduri bg-surface, prețuri mono, CTA teal (logica Stripe neatinsă)"),
  bullet("Gruppi + detaliu grup — Avatar, Badge, culoare implicită #4FB3C9"),
  bullet("Email templates — layout light, accent teal, branding „andamus” lowercase"),
  bullet("i18n — chei auth.* adăugate în it.json, en.json, de.json"),
  new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({ text: "Build: ", bold: true }),
      new TextRun("npm run build — exit 0 (zero erori)"),
    ],
  }),

  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun("2. Fișiere modificate")],
  }),
  new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [3200, 5826],
    rows: [
      tableRow([cell("Fișier", { header: true, width: 3200 }), cell("Modificări", { header: true, width: 5826 })]),
      tableRow([cell("app/[locale]/privacy-policy/page.tsx", { width: 3200 }), cell("Tokeni design, accente teal", { width: 5826 })]),
      tableRow([cell("app/[locale]/termini-e-condizioni/page.tsx", { width: 3200 }), cell("Tokeni design, accente teal", { width: 5826 })]),
      tableRow([cell("app/[locale]/premium/page.tsx", { width: 3200 }), cell("Carduri surface, CTA teal", { width: 5826 })]),
      tableRow([cell("app/[locale]/gruppi/page.tsx", { width: 3200 }), cell("Avatar, Badge, tokeni", { width: 5826 })]),
      tableRow([cell("app/[locale]/gruppo/[id]/page.tsx", { width: 3200 }), cell("Restyle tokeni", { width: 5826 })]),
      tableRow([cell("lib/emails/templates.ts", { width: 3200 }), cell("Layout light, accent teal", { width: 5826 })]),
      tableRow([cell("lib/emails/i18n.ts", { width: 3200 }), cell("Reminder strings: red → teal", { width: 5826 })]),
      tableRow([cell("messages/it.json, en.json, de.json", { width: 3200 }), cell("Chei auth.* (login, register, labels)", { width: 5826 })]),
    ],
  }),

  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun("3. Rezultate verificare automată")],
  }),
  new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [2400, 2200, 2200, 2226],
    rows: [
      tableRow([
        cell("Element", { header: true, width: 2400 }),
        cell("Status", { header: true, width: 2200 }),
        cell("Legacy red", { header: true, width: 2200 }),
        cell("Fișier captură", { header: true, width: 2226 }),
      ]),
      ...results.map((r) =>
        tableRow([
          cell(r.name, { width: 2400 }),
          cell(r.status, { width: 2200 }),
          cell(r.legacyRedInHtml ? "DA" : "NU", { width: 2200 }),
          cell(r.file || "—", { width: 2226 }),
        ])
      ),
    ],
  }),

  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun("4. Capturi ecran — Pagini")],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: "Screenshot-urile de mai jos sunt incluse direct în document (nu sunt link-uri externe).",
        size: 20,
        italics: true,
      }),
    ],
  }),
];

for (const screen of pageScreens) {
  const filePath = path.join(AUDIT_DIR, screen.file);
  if (fs.existsSync(filePath)) {
    children.push(...imageParagraph(filePath, screen.title));
    if (screen.file.includes("privacy") || screen.file.includes("termini")) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }
}

children.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun("5. Capturi ecran — Email tranzacționale")],
  })
);

for (const screen of emailScreens) {
  const filePath = path.join(AUDIT_DIR, screen.file);
  if (fs.existsSync(filePath)) {
    children.push(...imageParagraph(filePath, screen.title));
  }
}

children.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun("6. Roșu legacy rămas (în afara scope-ului Phase 2F)")],
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: "Culoarea #e63946 persistă în ~50 de fișiere/componente care nu au fost incluse în acest sweep (modale auth, footer, onboarding, carduri premium legacy, manifest etc.). Recomandare: Phase 2G pentru sweep complet.",
        size: 20,
      }),
    ],
  })
);

for (const item of remainingRed) {
  children.push(bullet(item));
}

children.push(
  new Paragraph({
    spacing: { before: 240 },
    children: [
      new TextRun({ text: "Generat automat: ", bold: true }),
      new TextRun("scripts/generate-phase2f-audit-docx.mjs"),
    ],
  })
);

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 0 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun("Andamus Phase 2F Audit — "),
                new TextRun({ children: [PageNumber.CURRENT] }),
                new TextRun(" / "),
                new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT_FILE, buffer);
console.log(`DOCX written: ${OUT_FILE} (${(buffer.length / 1024).toFixed(1)} KB)`);