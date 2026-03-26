import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionValue } from "@/app/lib/auth-server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const session = verifySessionValue(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const notes = await prisma.wrongAnswerNote.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ ok: true, notes });
  } catch {
    return NextResponse.json(
      { ok: false, message: "오답노트를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const session = verifySessionValue(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const contentType = String(body.contentType || "").trim();
    const contentId = Number(body.contentId);
    const questionText = String(body.questionText || "").trim();
    const questionPrompt = String(body.questionPrompt || "").trim();
    const correctAnswer = String(body.correctAnswer || "").trim();
    const selectedAnswer = String(body.selectedAnswer || "").trim();

    if (
      !contentType ||
      !Number.isInteger(contentId) ||
      !questionText ||
      !questionPrompt ||
      !correctAnswer ||
      !selectedAnswer
    ) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    await prisma.wrongAnswerNote.upsert({
      where: {
        userId_contentType_contentId: {
          userId: session.userId,
          contentType,
          contentId,
        },
      },
      update: {
        selectedAnswer,
        correctAnswer,
        questionText,
        questionPrompt,
        createdAt: new Date(),
      },
      create: {
        userId: session.userId,
        contentType,
        contentId,
        questionText,
        questionPrompt,
        correctAnswer,
        selectedAnswer,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "오답노트에 저장되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "오답노트 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const session = verifySessionValue(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    await prisma.wrongAnswerNote.deleteMany({
      where: {
        userId: session.userId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "오답노트가 전체 삭제되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "오답노트 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}