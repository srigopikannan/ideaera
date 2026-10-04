import { NextResponse } from "next/server";
import { archiveIdea } from "@/services/ideas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await archiveIdea(id);
    return NextResponse.json({
      success: true,
      action: "archived",
      message: res.message || "Idea archived successfully",
    });
  } catch (err: any) {
    const msg = err?.message || "Failed to archive idea";
    const status = msg.includes("Unauthorized")
      ? 403
      : msg.includes("logged in")
      ? 401
      : msg.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
