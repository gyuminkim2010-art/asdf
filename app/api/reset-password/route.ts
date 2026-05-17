import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";
import { generateVerifyCode, sendVerifyEmail } from "@/app/lib/email";

// 코드 요청
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();

    if (!email) {
      return NextResponse.json({ ok: false, message: "이메일을 입력해 주세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // 보안상 존재 여부를 알려주지 않음
    if (!user) {
      return NextResponse.json({ ok: true, message: "인증 코드를 발송했습니다." });
    }

    const code = generateVerifyCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetCode: code, resetCodeExpiry: expiry },
    });

    await sendResetEmail(email, code);

    return NextResponse.json({ ok: true, message: "인증 코드를 발송했습니다." });
  } catch {
    return NextResponse.json({ ok: false, message: "코드 발송 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 코드 확인 + 비밀번호 변경
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "").trim();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ ok: false, message: "모든 항목을 입력해 주세요." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ ok: false, message: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return NextResponse.json({ ok: false, message: "인증 코드가 없습니다. 다시 요청해 주세요." }, { status: 400 });
    }

    if (new Date() > user.resetCodeExpiry) {
      return NextResponse.json({ ok: false, message: "인증 코드가 만료되었습니다. 다시 요청해 주세요." }, { status: 400 });
    }

    if (user.resetCode !== code) {
      return NextResponse.json({ ok: false, message: "인증 코드가 올바르지 않습니다." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetCode: null,
        resetCodeExpiry: null,
      },
    });

    return NextResponse.json({ ok: true, message: "비밀번호가 변경되었습니다." });
  } catch {
    return NextResponse.json({ ok: false, message: "비밀번호 변경 중 오류가 발생했습니다." }, { status: 500 });
  }
}

async function sendResetEmail(to: string, code: string) {
  const { default: nodemailer } = await import("nodemailer");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Project.noNAME" <${process.env.GMAIL_USER}>`,
    to,
    subject: "[한자퀴즈] 비밀번호 재설정 코드",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f6f5f1;border-radius:24px;">
        <h2 style="font-size:24px;font-weight:900;color:#171717;margin:0 0 8px;">비밀번호 재설정</h2>
        <p style="color:#666;margin:0 0 24px;font-size:14px;">아래 6자리 코드를 입력해 비밀번호를 재설정해 주세요.<br>코드는 10분간 유효합니다.</p>
        <div style="background:#fff;border-radius:16px;padding:24px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:900;color:#171717;border:1px solid #e5e5e5;">
          ${code}
        </div>
        <p style="color:#aaa;font-size:12px;margin:24px 0 0;text-align:center;">본인이 요청하지 않은 경우 이 메일을 무시하세요.</p>
      </div>
    `,
  });
}
