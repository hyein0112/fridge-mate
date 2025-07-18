import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }
  const { data, error } = await supabase.from("ingredients").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }
    const insertData = {
      ...body,
      expiry_date: body.expiryDate ? new Date(body.expiryDate) : null,
    };
    delete insertData.expiryDate;
    const { data, error } = await supabase.from("ingredients").insert([insertData]).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id || !body.user_id) {
      return NextResponse.json({ error: "id and user_id are required" }, { status: 400 });
    }
    const updateData = {
      ...body,
      expiry_date: body.expiryDate ? new Date(body.expiryDate) : null,
    };
    delete updateData.expiryDate;
    const { data, error } = await supabase
      .from("ingredients")
      .update(updateData)
      .eq("id", body.id)
      .eq("user_id", body.user_id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id || !body.user_id) {
      return NextResponse.json({ error: "id and user_id are required" }, { status: 400 });
    }
    const { error } = await supabase.from("ingredients").delete().eq("id", body.id).eq("user_id", body.user_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
