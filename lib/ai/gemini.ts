// lib/ai/gemini.ts — HAUL COMMAND Gemini Client (lazy init)
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";

let _instance: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (_instance) return _instance;
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY environment variable");
  _instance = new GoogleGenAI({ apiKey: key });
  return _instance;
}

/** Proxy object: access `.models` etc. the same way you would on GoogleGenAI. */
export const gemini = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    return (getGemini() as any)[prop];
  },
});

// Fast all-around model for image generation + editing
export const HC_IMAGE_MODEL = "gemini-2.0-flash-exp";

// ── New exports for article + SEO generation ──────────────────────────────────

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
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
  const prompt = `You are a seasoned heavy haul and oversize/overweight transportation expert.
Write a comprehensive article about "${topic}" for the ${country} market${role ? `, targeting ${role}s` : ''}.
Return ONLY valid JSON (no markdown):
{"title":"","meta_description":"","body_html":"","faq_items":[{"question":"","answer":""}],"schema_json":{},"internal_links":[]}`
  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(text)
}

export async function generateSEOPage(
  slug: string,
  keyword: string,
  country: string
): Promise<Partial<GeneratedArticle>> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
  const prompt = `Write SEO content for "${keyword}" targeting ${country}. Return ONLY valid JSON:
{"title":"","meta_description":"","body_html":"","schema_json":{}}`
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
      results.push({ job: jobs[i], result: await fn(jobs[i]) })
    } catch (error: any) {
      results.push({ job: jobs[i], error: error.message })
    }
  }
  return results
}
