import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const usersPath = path.join(process.cwd(), "users.json");

const readUsers = () => {
  if (!fs.existsSync(usersPath)) return [];
  return JSON.parse(fs.readFileSync(usersPath, "utf8") || "[]");
};

export async function POST(req: Request) {
  const { type, userId, password, userName } = await req.json();
  const users = readUsers();

  if (type === "register") {
    if (users.find((u: any) => u.userId === userId)) {
      return NextResponse.json({ error: "이미 존재하는 아이디입니다." }, { status: 400 });
    }
    // 비밀번호 암호화 (Salt 10회)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { userId, password: hashedPassword, userName };
    fs.writeFileSync(usersPath, JSON.stringify([...users, newUser], null, 2));
    return NextResponse.json({ ok: true });
  }

  if (type === "login") {
    const user = users.find((u: any) => u.userId === userId);
    if (!user) return NextResponse.json({ error: "아이디를 찾을 수 없습니다." }, { status: 400 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 400 });

    return NextResponse.json({ ok: true, user: { userId: user.userId, userName: user.userName } });
  }
}