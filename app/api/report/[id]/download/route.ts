import type { NextRequest } from "next/server";
import { GET as reportDownloadGet } from "@/app/api/reports/[id]/download/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return reportDownloadGet(request, context);
}
