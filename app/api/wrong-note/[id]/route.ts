import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_: Request, { params }: Params) {
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

    const { id } = await params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId)) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    await prisma.wrongAnswerNote.deleteMany({
      where: {
        id: numericId,
        userId: session.userId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "오답이 삭제되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "오답 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}