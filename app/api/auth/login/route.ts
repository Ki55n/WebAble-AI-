import { NextRequest, NextResponse } from "next/server";
import { signAuthToken } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ msg: "Invalid request body" }, { status: 400 });
  }

  const email = typeof (body as { email?: unknown })?.email === "string"
    ? (body as { email: string }).email
    : "";
  const password = typeof (body as { password?: unknown })?.password === "string"
    ? (body as { password: string }).password
    : "";

  const allowedEmail = process.env.DEMO_LOGIN_EMAIL ?? "test@vendorshield.com";
  const allowedPassword = process.env.DEMO_LOGIN_PASSWORD ?? "pass";
  const userId = process.env.DEMO_LOGIN_USER_ID ?? "user123";

  console.log("Allowed Email: ", allowedEmail);
  console.log("Allowed Password: ", allowedPassword);

  if (email !== allowedEmail || password !== allowedPassword) {
    return NextResponse.json({ msg: "Invalid creds" }, { status: 401 });
  }

  try {
    const token = signAuthToken({ id: userId }, "1h");
    return NextResponse.json({ token, expiresIn: "1h" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ msg: message }, { status: 500 });
  }
}
