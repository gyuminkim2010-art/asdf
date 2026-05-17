import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

async function getSession(req: NextRequest) {
  void req;
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get("session")?.value);
}

// GET: 내 포트폴리오 조회 (없으면 자동 생성)
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ ok: false, error: "로그인 필요" }, { status: 401 });

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

  return NextResponse.json({ ok: true, portfolio });
}
