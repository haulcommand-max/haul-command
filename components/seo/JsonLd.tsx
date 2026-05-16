// components/seo/JsonLd.tsx
// Reusable JSON-LD structured data component for all page types

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[] | null | undefined;
}

export function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
