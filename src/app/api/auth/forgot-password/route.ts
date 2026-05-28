import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { username, email } = await request.json();

    if (!username || !email) {
      return NextResponse.json({ error: "请填写用户名和邮箱" }, { status: 400 });
    }

    // Find user by username AND email
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.email, email)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "用户名与邮箱不匹配" }, { status: 400 });
    }

    const user = result[0];
    if (user.disabled) {
      return NextResponse.json({ error: "该账号已被禁用" }, { status: 400 });
    }

    // Generate new random password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let newPassword = "";
    for (let i = 0; i < 8; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        tempPassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      newPassword,
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json({ error: "重置失败，请重试" }, { status: 500 });
  }
}
