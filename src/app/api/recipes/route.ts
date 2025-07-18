import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET() {
  const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 배열 필드는 JSON 문자열로 저장
    const insertData = {
      ...body,
      author_email: body.authorEmail,
      created_by: body.createdBy,
      cooking_time: body.cookingTime ?? body.cooking_time ?? 0,
      ingredients: JSON.stringify(body.ingredients ?? []),
      instructions: JSON.stringify(body.instructions ?? []),
      tags: body.tags ?? [],
      tips: body.tips ?? [],
    };
    delete insertData.authorEmail;
    delete insertData.createdBy;
    delete insertData.cookingTime;
    const { data, error } = await supabase.from("recipes").insert([insertData]).select().single();
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // 배열 필드 파싱해서 반환
    const parsed = {
      ...data,
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : JSON.parse(data.ingredients || "[]"),
      instructions: Array.isArray(data.instructions) ? data.instructions : JSON.parse(data.instructions || "[]"),
      tags: Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags || "[]"),
      tips: Array.isArray(data.tips) ? data.tips : JSON.parse(data.tips || "[]"),
    };
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
