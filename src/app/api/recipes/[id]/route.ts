import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const { data, error } = await supabase.from("recipes").select("*").eq("id", id).single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // 배열 필드 파싱
  const parsed = {
    ...data,
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : JSON.parse(data.ingredients || "[]"),
    instructions: Array.isArray(data.instructions) ? data.instructions : JSON.parse(data.instructions || "[]"),
    tags: Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags || "[]"),
    tips: Array.isArray(data.tips) ? data.tips : JSON.parse(data.tips || "[]"),
  };
  return NextResponse.json(parsed);
}
