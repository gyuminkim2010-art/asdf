import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("session")?.value);
  if (!session || session.role !== "admin") return null;
  return session;
}

// GET: 모든 유저 포트폴리오 목록
export async function GET(req: NextRequest) {
  void req;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, nickname: true, createdAt: true,
      stockPortfolio: { include: { holdings: true } },
      stockTrades: { orderBy: { createdAt: "desc" }, take: 20 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, users });
}

// PATCH: 현금 수정 / 보유종목 추가·수정
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 403 });

  const body = await req.json();
  const { action } = body as { action?: string };

  /* ── 현금 수정 (기존) ── */
  if (!action || action === "cash") {
    const { userId, cash } = body as { userId: number; cash: number };
    if (!userId || cash == null || cash < 0)
      return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });

    const existing = await prisma.stockPortfolio.findUnique({ where: { userId } });
    if (existing) {
      await prisma.stockPortfolio.update({ where: { userId }, data: { cash } });
    } else {
      await prisma.stockPortfolio.create({ data: { userId, cash } });
    }
    return NextResponse.json({ ok: true });
  }

  /* ── 포트폴리오 강제 생성 ── */
  if (action === "createPortfolio") {
    const { userId } = body as { userId: number };
    const exists = await prisma.stockPortfolio.findUnique({ where: { userId } });
    if (!exists) {
      await prisma.stockPortfolio.create({ data: { userId, cash: 2_000_000 } });
    }
    return NextResponse.json({ ok: true });
  }

  /* ── 보유종목 추가 ── */
  if (action === "addHolding") {
    const { userId, ticker, name, market, quantity, avgPrice } =
      body as { userId: number; ticker: string; name: string; market: string; quantity: number; avgPrice: number };

    if (!userId || !ticker || quantity <= 0 || avgPrice <= 0)
      return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });

    let portfolio = await prisma.stockPortfolio.findUnique({ where: { userId } });
    if (!portfolio) {
      portfolio = await prisma.stockPortfolio.create({ data: { userId, cash: 2_000_000 } });
    }

    const existing = await prisma.stockHolding.findUnique({
      where: { portfolioId_ticker: { portfolioId: portfolio.id, ticker } },
    });

    if (existing) {
      // 이미 있으면 평균단가 재계산 후 수량 합산
      const newQty  = existing.quantity + quantity;
      const newAvg  = (existing.avgPrice * existing.quantity + avgPrice * quantity) / newQty;
      await prisma.stockHolding.update({
        where: { id: existing.id },
        data: { quantity: newQty, avgPrice: newAvg },
      });
    } else {
      await prisma.stockHolding.create({
        data: { portfolioId: portfolio.id, ticker, name, market, quantity, avgPrice },
      });
    }
    return NextResponse.json({ ok: true });
  }

  /* ── 보유종목 수정 (수량·평균단가) ── */
  if (action === "editHolding") {
    const { holdingId, quantity, avgPrice } =
      body as { holdingId: number; quantity: number; avgPrice: number };

    if (!holdingId || quantity <= 0 || avgPrice <= 0)
      return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });

    await prisma.stockHolding.update({
      where: { id: holdingId },
      data: { quantity, avgPrice },
    });
    return NextResponse.json({ ok: true });
  }

  /* ── 현금 일괄 재계산 (거래 내역 기반) ── */
  if (action === "recalcCash") {
    // exRate: 재계산에 사용할 환율 (클라이언트가 현재 환율 전달)
    const { exRate } = body as { exRate?: number };
    const rate = exRate && exRate > 0 ? exRate : 1380;

    // 포트폴리오가 있는 모든 유저 + 전체 거래내역 가져오기
    const allUsers = await prisma.user.findMany({
      where: { stockPortfolio: { isNot: null } },
      select: {
        id: true,
        stockPortfolio: { select: { id: true } },
        stockTrades: { select: { market: true, type: true, total: true } },
      },
    });

    const updates: Promise<unknown>[] = [];
    const results: { userId: number; oldCash?: number; newCash: number }[] = [];

    for (const u of allUsers) {
      if (!u.stockPortfolio) continue;

      // 거래 내역으로 현금 역산
      let cash = 2_000_000;
      for (const t of u.stockTrades) {
        const isUSD  = t.market !== "KR";
        const krwAmt = isUSD ? t.total * rate : t.total;
        if (t.type === "BUY")  cash -= krwAmt;
        if (t.type === "SELL") cash += krwAmt;
      }
      cash = Math.round(Math.max(0, cash)); // 음수 방지

      results.push({ userId: u.id, newCash: cash });
      updates.push(
        prisma.stockPortfolio.update({
          where: { id: u.stockPortfolio.id },
          data: { cash },
        })
      );
    }

    await Promise.all(updates);
    return NextResponse.json({ ok: true, updated: results.length, results });
  }

  return NextResponse.json({ ok: false, error: "알 수 없는 action" }, { status: 400 });
}

// DELETE: 포트폴리오 전체 초기화 / 보유종목 삭제 / 거래내역 삭제
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const target    = searchParams.get("target") ?? "portfolio"; // "portfolio" | "holding" | "trade"
  const userId    = Number(searchParams.get("userId") || 0);
  const holdingId = Number(searchParams.get("holdingId") || 0);
  const tradeId   = Number(searchParams.get("tradeId") || 0);

  if (target === "holding" && holdingId) {
    await prisma.stockHolding.delete({ where: { id: holdingId } });
    return NextResponse.json({ ok: true });
  }

  if (target === "trade" && tradeId) {
    await prisma.stockTrade.delete({ where: { id: tradeId } });
    return NextResponse.json({ ok: true });
  }

  // 기본: 포트폴리오 전체 초기화
  if (!userId) return NextResponse.json({ ok: false, error: "userId 필요" }, { status: 400 });
  await prisma.stockPortfolio.deleteMany({ where: { userId } });
  await prisma.stockTrade.deleteMany({ where: { userId } });

  return NextResponse.json({ ok: true });
}
