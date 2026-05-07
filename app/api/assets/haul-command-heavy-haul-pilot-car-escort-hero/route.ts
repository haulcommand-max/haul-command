export const runtime = "nodejs";
export const dynamic = "force-static";

const HERO_IMAGE_BASE64 = "PLACEHOLDER";

export async function GET() {
  const image = Buffer.from(HERO_IMAGE_BASE64, "base64");

  return new Response(image, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": 'inline; filename="haul-command-heavy-haul-pilot-car-escort-hero.jpg"',
      "X-Robots-Tag": "index, follow",
    },
  });
}
