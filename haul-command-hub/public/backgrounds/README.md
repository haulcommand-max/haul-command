# Haul Command background assets

Place the approved generated background image at this exact path:

```text
haul-command-hub/public/backgrounds/haul-command-golden-grunge-bg.png
```

The root layout already imports `src/app/haul-command-background.css`, which references the image as:

```css
url("/backgrounds/haul-command-golden-grunge-bg.png")
```

Visual contract:

- Use the image as-is.
- Do not add a full-page overlay.
- Do not darken, tint, blur, recolor, crop, regenerate, or opacity-reduce the background.
- Keep card and panel backgrounds only where needed for readability.
