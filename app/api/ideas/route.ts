import { NextResponse } from "next/server";
import { getIdeas } from "@/services/ideas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const sort = (searchParams.get("sort") as "trending" | "popular" | "recent") || "recent";
    const query = searchParams.get("query") || undefined;

    const ideas = await getIdeas(category, sort, query);
    return NextResponse.json(ideas);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch ideas" }, { status: 500 });
  }
}
