import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function GET() {
  try {
    const items = await prisma.stockHanja.findMany({ orderBy: { id: "asc" } });
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
    const character = String(body.character || "").trim();
    const meaning   = String(body.meaning   || "").trim();
    const reading   = String(body.reading   || "").trim();

    if (!character || !meaning || !reading) {
      return NextResponse.json({ ok: false, message: "한자, 뜻, 음을 모두 입력해 주세요." }, { status: 400 });
    }

    const item = await prisma.stockHanja.create({ data: { character, meaning, reading } });
    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ ok: false, message: "추가 실패" }, { status: 500 });
  }
}
