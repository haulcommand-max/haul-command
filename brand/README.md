# Brand Source Assets

Place your master logo file here:

- **`logo-source.svg`** (preferred — infinite scaling, crisp at all sizes)
- **`logo-source.png`** (fallback — use at least 1024×1024)

Then run:

```bash
npm run brand:generate
```

This generates all required icon sizes into `public/icons/` and copies the canonical logo into `public/brand/`.

## Generated outputs

| File | Size | Purpose |
|------|------|---------|
| `public/icons/app-icon-1024.png` | 1024×1024 | iOS/Android master icon |
| `public/icons/pwa-192.png` | 192×192 | PWA manifest |
| `public/icons/pwa-512.png` | 512×512 | PWA manifest |
| `public/icons/apple-touch-icon.png` | 180×180 | iOS home screen |
| `public/icons/favicon-16.png` | 16×16 | Browser tab |
| `public/icons/favicon-32.png` | 32×32 | Browser tab |
| `public/icons/favicon-48.png` | 48×48 | Browser tab |
| `public/brand/logo.svg` | Original | Site header, emails |

## Rules

- **One source of truth.** All sizes are generated from this one file.
- **Never commit generated icons.** Add `public/icons/` to `.gitignore` if you want CI to generate them.
- **SVG preferred.** PNG works but SVG scales perfectly and produces sharper small icons.
