import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("session")?.value);
  if (!session) return NextResponse.json({ ok: false, error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const { ticker, name, market, type, quantity, price, exRate } = body as {
    ticker: string; name: string; market: string;
    type: "BUY" | "SELL"; quantity: number; price: number;
    exRate?: number;
  };

  if (!ticker || !type || quantity <= 0 || price <= 0) {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }

  // price·total 은 원래 통화(KRW or USD) 기준으로 저장
  const total = Math.round(price * quantity * 100) / 100;

  // cash 는 항상 KRW로 관리 — USD 종목은 환율로 환산
  const isUSD   = market !== "KR";
  const rate     = (isUSD && exRate && exRate > 0) ? exRate : 1380; // fallback
  const totalKRW = isUSD ? Math.round(price * quantity * rate) : Math.round(total);

  // 포트폴리오 가져오기 (없으면 생성)
  let portfolio = await prisma.stockPortfolio.findUnique({
    where: { userId: session.userId },
    include: { holdings: true },
  });
  if (!portfolio) {
    portfolio = await prisma.stockPortfolio.create({
      data: { userId: session.userId, cash: 2_000_000 },
      include: { holdings: true },
    });
  }

  if (type === "BUY") {
    if (portfolio.cash < totalKRW) {
      return NextResponse.json({ ok: false, error: "잔액이 부족합니다" }, { status: 400 });
    }

    const existing = portfolio.holdings.find(h => h.ticker === ticker);

    await prisma.$transaction([
      // 현금 차감 (항상 KRW 기준)
      prisma.stockPortfolio.update({
        where: { id: portfolio.id },
        data: { cash: portfolio.cash - totalKRW },
      }),
      // 보유 종목 업데이트 또는 생성
      existing
        ? prisma.stockHolding.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + quantity,
              avgPrice: (existing.avgPrice * existing.quantity + total) / (existing.quantity + quantity),
            },
          })
        : prisma.stockHolding.create({
            data: { portfolioId: portfolio.id, ticker, name, market, quantity, avgPrice: price },
          }),
      // 거래 내역
      prisma.stockTrade.create({
        data: { userId: session.userId, ticker, name, market, type: "BUY", quantity, price, total },
      }),
    ]);
  } else {
    // SELL
    const existing = portfolio.holdings.find(h => h.ticker === ticker);
    if (!existing || existing.quantity < quantity) {
      return NextResponse.json({ ok: false, error: "보유 수량이 부족합니다" }, { status: 400 });
    }

    const newQty = existing.quantity - quantity;

    await prisma.$transaction([
      // 현금 추가 (항상 KRW 기준)
      prisma.stockPortfolio.update({
        where: { id: portfolio.id },
        data: { cash: portfolio.cash + totalKRW },
      }),
      newQty === 0
        ? prisma.stockHolding.delete({ where: { id: existing.id } })
        : prisma.stockHolding.update({
            where: { id: existing.id },
            data: { quantity: newQty },
          }),
      prisma.stockTrade.create({
        data: { userId: session.userId, ticker, name, market, type: "SELL", quantity, price, total },
      }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
