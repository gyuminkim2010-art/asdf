import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";
import { generateVerifyCode, sendVerifyEmail } from "@/app/lib/email";

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

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // 미인증 상태면 코드 재발송
      if (!existing.emailVerified) {
        const code = generateVerifyCode();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.user.update({
          where: { id: existing.id },
          data: { verifyCode: code, verifyCodeExpiry: expiry },
        });
        await sendVerifyEmail(email, code);
        return NextResponse.json(
          { ok: false, needVerify: true, email, message: "이미 가입된 이메일입니다. 인증 코드를 재발송했습니다." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, message: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateVerifyCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        role: "user",
        emailVerified: false,
        verifyCode: code,
        verifyCodeExpiry: expiry,
        totalStudySeconds: 0,
        totalAnswers: 0,
        correctAnswers: 0,
      },
    });

    await sendVerifyEmail(email, code);

    return NextResponse.json({
      ok: true,
      needVerify: true,
      email,
      message: "회원가입이 완료되었습니다. 이메일로 발송된 인증 코드를 입력해 주세요.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
