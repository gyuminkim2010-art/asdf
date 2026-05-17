import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "uploads";

// GET: 게시글 목록
export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { userId: true, nickname: true } } },
  });

  const result = posts.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    grade: p.grade,
    subject: p.subject,
    fileName: p.fileName,
    date: p.date,
    authorId: p.author.userId,   // string userId for backward compat
    authorName: p.author.nickname,
    createdAt: p.createdAt,
  }));

  return NextResponse.json(result);
}

// POST: 게시글 등록 (파일 포함)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title      = formData.get("title")      as string;
    const content    = formData.get("content")    as string;
    const grade      = formData.get("grade")      as string;
    const subject    = formData.get("subject")    as string;
    const authorId   = formData.get("authorId")   as string; // string userId
    const authorName = formData.get("authorName") as string;
    const file       = formData.get("file")       as File | null;

    // boardUser 조회
    const boardUser = await prisma.boardUser.findUnique({ where: { userId: authorId } });
    if (!boardUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    let fileName = "";
    if (file && file.size > 0) {
      const ext = file.name.split(".").pop();
      const storagePath = `${Date.now()}_${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, arrayBuffer, { contentType: file.type });
      if (!uploadError) {
        fileName = storagePath;
      }
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        grade:    grade    ?? "",
        subject:  subject  ?? "",
        fileName: fileName,
        date:     new Date().toLocaleDateString("ko-KR"),
        authorId: boardUser.id,
      },
    });

    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.content,
      grade: post.grade,
      subject: post.subject,
      fileName: post.fileName,
      date: post.date,
      authorId,
      authorName,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  }
}

// DELETE: 게시글 삭제 (본인 확인)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id     = Number(searchParams.get("id"));
    const userId = searchParams.get("userId") as string; // string userId

    const boardUser = await prisma.boardUser.findUnique({ where: { userId } });
    if (!boardUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "글 없음" }, { status: 404 });
    }
    if (post.authorId !== boardUser.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // Supabase Storage 파일 삭제
    if (post.fileName) {
      await supabase.storage.from(BUCKET).remove([post.fileName]);
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
