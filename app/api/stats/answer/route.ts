import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const session = verifySessionValue(sessionCookie);

    if (!session) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = await request.json();
    const correct = Boolean(body.correct);

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        totalAnswers: {
          increment: 1,
        },
        correctAnswers: correct
          ? {
              increment: 1,
            }
          : undefined,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "정답 통계 기록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}