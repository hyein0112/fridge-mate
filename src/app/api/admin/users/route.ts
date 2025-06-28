import { NextResponse } from "next/server";

export async function GET() {
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!adminKey || !supabaseUrl) {
    return NextResponse.json({ error: "Supabase 환경변수 누락" }, { status: 500 });
  }
  // Supabase Admin API 호출
  const res = await fetch(`${supabaseUrl}/auth/v1/users`, {
    headers: {
      apiKey: adminKey,
      Authorization: `Bearer ${adminKey}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "유저 목록 조회 실패" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
