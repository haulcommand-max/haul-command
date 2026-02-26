# Haul Command — Local Development Guide

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
http://localhost:3000
```

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Visual Edit Mode (optional)

Add these to `.env.local` to enable the dev toolbar:

```bash
NEXT_PUBLIC_EDIT_MODE=true
# NEXT_PUBLIC_EDIT_MODE_WRITES=true  # Uncomment to enable writes (careful!)
```

## Visual Edit Mode

When `NEXT_PUBLIC_EDIT_MODE=true` and you're on localhost:

- **Floating toolbar** appears at bottom-right
- **Grid overlay** — toggle 8px grid
- **Spacing overlay** — press `Shift+E` to highlight element boundaries
- **Viewport presets** — switch between mobile/tablet/desktop views
- **Writes blocked** — yellow banner, no mutations to API

### Important Safety Rules

1. Edit mode **only works on localhost** — blocked on production hostnames
2. All API writes are **blocked by default** in edit mode
3. To enable writes, set `NEXT_PUBLIC_EDIT_MODE_WRITES=true` explicitly
4. The yellow banner `LOCAL VISUAL EDIT MODE — writes disabled` confirms safety

## Key Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/directory` | Provider directory |
| `/map` | Interactive map |
| `/admin/heat` | Admin heat dashboard |
| `/admin/control-tower` | Operations control tower |
| `/tools` | Tool suite index |
| `/tools/permit-calculator` | Permit cost estimator |
| `/tools/route-iq` | Route intelligence |

## Stub Mode

If Supabase keys aren't configured, data-dependent pages will show errors.
The map and directory will need valid Supabase credentials.
Static pages (landing, tools, glossary) work without credentials.

## Common Issues

| Problem | Fix |
|---|---|
| Port 3000 in use | `npm run dev -- -p 3001` |
| Supabase errors | Check `.env.local` has valid keys |
| Build fails | `npm run build` to see TypeScript errors |
| Middleware blocks | Edit mode is localhost-only by design |
