import { NextResponse } from "next/server";
import { deleteIdea, archiveIdea, getIdeaById } from "@/services/ideas";

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
    const res = await deleteIdea(id);
    return NextResponse.json({ success: true, message: "Idea deleted successfully", action: res.action });
  } catch (err: any) {
    if (err?.code === "IDEA_HAS_DEPENDENCIES") {
      return NextResponse.json(
        {
          success: false,
          code: "IDEA_HAS_DEPENDENCIES",
          message: err.message,
          dependencies: err.dependencies,
        },
        { status: 409 }
      );
    }

    const msg = err?.message || "Failed to delete idea";
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (body.action === "archive") {
      const res = await archiveIdea(id);
      return NextResponse.json({
        success: true,
        message: res.message || "Idea archived successfully",
        action: "archived",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action specified." },
      { status: 400 }
    );
  } catch (err: any) {
    const msg = err?.message || "Failed to update idea";
    const status = msg.includes("Unauthorized")
      ? 403
      : msg.includes("logged in")
      ? 401
      : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
