import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-internal-token");
  if (token !== env.INTERNAL_WORKER_TOKEN) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { path, tag } = await request.json();
    if (path) revalidatePath(path);
    if (tag) revalidateTag(tag);

    return NextResponse.json({ ok: true, revalidated: true, path, tag });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
}
