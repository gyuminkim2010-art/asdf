import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = String(searchParams.get("category") || "").trim();

    const items = await prisma.phraseItem.findMany({
      where: category ? { category } : undefined,
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json(
      { ok: false, message: "문구 데이터를 불러오는 중 오류가 발생했습니다." },
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

    const category = String(body.category || "").trim();
    const title = String(body.title || "").trim();
    const hanjaText = String(body.hanjaText || "").trim();
    const koreanText = String(body.koreanText || "").trim();
    const hanjaTokens = String(body.hanjaTokens || "").trim();
    const koreanTokens = String(body.koreanTokens || "").trim();

    if (
      !category ||
      !hanjaText ||
      !koreanText ||
      !hanjaTokens ||
      !koreanTokens
    ) {
      return NextResponse.json(
        { ok: false, message: "필수 항목을 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    const item = await prisma.phraseItem.create({
      data: {
        category,
        title: title || null,
        hanjaText,
        koreanText,
        hanjaTokens,
        koreanTokens,
      },
    });

    return NextResponse.json({
      ok: true,
      item,
      message: "문구가 추가되었습니다.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "문구 추가 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}