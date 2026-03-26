import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createSessionValue, hashPassword } from "@/app/lib/auth-server";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "").trim();
    const nickname = String(body.nickname || "").trim();

    if (!email || !password || !nickname) {
      return NextResponse.json(
        { ok: false, message: "이메일, 비밀번호, 닉네임을 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        role: "user",
        loginCount: 1,
        lastSeenAt: new Date(),
        totalStudySeconds: 0,
        totalAnswers: 0,
        correctAnswers: 0,
      },
    });

    const session = createSessionValue({
      userId: user.id,
      role: user.role,
      nickname: user.nickname,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
      message: "회원가입이 완료되었습니다.",
    });

    response.cookies.set("session", session, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, message: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}