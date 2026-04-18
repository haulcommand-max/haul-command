import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HCContentPageShell, HCContentContainer, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { HCEditorialHero } from "@/components/content-system/heroes/HCEditorialHero";
import { HCButton } from "@/components/content-system/callouts/HCButton";
import { ArrowLeft, ArrowRight, Clock, Calendar } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// BLOG ARTICLE DETAIL PAGE
// Route: /blog/[slug]
// Fetches article from hc_blog_articles table by slug.
// Falls back to 404 if not found.
// ══════════════════════════════════════════════════════════════

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const supabase = createClient();
  const { data: article, error } = await supabase
    .from("hc_blog_articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !article) return null;
  return article;
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Article Not Found | Haul Command" };
  }

  return {
    title: `${article.title} | Haul Command Intelligence`,
    description: article.excerpt || article.title,
    alternates: {
      canonical: `https://www.haulcommand.com/blog/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      url: `https://www.haulcommand.com/blog/${slug}`,
      images: article.hero_image_url
        ? [{ url: article.hero_image_url, width: 1200, height: 630 }]
        : [{ url: "/images/blog_hero_bg.png", width: 1200, height: 630 }],
      type: "article",
      publishedTime: article.published_at,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || article.title,
      images: [article.hero_image_url || "/images/blog_hero_bg.png"],
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // JSON-LD structured data for the article
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || article.title,
    image: article.hero_image_url || "/images/blog_hero_bg.png",
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      "@type": "Organization",
      name: "Haul Command",
      url: "https://www.haulcommand.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Haul Command",
      logo: {
        "@type": "ImageObject",
        url: "https://www.haulcommand.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.haulcommand.com/blog/${slug}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.haulcommand.com" },
      { "@type": "ListItem", position: 2, name: "Intelligence Hub", item: "https://www.haulcommand.com/blog" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://www.haulcommand.com/blog/${slug}` },
    ],
  };

  return (
    <HCContentPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Breadcrumb navigation */}
      <HCContentSection className="pt-6 pb-2">
        <HCContentContainer>
          <nav className="flex items-center gap-2 text-xs text-[#6B7280]">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Intelligence Hub</Link>
            <span>/</span>
            <span className="text-[#9CA3AF] truncate max-w-[200px]">{article.title}</span>
          </nav>
        </HCContentContainer>
      </HCContentSection>

      {/* Hero */}
      <HCEditorialHero
        title={article.title}
        description={article.excerpt || ""}
        imageUrl={article.hero_image_url || "/images/blog_hero_bg.png"}
        metaRow={
          <div className="flex items-center gap-4 mt-2 text-[#9CA3AF] text-sm">
            {publishedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {publishedDate}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              5 min read
            </span>
          </div>
        }
      />

      {/* Article body */}
      <HCContentSection className="py-12 md:py-20">
        <HCContentContainer>
          <article className="max-w-3xl mx-auto">
            {/* Render article body content */}
            {article.body_html ? (
              <div
                className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-[#D1D5DB] prose-a:text-[#C6923A] prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-blockquote:border-[#C6923A]/30 prose-blockquote:text-[#9CA3AF] prose-code:text-[#C6923A]"
                dangerouslySetInnerHTML={{ __html: article.body_html }}
              />
            ) : article.body_markdown ? (
              <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-[#D1D5DB] prose-a:text-[#C6923A]">
                <p className="text-[#D1D5DB] text-lg leading-[1.8]">{article.body_markdown}</p>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-[#6B7280] text-lg">This article is being prepared. Check back soon.</p>
              </div>
            )}
          </article>
        </HCContentContainer>
      </HCContentSection>

      {/* Back to blog + CTA */}
      <HCContentSection className="pb-20 border-t border-[rgba(255,255,255,0.06)] pt-12">
        <HCContentContainer>
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
            <Link
              href="/blog"
              className="flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Intelligence Hub
            </Link>
            <div className="flex gap-3">
              <HCButton href="/directory" variant="primary">
                Find Operators <ArrowRight className="w-4 h-4 ml-2" />
              </HCButton>
              <HCButton href="/claim" variant="ghost">
                Claim Listing
              </HCButton>
            </div>
          </div>
        </HCContentContainer>
      </HCContentSection>
    </HCContentPageShell>
  );
}
