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
    const seconds = Number(body.seconds ?? 0);

    if (!Number.isFinite(seconds) || seconds <= 0) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const safeSeconds = Math.min(Math.floor(seconds), 60);

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        totalStudySeconds: {
          increment: safeSeconds,
        },
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "활동 시간 기록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}