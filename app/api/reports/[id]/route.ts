import { isValidObjectId } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server/db";
import { Report } from "@/lib/server/models/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ msg: "Invalid report id" }, { status: 400 });
    }

    await connectToDatabase();

    const report = await Report.findById(id).lean();
    if (!report) {
      return NextResponse.json({ msg: "Not found" }, { status: 404 });
    }


    return NextResponse.json({
      id: String(report._id),
      runId: report.runId,
      vendor: report.vendor,
      score: report.score,
      risks: Array.isArray(report.risks) ? report.risks : [],
      fixes: Array.isArray(report.fixes) ? report.fixes : [],
      steps: Array.isArray(report.steps) ? report.steps : [],
      summary: typeof report.summary === "string" ? report.summary : "",
      details: report.details ?? {},
      createdAt: report.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { msg: "Failed to fetch report", error: message },
      { status: 500 },
    );
  }
}

