import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";
import { defaultHanjaData } from "@/app/lib/hanja-data";

export async function POST() {
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

    await prisma.hanjaItem.deleteMany();

    await prisma.hanjaItem.createMany({
      data: defaultHanjaData.map((item) => ({
        character: item.character,
        meaning: item.meaning,
        reading: item.reading,
      })),
    });

    return NextResponse.json({
      ok: true,
      message: "기본 한자 목록으로 초기화되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "초기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}