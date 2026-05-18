import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ resource: string }> }) {
    const { resource } = await params;

    return NextResponse.json(
        {
            error: "public_resource_not_available",
            resource,
            status: "requires_product_api_contract",
            message:
                "This public v1 resource endpoint is disabled until it is backed by an authenticated API-key contract and public-safe response projection.",
        },
        { status: 501 }
    );
}
