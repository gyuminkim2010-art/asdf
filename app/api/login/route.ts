import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createSessionValue } from "@/app/lib/auth-server";
import bcrypt from "bcrypt";
import { generateVerifyCode, sendVerifyEmail } from "@/app/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "이메일과 비밀번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      const code = generateVerifyCode();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { verifyCode: code, verifyCodeExpiry: expiry },
      });
      await sendVerifyEmail(email, code);
      return NextResponse.json(
        { ok: false, needVerify: true, email, message: "이메일 인증이 필요합니다. 인증 코드를 발송했습니다." },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastSeenAt: new Date(),
        loginCount: {
          increment: 1,
        },
      },
    });

    const session = createSessionValue({
      userId: updatedUser.id,
      role: updatedUser.role,
      nickname: updatedUser.nickname,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nickname: updatedUser.nickname,
        role: updatedUser.role,
      },
      message: "로그인이 완료되었습니다.",
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
      { ok: false, message: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}