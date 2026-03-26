import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: "admin@test.com",
    },
  });

  if (existingUser) {
    return NextResponse.json(existingUser);
  }

  const user = await prisma.user.create({
    data: {
      email: "admin@test.com",
      password: "1234",
      nickname: "관리자",
      role: "admin",
    },
  });

  return NextResponse.json(user);
}