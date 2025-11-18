// app/api/dev/holdings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
        where: { email: "demo@example.com" }
    });

    if(!user) {
        //Seed not run yet
        return NextResponse.json({ ok: false, error: "Demo user not found. Run POST /api/dev/seed first." },
        { status: 404 }
        );
    }

    //get all positions for that user including account info
    const positions = await prisma.position.findMany({
        where: { userId: user.id },
        include: {
            account: true,
        },
        orderBy: {
            symbol: "asc",
        },
    });

    //compute total portfolio value
    const totalValue = positions.reduce((sum,p) => sum + p.marketValue, 0);

    //shape a clean response for the frontend
    const responseData = {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
      totalValue,
      positions: positions.map((p) => ({
        id: p.id,
        symbol: p.symbol,
        name: p.name,
        assetType: p.assetType,
        quantity: p.quantity,
        averageCost: p.averageCost,
        marketPrice: p.marketPrice,
        marketValue: p.marketValue,
        account: {
          id: p.account.id,
          name: p.account.name,
          broker: p.account.broker,
          type: p.account.type,
        },
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to load holdings" },
      { status: 500 }
    );
  }
}
