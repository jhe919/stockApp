// lib/auth.ts
import jwt, { JwtPayload } from "jsonwebtoken";

const AUTH_COOKIE_NAME = "auth_token";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set in .env");
}

// Make TS happy: from here on, treat it as a definite string
const AUTH_SECRET_STR = AUTH_SECRET as string;

export type AuthTokenPayload = {
  userId: number;
  email: string;
};

export function signAuthToken(payload: AuthTokenPayload): string {
  // jwt.sign(payload, secret, options)
  return jwt.sign(payload, AUTH_SECRET_STR, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET_STR) as JwtPayload;

    if (typeof decoded !== "object" || decoded === null) {
      return null;
    }

    const { userId, email } = decoded as JwtPayload & {
      userId?: unknown;
      email?: unknown;
    };

    if (typeof userId !== "number" || typeof email !== "string") {
      return null;
    }

    return { userId, email };
  } catch {
    return null;
  }
}

export { AUTH_COOKIE_NAME };
