# Haul Command Media Command Center

The Media Command Center is the governance layer for video, image, voice, translation, SEO packets, linkable assets, and PR distribution.

## Engine Policy

- Remotion: default volume engine for structured Supabase data, training, glossary, regulation, corridor, report-card, and data-product media.
- HyperFrames: page, funnel, onboarding, sponsor preview, and UI walkthrough capture.
- Fly/Hugging Face utilities: transcription, OCR, embeddings, clustering, cheap TTS, UGC tagging, and caption/alt-text enrichment.
- HeyGen: premium conversion layer only. Avatar jobs require a clear money path, high human-needed score, and ROI/manual approval.
- GitHub Actions: audit, validate, and queue. Do not render heavy videos in CI.
- LiveKit: turns media and FAQ assets into consent-aware conversations. Do not use outbound journalist/source modes until DNC, consent, and signed webhook boundaries are verified.

Elai is retired for active generation and polling. The replacement split is HyperFrames for existing pages, Remotion for structured data, Fly/Hugging Face for utility AI, and HeyGen only for governed premium conversion work.

## Required Packet

Every serious video asset needs a ledger row, money path, CTA, transcript, captions, thumbnail, watch page, VideoObject schema, sitemap or video sitemap status, internal links, UTM tracking, and a LiveKit escalation CTA.

Every linkable asset needs methodology, source list, downloadable image, embed code, share button, short video, FAQ, UTM attribution, journalist pitch angle, and no-spam guardrails.

## Cost Rule

Paid avatar generation is blocked unless:

- the asset supports a real money path,
- `human_needed_score >= 80`,
- expected ROI is at least 25x or a human manually approves it,
- the job writes cost-governor metadata to `video_jobs` and `media_asset_ledger`.

Translations are winner-only. A configured provider key is not enough to fan out multilingual renders.
