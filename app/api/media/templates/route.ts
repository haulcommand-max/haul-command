import { NextResponse } from "next/server";
import {
  ADGRID_CREATIVE_CATEGORY_LABELS,
  ADGRID_CREATIVE_TEMPLATES,
  listAdGridCreativePlatforms,
} from "@/lib/adgrid/creative-templates";
import { listMediaTemplates, MEDIA_OBJECT_TYPES, MEDIA_VIDEO_FORMATS } from "@/lib/contracts/mediaRender";

export async function GET() {
  return NextResponse.json({
    ok: true,
    object_types: MEDIA_OBJECT_TYPES,
    video_formats: MEDIA_VIDEO_FORMATS,
    templates: listMediaTemplates(),
    adGrid: {
      categories: ADGRID_CREATIVE_CATEGORY_LABELS,
      platforms: listAdGridCreativePlatforms(),
      templates: ADGRID_CREATIVE_TEMPLATES,
    },
  });
}
