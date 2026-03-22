import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuthUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { Report } from "@/lib/server/models/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request);
    await connectToDatabase();

    const reports = await Report.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      reports.map((report) => ({
        id: String(report._id),
        vendor: report.vendor,
        score: report.score,
        risks: Array.isArray(report.risks) ? report.risks : [],
        fixes: Array.isArray(report.fixes) ? report.fixes : [],
        summary: typeof report.summary === "string" ? report.summary : "",
        date: report.createdAt,
      })),
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ msg: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { msg: "Failed to fetch reports", error: message },
      { status: 500 },
    );
  }
}

