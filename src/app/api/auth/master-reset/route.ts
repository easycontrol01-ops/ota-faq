import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Master reset key - configurable via environment variable
const MASTER_RESET_KEY = process.env.MASTER_RESET_KEY || "ota-master-reset-2026";
const DEFAULT_PASSWORD = "Abup2026";

export async function POST(request: NextRequest) {
  try {
    const { resetKey, username } = await request.json();

    if (!resetKey || !username) {
      return NextResponse.json({ error: "请填写安全重置口令和用户名" }, { status: 400 });
    }

    // Verify master reset key
    if (resetKey !== MASTER_RESET_KEY) {
      return NextResponse.json({ error: "安全重置口令错误" }, { status: 403 });
    }

    // Find the user
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // Reset password
    const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        tempPassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, result[0].id));

    return NextResponse.json({
      success: true,
      message: `用户 ${username} 的密码已重置为默认密码，请尽快登录修改`,
    });
  } catch (e) {
    console.error("Master reset error:", e);
    return NextResponse.json({ error: "重置失败" }, { status: 500 });
  }
}
