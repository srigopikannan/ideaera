import { NextResponse } from "next/server";
import { deleteProject, getProjectBySlug } from "@/services/projects";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectBySlug(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch project" },
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
    await deleteProject(id);
    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (err: any) {
    const msg = err?.message || "Failed to delete project";
    const status = msg.includes("Unauthorized")
      ? 403
      : msg.includes("logged in")
      ? 401
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
