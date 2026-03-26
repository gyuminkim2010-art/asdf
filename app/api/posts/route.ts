import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const postsFilePath = path.join(process.cwd(), "posts.json");
const uploadDir = path.join(process.cwd(), "public/uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// GET: 게시글 목록
export async function GET() {
  const fileData = fs.readFileSync(postsFilePath, "utf-8");
  return NextResponse.json(JSON.parse(fileData));
}

// POST: 게시글 등록 (파일 포함)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const grade = formData.get("grade") as string;
    const subject = formData.get("subject") as string;
    const authorId = formData.get("authorId") as string;
    const authorName = formData.get("authorName") as string;
    const file = formData.get("file") as File | null;

    let fileName = "";
    if (file) {
      fileName = `${Date.now()}_${file.name}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    }

    const posts = JSON.parse(fs.readFileSync(postsFilePath, "utf-8"));
    const newPost = {
      id: Date.now(),
      title, content, grade, subject, authorId, authorName, fileName,
      date: new Date().toLocaleDateString(),
    };

    posts.unshift(newPost);
    fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
    return NextResponse.json(newPost);
  } catch (err) {
    return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  }
}

// DELETE: 게시글 삭제 (본인 확인)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const userId = searchParams.get("userId");

    const posts = JSON.parse(fs.readFileSync(postsFilePath, "utf-8"));
    const postIndex = posts.findIndex((p: any) => p.id === id);

    if (postIndex === -1) return NextResponse.json({ error: "글 없음" }, { status: 404 });
    
    // 💡 권한 검사: 글의 저자와 요청자가 같은지 확인
    if (posts[postIndex].authorId !== userId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    posts.splice(postIndex, 1);
    fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}