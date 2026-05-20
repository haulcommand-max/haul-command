import { NextResponse } from "next/server";
import { resolveSupportRoles, type RoleNeedInput } from "@/lib/support/role-need-resolver";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RoleNeedInput;
    return NextResponse.json({
      ok: true,
      writesDatabase: false,
      resolution: resolveSupportRoles(body),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid role resolver payload" }, { status: 400 });
  }
}
