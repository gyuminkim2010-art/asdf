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

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "관리자 권한이 필요합니다." },
        { status: 403 }
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

    await prisma.phraseItem.delete({
      where: { id: numericId },
    });

    return NextResponse.json({
      ok: true,
      message: "문구가 삭제되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "문구 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}