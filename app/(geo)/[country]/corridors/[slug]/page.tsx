import CorridorPage, {
  generateMetadata as generateCorridorMetadata,
} from "@/app/corridors/[slug]/page";

type PageProps = {
  params: Promise<{
    country: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return generateCorridorMetadata({ params: Promise.resolve({ slug }) });
}

export default async function CountryCorridorPage({ params }: PageProps) {
  const { slug } = await params;
  return <CorridorPage params={Promise.resolve({ slug })} />;
}
