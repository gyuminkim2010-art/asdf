import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  try {
    const cookieStore = await cookies();
    const session = verifySessionValue(cookieStore.get("session")?.value);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
    }
    const { id } = await params;
    await prisma.stockHanja.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "삭제 실패" }, { status: 500 });
  }
}
