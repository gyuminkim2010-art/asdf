import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 50);

    const rankings = await prisma.rankingRecord.findMany({
      orderBy: [
        { elapsedSeconds: "asc" },
        { createdAt: "asc" },
      ],
      take: limit,
      include: {
        user: {
          select: {
            nickname: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, rankings });
  } catch {
    return NextResponse.json(
      { ok: false, message: "랭킹을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const session = verifySessionValue(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const score = Number(body.score);
    const totalCount = Number(body.totalCount);
    const elapsedSeconds = Number(body.elapsedSeconds);

    await prisma.rankingRecord.create({
      data: {
        userId: session.userId,
        score,
        totalCount,
        elapsedSeconds,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "랭킹 기록이 저장되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "랭킹 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}