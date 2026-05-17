import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue, hashPassword } from "@/app/lib/auth-server";

export async function GET() {
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

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
        loginCount: true,
        totalStudySeconds: true,
        totalAnswers: true,
        correctAnswers: true,
      },
    });

    return NextResponse.json({ ok: true, users });
  } catch {
    return NextResponse.json(
      { ok: false, message: "사용자 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/* ── POST: 관리자가 직접 계정 생성 ── */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = verifySessionValue(cookieStore.get("session")?.value);
    if (!session || session.role !== "admin")
      return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });

    const body = await request.json();
    const email    = String(body.email    ?? "").trim().toLowerCase();
    const nickname = String(body.nickname ?? "").trim();
    const password = String(body.password ?? "").trim();
    const role     = body.role === "admin" ? "admin" : "user";

    if (!email || !email.includes("@"))
      return NextResponse.json({ ok: false, message: "올바른 이메일을 입력해주세요." }, { status: 400 });
    if (!nickname)
      return NextResponse.json({ ok: false, message: "닉네임을 입력해주세요." }, { status: 400 });
    if (password.length < 4)
      return NextResponse.json({ ok: false, message: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });

    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup)
      return NextResponse.json({ ok: false, message: "이미 사용 중인 이메일입니다." }, { status: 409 });

    const hashed = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email, nickname, role,
        password: hashed,
        emailVerified: true,   // 관리자 생성 계정은 인증 불필요
        totalStudySeconds: 0,
        totalAnswers: 0,
        correctAnswers: 0,
      },
      select: { id: true, email: true, nickname: true, role: true },
    });

    return NextResponse.json({ ok: true, user, message: "계정이 생성되었습니다." });
  } catch {
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}