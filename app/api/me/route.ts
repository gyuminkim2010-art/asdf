import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  const session = verifySessionValue(sessionCookie);

  if (!session) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, user });
  
  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}