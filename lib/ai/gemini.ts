import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

// Legacy compatibility exports used by app/api/admin/ai routes
// gemini uses @google/genai (newer SDK) as expected by existing routes
export const HC_IMAGE_MODEL = 'gemini-2.0-flash-exp'
export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export interface GeneratedArticle {
  title: string
  meta_description: string
  body_html: string
  faq_items: Array<{ question: string; answer: string }>
  schema_json: object
  internal_links: string[]
}

export async function generateArticle(
  topic: string,
  country: string,
  role?: string
): Promise<GeneratedArticle> {
  const prompt = buildArticlePrompt(topic, country, role)
  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(text)
}

export async function generateSEOPage(
  slug: string,
  keyword: string,
  country: string
): Promise<Partial<GeneratedArticle>> {
  const prompt = `You are an expert heavy haul transportation content writer.

Write SEO-optimized page content for the keyword "${keyword}" targeting the ${country} market.

Return ONLY valid JSON:
{
  "title": "page title under 60 chars",
  "meta_description": "meta description under 155 chars",
  "body_html": "full page HTML content, 800-1200 words, with h2/h3 structure",
  "schema_json": { "@context": "https://schema.org", "@type": "WebPage" }
}

Requirements:
- Include ${country}-specific regulations, requirements, permits
- Target operators, brokers, and pilot car operators
- Include geographic specifics (state/province if applicable)
- No filler — every sentence must be informative`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(text)
}

export async function generateBatch<T>(
  jobs: T[],
  fn: (job: T) => Promise<any>,
  ratePerMinute = 10
): Promise<Array<{ job: T; result?: any; error?: string }>> {
  const results = []
  const delayMs = Math.ceil(60000 / ratePerMinute)

  for (let i = 0; i < jobs.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, delayMs))
    try {
      const result = await fn(jobs[i])
      results.push({ job: jobs[i], result })
    } catch (error: any) {
      results.push({ job: jobs[i], error: error.message })
    }
  }
  return results
}

function buildArticlePrompt(topic: string, country: string, role?: string): string {
  return `You are a seasoned heavy haul and oversize/overweight transportation expert with 20+ years in the industry.

Write a comprehensive, authoritative article about "${topic}" for the ${country} market${role ? `, targeting ${role}s` : ''}.

Return ONLY valid JSON (no markdown, no preamble):
{
  "title": "compelling article title under 70 chars",
  "meta_description": "meta description under 155 chars",
  "body_html": "complete article HTML, 1200-1800 words, with proper h2/h3/p structure",
  "faq_items": [
    { "question": "...", "answer": "..." }
  ],
  "schema_json": {
    "@context": "https://schema.org",
    "@type": "Article",
    "name": "title here"
  },
  "internal_links": ["suggested internal link paths like /permits/texas"]
}

Requirements:
- ${country}-specific regulations, permit requirements, legal weight limits
- Practical operational advice, not generic content
- Include specific dollar amounts, distances, or weights where relevant
- FAQ section with at least 4 questions
- No padding — every paragraph must add value`
}
