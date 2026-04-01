export default function OperatorSchema({ name, rating, reviewCount }: { name: string; rating: number; reviewCount: number }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": name,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": rating.toString(),
      "reviewCount": reviewCount.toString(),
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
