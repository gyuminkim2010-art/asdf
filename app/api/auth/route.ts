import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { type, userId, password, userName } = await req.json();

  if (type === "register") {
    const existing = await prisma.boardUser.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: "이미 존재하는 아이디입니다." }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.boardUser.create({
      data: { userId, password: hashedPassword, nickname: userName },
    });
    return NextResponse.json({ ok: true });
  }

  if (type === "login") {
    const user = await prisma.boardUser.findUnique({ where: { userId } });
    if (!user) {
      return NextResponse.json({ error: "아이디를 찾을 수 없습니다." }, { status: 400 });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, user: { userId: user.userId, userName: user.nickname } });
  }

  return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
}
