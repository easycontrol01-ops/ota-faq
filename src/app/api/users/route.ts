import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { username, email, password, role } = await request.json();
    const passwordHash = hashPassword(password);

    const result = await db
      .insert(users)
      .values({ username, email, passwordHash, role: role || "employee" })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
      });

    return NextResponse.json({ user: result[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
