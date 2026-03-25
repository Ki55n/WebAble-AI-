import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

interface ReportStep {
  step?: number | string;
  description?: string;
  [key: string]: unknown;
}

export interface ReportPdfInput {
  vendor: string;
  score: number;
  summary: string;
  risks: string[];
  fixes: string[];
  steps: ReportStep[];
  createdAt: Date;
}

interface DrawContext {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  margin: number;
  width: number;
}

interface DrawTextOptions {
  font: PDFFont;
  size: number;
  lineHeight: number;
  color?: ReturnType<typeof rgb>;
  indent?: number;
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [""];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current) {
      lines.push(current);
      current = "";
    }
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const candidateWidth = font.widthOfTextAtSize(candidate, size);

    if (candidateWidth <= maxWidth) {
      current = candidate;
      continue;
    }

    if (!current) {
      let partial = "";
      for (const char of word) {
        const next = `${partial}${char}`;
        if (font.widthOfTextAtSize(next, size) > maxWidth && partial) {
          lines.push(partial);
          partial = char;
        } else {
          partial = next;
        }
      }
      current = partial;
      continue;
    }

    pushCurrent();
    current = word;
  }

  pushCurrent();
  return lines;
}

function ensurePageSpace(ctx: DrawContext, requiredHeight: number): DrawContext {
  if (ctx.y - requiredHeight > ctx.margin) {
    return ctx;
  }

  const nextPage = ctx.doc.addPage([595, 842]);
  return {
    ...ctx,
    page: nextPage,
    y: 842 - ctx.margin,
  };
}

function drawWrappedText(
  ctx: DrawContext,
  text: string,
  options: DrawTextOptions,
): DrawContext {
  const indent = options.indent ?? 0;
  const availableWidth = ctx.width - indent;
  const lines = wrapText(text, options.font, options.size, availableWidth);

  let local = ctx;
  for (const line of lines) {
    local = ensurePageSpace(local, options.lineHeight);
    local.page.drawText(line, {
      x: local.margin + indent,
      y: local.y,
      size: options.size,
      font: options.font,
      color: options.color ?? rgb(0.1, 0.1, 0.1),
    });
    local.y -= options.lineHeight;
  }

  return local;
}

function drawSectionTitle(
  ctx: DrawContext,
  title: string,
  boldFont: PDFFont,
): DrawContext {
  let local = ensurePageSpace(ctx, 24);
  local = drawWrappedText(local, title, {
    font: boldFont,
    size: 14,
    lineHeight: 18,
    color: rgb(0, 0.32, 0.26),
  });
  local.y -= 4;
  return local;
}

export async function generateReportPdf(
  report: ReportPdfInput,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let ctx: DrawContext = {
    doc: pdfDoc,
    page: pdfDoc.addPage([595, 842]),
    y: 842 - 50,
    margin: 50,
    width: 595 - 100,
  };

  ctx = drawWrappedText(ctx, "VendorShield Security Report", {
    font: boldFont,
    size: 20,
    lineHeight: 26,
    color: rgb(0, 0.2, 0.45),
  });
  ctx.y -= 8;

  const createdAtText = report.createdAt.toLocaleDateString();
  const metadata = [
    `Vendor: ${report.vendor}`,
    `Score: ${report.score}/10`,
    `Date: ${createdAtText}`,
  ];

  for (const row of metadata) {
    ctx = drawWrappedText(ctx, row, {
      font: regularFont,
      size: 11,
      lineHeight: 16,
    });
  }

  ctx.y -= 6;

  ctx = drawSectionTitle(ctx, "Summary", boldFont);
  ctx = drawWrappedText(ctx, report.summary || "No summary available", {
    font: regularFont,
    size: 11,
    lineHeight: 16,
  });

  ctx.y -= 6;
  ctx = drawSectionTitle(ctx, "Risks", boldFont);
  if (report.risks.length === 0) {
    ctx = drawWrappedText(ctx, "No risks found.", {
      font: regularFont,
      size: 11,
      lineHeight: 16,
    });
  } else {
    for (const risk of report.risks) {
      ctx = drawWrappedText(ctx, `• ${risk}`, {
        font: regularFont,
        size: 11,
        lineHeight: 16,
      });
    }
  }

  ctx.y -= 6;
  ctx = drawSectionTitle(ctx, "Recommended Fixes", boldFont);
  if (report.fixes.length === 0) {
    ctx = drawWrappedText(ctx, "No fixes provided.", {
      font: regularFont,
      size: 11,
      lineHeight: 16,
    });
  } else {
    for (const fix of report.fixes) {
      ctx = drawWrappedText(ctx, `• ${fix}`, {
        font: regularFont,
        size: 11,
        lineHeight: 16,
      });
    }
  }

  ctx.y -= 6;
  ctx = drawSectionTitle(ctx, "Audit Steps", boldFont);
  if (report.steps.length === 0) {
    ctx = drawWrappedText(ctx, "No step log available.", {
      font: regularFont,
      size: 11,
      lineHeight: 16,
    });
  } else {
    for (const step of report.steps) {
      const indexText =
        typeof step.step === "number" || typeof step.step === "string"
          ? `${step.step}. `
          : "";
      const description =
        typeof step.description === "string"
          ? step.description
          : JSON.stringify(step);
      ctx = drawWrappedText(ctx, `${indexText}${description}`, {
        font: regularFont,
        size: 11,
        lineHeight: 16,
      });
    }
  }

  return pdfDoc.save();
}

