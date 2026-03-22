import type { NextRequest } from "next/server";
import { POST as loginPost } from "@/app/api/auth/login/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return loginPost(request);
}
