// lib/ai/gemini.ts — HAUL COMMAND Gemini Client (lazy init)
import { GoogleGenAI } from "@google/genai";

let _instance: GoogleGenAI | null = null;

/**
 * Return the shared Gemini client. Throws at call time (not import time)
 * if GEMINI_API_KEY is missing—keeps the app buildable without the key.
 */
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
