import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const supabase = createServerClient();
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("clerk_user_id", userId).single();
  if (!profile?.is_admin) return new NextResponse("Unauthorized", { status: 401 });
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = file.name.split(".").pop();
  const path = `author/le-comte-de-sabatha.${ext}`;
  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from("covers").upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
