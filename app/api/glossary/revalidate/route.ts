import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const term = typeof body.term === "string" ? body.term : null;
    const topic = typeof body.topic === "string" ? body.topic : null;
    const country = typeof body.country === "string" ? body.country : null;

    revalidatePath("/glossary");

    if (term) revalidatePath(`/glossary/\${term}`);
    if (topic) revalidatePath(`/glossary/topics/\${topic}`);
    if (country) revalidatePath(`/glossary/\${country.toLowerCase()}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Revalidation failed" }, { status: 500 });
  }
}
