// app/api/dev/seed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This will run when someone sends a POST request to /api/dev/seed
export async function POST() {
  try {
    //clear existing data so we can re-run seed without duplicates
    await prisma.position.deleteMany();
    await prisma.account.deleteMany();
    await prisma.portfolioSnapshot.deleteMany();
    await prisma.user.deleteMany();

    //create a fake user
    const user = await prisma.user.create({
        data: {
            email: "demo@example.com",
            passwordHash: "fake-hash-for-now",
        },
    });

    //create fake account
    const account = await prisma.account.create({
        data: {
            userId: user.id,
            name: "E*TRADE Individual",
            broker: "ETRADE",
            externalAccountId: "demo-account-123",
            type: "TAXABLE",
            currency: "USD",
        },
    });

    //create fake position in that account
    const positions = await prisma.position.createMany({
      data: [
        {
          userId: user.id,
          accountId: account.id,
          symbol: "AAPL",
          name: "Apple Inc",
          assetType: "STOCK",
          quantity: 10,
          averageCost: 150,
          marketPrice: 180,
          marketValue: 10 * 180,
        },
        {
          userId: user.id,
          accountId: account.id,
          symbol: "VOO",
          name: "Vanguard S&P 500 ETF",
          assetType: "ETF",
          quantity: 5,
          averageCost: 400,
          marketPrice: 430,
          marketValue: 5 * 430,
        },
        {
          userId: user.id,
          accountId: account.id,
          symbol: "TSLA",
          name: "Tesla Inc",
          assetType: "STOCK",
          quantity: 3,
          averageCost: 200,
          marketPrice: 220,
          marketValue: 3 * 220,
        },
      ],
    });

    //create a portfolio snapshot
    const totalValue = 10 * 180 + 5 * 430 + 3 * 220;
    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        userId: user.id,
        totalValue,
      },
    });

    return NextResponse.json({
        ok: true,
        user,
        account,
        positionsCount: positions.count,
        snapshot,
    });


  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Seed Failed" },
      { status: 500 }
    );
  }
}
