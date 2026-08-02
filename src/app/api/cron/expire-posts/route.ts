import { NextResponse } from "next/server";
import { expireStalePosts } from "@/lib/expiration";

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await expireStalePosts();
  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({ ok: true, job: "expire-posts" });
}
