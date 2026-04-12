// app/(command)/dashboard/layout.tsx
// Server Component layout â€” wraps the dashboard to provide auth context
// The real userId injection is handled in page.tsx via a shared server util
// (layout children cannot receive props in Next.js App Router)
// This layout sets up the command frame/chrome

export const dynamic = 'force-dynamic'; // always re-render â€” auth-sensitive

export default function CommandDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Layout provides the command frame. userId is fetched inside page.tsx directly.
    return <>{children}</>;
}