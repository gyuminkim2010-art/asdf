import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue, hashPassword } from "@/app/lib/auth-server";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = verifySessionValue(cookieStore.get("session")?.value);
  if (!session || session.role !== "admin") return null;
  return session;
}

/* ── PATCH: 닉네임 / 이메일 / 권한 / 비밀번호 초기화 ── */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ ok: false, message: "권한 없음" }, { status: 403 });

    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0)
      return NextResponse.json({ ok: false, message: "잘못된 ID" }, { status: 400 });

    const body = await request.json();
    const { action } = body as { action?: string };

    /* 닉네임 변경 */
    if (!action || action === "nickname") {
      const nickname = String(body.nickname ?? "").trim();
      if (!nickname) return NextResponse.json({ ok: false, message: "닉네임을 입력해주세요" }, { status: 400 });
      const user = await prisma.user.update({ where: { id: numericId }, data: { nickname }, select: { id: true, nickname: true } });
      return NextResponse.json({ ok: true, user, message: "닉네임이 변경되었습니다." });
    }

    /* 이메일 변경 */
    if (action === "email") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!email || !email.includes("@")) return NextResponse.json({ ok: false, message: "올바른 이메일을 입력해주세요" }, { status: 400 });
      const dup = await prisma.user.findFirst({ where: { email, NOT: { id: numericId } } });
      if (dup) return NextResponse.json({ ok: false, message: "이미 사용 중인 이메일입니다" }, { status: 400 });
      const user = await prisma.user.update({ where: { id: numericId }, data: { email }, select: { id: true, email: true } });
      return NextResponse.json({ ok: true, user, message: "이메일이 변경되었습니다." });
    }

    /* 권한 변경 */
    if (action === "role") {
      const role = String(body.role ?? "").trim();
      if (role !== "user" && role !== "admin") return NextResponse.json({ ok: false, message: "권한은 user 또는 admin" }, { status: 400 });
      // 자기 자신의 권한은 바꿀 수 없음
      if (numericId === session.userId) return NextResponse.json({ ok: false, message: "자신의 권한은 변경할 수 없습니다" }, { status: 400 });
      const user = await prisma.user.update({ where: { id: numericId }, data: { role }, select: { id: true, role: true } });
      return NextResponse.json({ ok: true, user, message: `권한이 ${role}로 변경되었습니다.` });
    }

    /* 비밀번호 초기화 */
    if (action === "resetPassword") {
      const newPassword = String(body.password ?? "").trim();
      if (newPassword.length < 4) return NextResponse.json({ ok: false, message: "비밀번호는 4자 이상" }, { status: 400 });
      const hashed = hashPassword(newPassword);
      await prisma.user.update({ where: { id: numericId }, data: { password: hashed } });
      return NextResponse.json({ ok: true, message: "비밀번호가 초기화되었습니다." });
    }

    return NextResponse.json({ ok: false, message: "알 수 없는 action" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}

/* ── DELETE: 사용자 삭제 ── */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ ok: false, message: "권한 없음" }, { status: 403 });

    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0)
      return NextResponse.json({ ok: false, message: "잘못된 ID" }, { status: 400 });

    if (numericId === session.userId)
      return NextResponse.json({ ok: false, message: "자신의 계정은 삭제할 수 없습니다" }, { status: 400 });

    await prisma.user.delete({ where: { id: numericId } });
    return NextResponse.json({ ok: true, message: "사용자가 삭제되었습니다." });
  } catch {
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}
