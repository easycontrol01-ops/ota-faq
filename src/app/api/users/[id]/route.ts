import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    const { role, disabled, password, tempPassword } = await request.json();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (role !== undefined) updateData.role = role;
    if (disabled !== undefined) updateData.disabled = disabled;
    if (password) {
      updateData.passwordHash = hashPassword(password);
      updateData.tempPassword = tempPassword !== undefined ? tempPassword : true;
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    await db.delete(users).where(eq(users.id, userId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
