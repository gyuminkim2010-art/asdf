import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

// GET: 모든 유저 포트폴리오 + 거래내역 (랭킹용) — 로그인 필요
export async function GET(req: NextRequest) {
  void req;
  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("session")?.value);
  if (!session) return NextResponse.json({ ok: false, error: "로그인 필요" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { stockPortfolio: { isNot: null } },
    select: {
      id: true,
      nickname: true,
      _count: { select: { stockTrades: true } },
      stockPortfolio: { include: { holdings: true } },
      stockTrades: {
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true, ticker: true, name: true, market: true,
          type: true, quantity: true, price: true, total: true, createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = users.map(u => ({
    id:             u.id,
    nickname:       u.nickname,
    tradeCount:     u._count.stockTrades,
    stockPortfolio: u.stockPortfolio,
    stockTrades:    u.stockTrades,
  }));

  return NextResponse.json({ ok: true, users: result });
}
