import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isInternalRequest } from "@/lib/auth/internal-request";

export async function POST(request: NextRequest) {
  if (!isInternalRequest(request.headers)) {
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
