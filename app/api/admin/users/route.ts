import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const session = verifySessionValue(sessionCookie);

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
        loginCount: true,
        totalStudySeconds: true,
        totalAnswers: true,
        correctAnswers: true,
      },
    });

    return NextResponse.json({ ok: true, users });
  } catch {
    return NextResponse.json(
      { ok: false, message: "사용자 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}