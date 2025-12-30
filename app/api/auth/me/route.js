// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    // NOTE: cookies() is async in your Next version → await it
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, user: null, error: "Not authenticated (no cookie)" },
        { status: 401 }
      );
    }

    const payload = verifyAuthToken(token);

    if (!payload) {
      return NextResponse.json(
        { ok: false, user: null, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // For now just return what's in the token
    return NextResponse.json({
      ok: true,
      user: payload, // { userId, email }
    });
  } catch (err) {
    console.error("Error in /api/auth/me:", err);
    return NextResponse.json(
      { ok: false, user: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
