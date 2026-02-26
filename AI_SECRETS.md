# AI Gateway Secrets

To enable the AI Gateway, you must set the `OPENAI_API_KEY` environment variable.

### Local Development
Add this line to your `.env.local` file:
```bash
OPENAI_API_KEY=sk-proj-... (your key here)
```

### Production (Vercel)
1. Go to your Project Settings > Environment Variables.
2. Add `OPENAI_API_KEY`.
3. Redeploy.

### Security Note
The API key is never exposed to the client browser. All calls go through `POST /api/ai/chat` which runs entirely on the server.
