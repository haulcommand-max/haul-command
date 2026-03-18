import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ corridor: string }>;
}

export default async function LegacyCorridorRedirect({ params }: PageProps) {
    const { corridor } = await params;
    redirect(`/corridor/${corridor}`);
}
