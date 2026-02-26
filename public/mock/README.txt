Mock placeholder screens for screenshot overlay testing.
These are SVG placeholders so the app compiles before Stitch/real UI exports exist.

Files:
- match-screen.svg   (offer accept / fast match flow)
- earnings-screen.svg (weekly earnings + availability toggle)
- profile-screen.svg  (verified driver profile + compliance score)

Usage in ScreenshotOverlay:
  imageSrc="/mock/match-screen.svg"

Next.js serves /public/* at / automatically. No config needed.
