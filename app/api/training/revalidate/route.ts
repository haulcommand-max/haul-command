import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const slug = typeof body.slug === "string" ? body.slug : null;
    const country = typeof body.country === "string" ? body.country : null;

    revalidatePath("/training");

    if (slug) revalidatePath(`/training/${slug}`);
    if (country) revalidatePath(`/training/countries/${country.toLowerCase()}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Revalidation failed" },
      { status: 500 }
    );
  }
}
