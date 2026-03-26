import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
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

    const { id } = await params;
    const numericId = Number(id);
    const body = await request.json();
    const nickname = String(body.nickname || "").trim();

    if (!Number.isInteger(numericId) || !nickname) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: numericId },
      data: { nickname },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user,
      message: "닉네임이 변경되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "닉네임 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}