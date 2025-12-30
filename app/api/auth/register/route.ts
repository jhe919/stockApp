// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// 1) Zod schema: defines what a valid request body looks like
const registerSchema = z.object({
  email: z.string().email(),          // must be a valid email
  password: z.string().min(6).max(100), // 6–100 chars
});

// 2) Handle POST /api/auth/register
export async function POST(request: Request) {
  try {
    // Read JSON body
    const body = await request.json().catch(() => null);

    // Validate with Zod
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid input",
          issues: parseResult.error.issues, // list of validation problems
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // Check if user already exists (email is unique)
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash the password before storing it
    const passwordHash = await bcrypt.hash(password, 10); // 10 = salt rounds

    // Create the user in DB
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Return minimal user info (never return the hash)
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
