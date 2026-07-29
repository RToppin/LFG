import { NextResponse } from "next/server";
import { expireStalePosts } from "@/lib/expiration";

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  return Boolean(expected) && provided === `Bearer ${expected}`;
}

async function runExpirePosts(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await expireStalePosts();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return runExpirePosts(request);
}

export async function POST(request: Request) {
  return runExpirePosts(request);
}
