import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createSessionValue } from "@/app/lib/auth-server";
import { generateVerifyCode, sendVerifyEmail } from "@/app/lib/email";

// 코드 확인
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const code = String(body.code || "").trim();

    if (!email || !code) {
      return NextResponse.json({ ok: false, message: "이메일과 코드를 입력해 주세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ ok: false, message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: false, message: "이미 인증된 계정입니다." }, { status: 400 });
    }

    if (!user.verifyCode || !user.verifyCodeExpiry) {
      return NextResponse.json({ ok: false, message: "인증 코드가 없습니다. 다시 요청해 주세요." }, { status: 400 });
    }

    if (new Date() > user.verifyCodeExpiry) {
      return NextResponse.json({ ok: false, message: "인증 코드가 만료되었습니다. 다시 요청해 주세요." }, { status: 400 });
    }

    if (user.verifyCode !== code) {
      return NextResponse.json({ ok: false, message: "인증 코드가 올바르지 않습니다." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyCode: null,
        verifyCodeExpiry: null,
        lastSeenAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    const session = createSessionValue({
      userId: updatedUser.id,
      role: updatedUser.role,
      nickname: updatedUser.nickname,
    });

    const response = NextResponse.json({
      ok: true,
      message: "이메일 인증이 완료되었습니다.",
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
    return NextResponse.json({ ok: false, message: "인증 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 코드 재발송
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();

    if (!email) {
      return NextResponse.json({ ok: false, message: "이메일을 입력해 주세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ ok: false, message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: false, message: "이미 인증된 계정입니다." }, { status: 400 });
    }

    const code = generateVerifyCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyCode: code, verifyCodeExpiry: expiry },
    });

    await sendVerifyEmail(email, code);

    return NextResponse.json({ ok: true, message: "인증 코드를 재발송했습니다." });
  } catch {
    return NextResponse.json({ ok: false, message: "코드 발송 중 오류가 발생했습니다." }, { status: 500 });
  }
}
