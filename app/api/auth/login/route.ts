// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    // 1) Parse JSON body
    const body = await request.json().catch(() => null);

    // 2) Validate shape
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // 3) Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 4) Compare password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 5) Success – return basic user info
    // 5) Success – create a token and set cookie
const token = signAuthToken({
  userId: user.id,
  email: user.email,
});

// Build response JSON
const res = NextResponse.json({
  ok: true,
  user: {
    id: user.id,
    email: user.email,
  },
});

// Attach HTTP-only cookie
res.cookies.set({
  name: AUTH_COOKIE_NAME,
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  sameSite: "lax",
});

return res;

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
