import { NextResponse } from "next/server";
import { deleteIdea, getIdeaById } from "@/services/ideas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idea = await getIdeaById(id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    return NextResponse.json(idea);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch idea" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteIdea(id);
    return NextResponse.json({ success: true, message: "Idea deleted successfully" });
  } catch (err: any) {
    const msg = err?.message || "Failed to delete idea";
    const status = msg.includes("Unauthorized")
      ? 403
      : msg.includes("logged in")
      ? 401
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
