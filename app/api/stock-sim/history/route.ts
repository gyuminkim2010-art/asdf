import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function GET(req: NextRequest) {
  void req;
  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("session")?.value);
  if (!session) return NextResponse.json({ ok: false, error: "로그인 필요" }, { status: 401 });

  const trades = await prisma.stockTrade.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, trades });
}
