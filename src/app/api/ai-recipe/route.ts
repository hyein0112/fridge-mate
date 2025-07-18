import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const aiRecipe = await aiService.generateRecipe(body);
    return NextResponse.json(aiRecipe);
  } catch (err) {
    console.error("AI 레시피 생성 API 오류:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
