import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function GET() {
  try {
    const items = await prisma.hanjaItem.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json(
      { ok: false, message: "한자 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const character = String(body.character || "").trim();
    const meaning = String(body.meaning || "").trim();
    const reading = String(body.reading || "").trim();

    if (!character || !meaning || !reading) {
      return NextResponse.json(
        { ok: false, message: "한자, 뜻, 음을 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    const item = await prisma.hanjaItem.create({
      data: {
        character,
        meaning,
        reading,
      },
    });

    return NextResponse.json({
      ok: true,
      item,
      message: "한자가 추가되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "한자 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}