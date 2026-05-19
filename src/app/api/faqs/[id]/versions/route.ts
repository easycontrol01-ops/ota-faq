import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faqVersions, faqs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const faqId = parseInt(id);

    const versions = await db
      .select()
      .from(faqVersions)
      .where(eq(faqVersions.faqId, faqId))
      .orderBy(desc(faqVersions.versionNumber));

    return NextResponse.json({ versions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Rollback to a specific version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const faqId = parseInt(id);
    const { versionId } = await request.json();

    const version = await db
      .select()
      .from(faqVersions)
      .where(eq(faqVersions.id, versionId))
      .limit(1);

    if (!version[0]) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    await db
      .update(faqs)
      .set({
        titleZh: version[0].titleZh,
        titleEn: version[0].titleEn,
        contentZh: version[0].contentZh,
        contentEn: version[0].contentEn,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(faqs.id, faqId));

    // Record this rollback as a new version
    const latest = await db
      .select()
      .from(faqVersions)
      .where(eq(faqVersions.faqId, faqId))
      .orderBy(desc(faqVersions.versionNumber))
      .limit(1);

    await db.insert(faqVersions).values({
      faqId,
      titleZh: version[0].titleZh,
      titleEn: version[0].titleEn,
      contentZh: version[0].contentZh,
      contentEn: version[0].contentEn,
      changeNote: `Rollback to version ${version[0].versionNumber}`,
      modifiedBy: user.id,
      versionNumber: (latest[0]?.versionNumber || 0) + 1,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
