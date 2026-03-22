import { isValidObjectId } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuthUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { Report } from "@/lib/server/models/report";
import { generateReportPdf } from "@/lib/server/report-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StepRecord {
  step?: number | string;
  description?: string;
  [key: string]: unknown;
}

function toStepRecords(input: unknown): StepRecord[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null && !Array.isArray(entry),
    )
    .map((entry) => ({
      step:
        typeof entry.step === "number" || typeof entry.step === "string"
          ? entry.step
          : undefined,
      description:
        typeof entry.description === "string"
          ? entry.description
          : JSON.stringify(entry),
      ...entry,
    }));
}

function getVendorFileName(vendor: string): string {
  try {
    const hostname = new URL(vendor).hostname;
    return hostname.replace(/[^a-zA-Z0-9.-]/g, "_");
  } catch {
    return vendor.replace(/[^a-zA-Z0-9.-]/g, "_");
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireAuthUser(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ msg: "Invalid report id" }, { status: 400 });
    }

    await connectToDatabase();

    const report = await Report.findOne({ _id: id, userId: user.id }).lean();
    if (!report) {
      return NextResponse.json({ msg: "Not found" }, { status: 404 });
    }

    const createdAt =
      report.createdAt instanceof Date
        ? report.createdAt
        : new Date(report.createdAt);

    const pdfBytes = await generateReportPdf({
      vendor: report.vendor,
      score: report.score,
      summary: typeof report.summary === "string" ? report.summary : "",
      risks: Array.isArray(report.risks) ? report.risks : [],
      fixes: Array.isArray(report.fixes) ? report.fixes : [],
      steps: toStepRecords(report.steps),
      createdAt,
    });

    const fileName = `${getVendorFileName(report.vendor)}-audit.pdf`;
    const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfBuffer).set(pdfBytes);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ msg: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { msg: "Failed to create report PDF", error: message },
      { status: 500 },
    );
  }
}
