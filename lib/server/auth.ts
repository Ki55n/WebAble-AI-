import jwt, { type SignOptions } from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { requireEnv } from "@/lib/server/env";

export interface AuthUser {
  id: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function getJwtSecret(): string {
  return requireEnv("JWT_SECRET");
}

export function signAuthToken(
  payload: Pick<AuthUser, "id">,
  expiresIn: SignOptions["expiresIn"] = "1h",
): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token.trim();
}

export function verifyAuthToken(token: string): AuthUser {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof (decoded as AuthUser).id !== "string"
    ) {
      throw new AuthError("Invalid token", 401);
    }

    return decoded as AuthUser;
  } catch {
    throw new AuthError("Invalid token", 401);
  }
}

export function requireAuthUser(request: NextRequest): AuthUser {
  const token = extractBearerToken(request);
  if (!token) {
    throw new AuthError("No token", 401);
  }

  return verifyAuthToken(token);
}

