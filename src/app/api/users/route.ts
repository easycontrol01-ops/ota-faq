import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const userList = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        disabled: users.disabled,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.id));

    return NextResponse.json({ users: userList });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { username, email, password, role, tempPassword } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "请填写所有必填字段" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    const result = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
        role: role || "employee",
        tempPassword: tempPassword !== false,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
      });

    return NextResponse.json({ user: result[0] });
  } catch (e: unknown) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "用户名或邮箱已存在" }, { status: 400 });
    }
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
