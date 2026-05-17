import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function GET() {
  try {
    const items = await prisma.stockNewsQuestion.findMany({ orderBy: { id: "desc" } });
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: false, message: "불러오기 실패" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = verifySessionValue(cookieStore.get("session")?.value);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const newsTitle    = String(body.newsTitle    || "").trim();
    const newsExcerpt  = String(body.newsExcerpt  || "").trim();
    const question     = String(body.question     || "").trim();
    const answer       = String(body.answer       || "").trim();
    const wrongAnswer1 = String(body.wrongAnswer1 || "").trim();
    const wrongAnswer2 = String(body.wrongAnswer2 || "").trim();
    const wrongAnswer3 = String(body.wrongAnswer3 || "").trim();
    const source       = String(body.source       || "").trim();

    if (!newsTitle || !newsExcerpt || !question || !answer || !wrongAnswer1 || !wrongAnswer2 || !wrongAnswer3) {
      return NextResponse.json({ ok: false, message: "모든 항목을 입력해 주세요." }, { status: 400 });
    }

    const item = await prisma.stockNewsQuestion.create({
      data: { newsTitle, newsExcerpt, question, answer, wrongAnswer1, wrongAnswer2, wrongAnswer3, source },
    });
    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ ok: false, message: "추가 실패" }, { status: 500 });
  }
}
